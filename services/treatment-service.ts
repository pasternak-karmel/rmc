import { db } from "@/db";
import { patient, patientTraitement } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { deleteCache, deleteCacheByPattern, withCache } from "@/lib/cache";
import { and, asc, desc, eq, gte, lte, type SQL, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface TreatmentFilters {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CreateTreatmentInput {
  patientId: string;
  medicament: string;
  category: string;
  posologie: string;
  frequence: string;
  startDate: string;
  endDate?: string;
  status?: string;
  medecin: string;
  notes?: string;
  interactions?: boolean;
}

export class TreatmentService {
  /**
   * Get treatments for a patient with pagination and filtering
   */
  static async getTreatments(
    patientId: string,
    filters: TreatmentFilters = {}
  ) {
    const {
      category,
      status,
      startDate,
      endDate,
      sortBy = "startDate",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = filters;

    const offset = (page - 1) * limit;

    // Build the cache key based on query parameters
    const cacheKey = `patients:${patientId}:treatments:${page}:${limit}:${
      category || ""
    }:${status || ""}:${startDate || ""}:${
      endDate || ""
    }:${sortBy}:${sortOrder}`;

    return withCache(cacheKey, async () => {
      // Check if patient exists
      const [patientExists] = await db
        .select({ id: patient.id })
        .from(patient)
        .where(eq(patient.id, patientId));

      if (!patientExists) {
        throw ApiError.notFound(`Patient with ID ${patientId} not found`);
      }

      // Build the where clause based on filters
      let whereClause = eq(patientTraitement.patientId, patientId);
      const filterConditions = [whereClause];

      if (category) {
        filterConditions.push(eq(patientTraitement.category, category));
      }

      if (status) {
        filterConditions.push(eq(patientTraitement.status, status));
      }

      if (startDate) {
        filterConditions.push(gte(patientTraitement.date, new Date(startDate)));
      }

      if (endDate) {
        filterConditions.push(lte(patientTraitement.date, new Date(endDate)));
      }

      whereClause = and(...filterConditions) as SQL<unknown>;

      // Build the order by clause
      const orderBy = (() => {
        const direction = sortOrder === "asc" ? asc : desc;

        switch (sortBy) {
          case "medicament":
            return direction(patientTraitement.medicament);
          case "category":
            return direction(patientTraitement.category);
          case "startDate":
            return direction(patientTraitement.date);
          default:
            return direction(patientTraitement.date);
        }
      })();

      // Execute the query
      const treatments = await db
        .select()
        .from(patientTraitement)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(patientTraitement)
        .where(whereClause);

      return {
        data: treatments,
        pagination: {
          page,
          limit,
          totalItems: Number(count),
          totalPages: Math.ceil(Number(count) / limit),
        },
      };
    });
  }

  /**
   * Get a treatment by ID
   */
  static async getTreatmentById(id: string) {
    const cacheKey = `treatments:${id}`;

    return withCache(cacheKey, async () => {
      const [treatment] = await db
        .select()
        .from(patientTraitement)
        .where(eq(patientTraitement.id, id));

      if (!treatment) {
        throw ApiError.notFound(`Treatment with ID ${id} not found`);
      }

      return treatment;
    });
  }

  /**
   * Create a new treatment
   */
  static async createTreatment(data: CreateTreatmentInput) {
    const {
      patientId,
      medicament,
      category,
      posologie,
      frequence,
      startDate,
      endDate,
      status = "active",
      medecin,
      notes,
      interactions = false,
    } = data;

    const id = uuidv4();
    const now = new Date();

    try {
      // Check if patient exists
      const [patientExists] = await db
        .select({ id: patient.id })
        .from(patient)
        .where(eq(patient.id, patientId));

      if (!patientExists) {
        throw ApiError.notFound(`Patient with ID ${patientId} not found`);
      }

      // Insert treatment
      await db.insert(patientTraitement).values({
        id,
        patientId,
        medicament,
        category,
        posologie,
        frequence,
        date: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status,
        medecin,
        notes: notes || null,
        interactions,
        createdAt: now,
        updatedAt: now,
      });

      // Invalidate cache
      await deleteCacheByPattern(`patients:${patientId}:treatments:*`);

      // Get the created treatment
      return this.getTreatmentById(id);
    } catch (error) {
      console.error("Error creating treatment:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to create treatment");
    }
  }

  /**
   * Update a treatment
   */
  static async updateTreatment(
    id: string,
    data: Partial<CreateTreatmentInput>
  ) {
    const now = new Date();

    try {
      // Check if treatment exists
      const existingTreatment = await this.getTreatmentById(id);

      // Prepare update fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateFields: any = {
        updatedAt: now,
      };

      if (data.medicament) updateFields.medicament = data.medicament;
      if (data.category) updateFields.category = data.category;
      if (data.posologie) updateFields.posologie = data.posologie;
      if (data.frequence) updateFields.frequence = data.frequence;
      if (data.startDate) updateFields.date = new Date(data.startDate);
      if (data.endDate !== undefined)
        updateFields.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.status) updateFields.status = data.status;
      if (data.medecin) updateFields.medecin = data.medecin;
      if (data.notes !== undefined) updateFields.notes = data.notes || null;
      if (data.interactions !== undefined)
        updateFields.interactions = data.interactions;

      // Update treatment
      await db
        .update(patientTraitement)
        .set(updateFields)
        .where(eq(patientTraitement.id, id));

      // Invalidate cache
      await deleteCache(`treatments:${id}`);
      await deleteCacheByPattern(
        `patients:${existingTreatment.patientId}:treatments:*`
      );

      // Get the updated treatment
      return this.getTreatmentById(id);
    } catch (error) {
      console.error("Error updating treatment:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to update treatment");
    }
  }

  /**
   * Delete a treatment
   */
  static async deleteTreatment(id: string) {
    try {
      // Check if treatment exists
      const existingTreatment = await this.getTreatmentById(id);

      // Delete treatment
      await db.delete(patientTraitement).where(eq(patientTraitement.id, id));

      // Invalidate cache
      await deleteCache(`treatments:${id}`);
      await deleteCacheByPattern(
        `patients:${existingTreatment.patientId}:treatments:*`
      );

      return { success: true, message: "Treatment deleted successfully" };
    } catch (error) {
      console.error("Error deleting treatment:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to delete treatment");
    }
  }

  /**
   * Get active treatments for a patient
   */
  static async getActiveTreatments(patientId: string) {
    const cacheKey = `patients:${patientId}:treatments:active`;

    return withCache(
      cacheKey,
      async () => {
        // Check if patient exists
        const [patientExists] = await db
          .select({ id: patient.id })
          .from(patient)
          .where(eq(patient.id, patientId));

        if (!patientExists) {
          throw ApiError.notFound(`Patient with ID ${patientId} not found`);
        }

        // Get active treatments
        const treatments = await db
          .select()
          .from(patientTraitement)
          .where(
            and(
              eq(patientTraitement.patientId, patientId),
              eq(patientTraitement.status, "active")
            )
          )
          .orderBy(asc(patientTraitement.medicament));

        return treatments;
      },
      300
    ); // Cache for 5 minutes
  }

  /**
   * Get treatment statistics for a patient
   */
  static async getTreatmentStats(patientId: string) {
    const cacheKey = `patients:${patientId}:treatments:stats`;

    return withCache(
      cacheKey,
      async () => {
        // Check if patient exists
        const [patientExists] = await db
          .select({ id: patient.id })
          .from(patient)
          .where(eq(patient.id, patientId));

        if (!patientExists) {
          throw ApiError.notFound(`Patient with ID ${patientId} not found`);
        }

        // Get count by category
        const categoryStats = await db
          .select({
            category: patientTraitement.category,
            count: sql<number>`count(*)`,
          })
          .from(patientTraitement)
          .where(eq(patientTraitement.patientId, patientId))
          .groupBy(patientTraitement.category);

        // Get count by status
        const statusStats = await db
          .select({
            status: patientTraitement.status,
            count: sql<number>`count(*)`,
          })
          .from(patientTraitement)
          .where(eq(patientTraitement.patientId, patientId))
          .groupBy(patientTraitement.status);

        // Get treatments with interactions
        const interactionsCount = await db
          .select({
            count: sql<number>`count(*)`,
          })
          .from(patientTraitement)
          .where(
            and(
              eq(patientTraitement.patientId, patientId),
              eq(patientTraitement.interactions, true),
              eq(patientTraitement.status, "active")
            )
          );

        return {
          totalTreatments: categoryStats.reduce(
            (sum, stat) => sum + Number(stat.count),
            0
          ),
          activeTreatments:
            statusStats.find((s) => s.status === "active")?.count || 0,
          discontinuedTreatments:
            statusStats.find((s) => s.status === "discontinued")?.count || 0,
          categoryDistribution: categoryStats,
          interactionsCount: interactionsCount[0]?.count || 0,
        };
      },
      300
    ); // Cache for 5 minutes
  }
}
