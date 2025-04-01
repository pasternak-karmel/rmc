import { db } from "@/db";
import { historique, patient } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { deleteCache, deleteCacheByPattern, withCache } from "@/lib/cache";
import { and, asc, desc, eq, gte, lte, type SQL, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface MedicalRecordFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export class MedicalHistoryService {
  /**
   * Get medical records for a patient with pagination and filtering
   */
  static async getMedicalHistory(
    patientId: string,
    filters: MedicalRecordFilters = {}
  ) {
    const {
      type,
      startDate,
      endDate,
      sortBy = "date",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = filters;

    const offset = (page - 1) * limit;

    // Build the cache key based on query parameters
    const cacheKey = `patients:${patientId}:history:${page}:${limit}:${
      type || ""
    }:${startDate || ""}:${endDate || ""}:${sortBy}:${sortOrder}`;

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
      let whereClause = eq(historique.patientId, patientId);
      const filterConditions = [whereClause];

      if (type) {
        filterConditions.push(eq(historique.type, type));
      }

      if (startDate) {
        filterConditions.push(gte(historique.date, new Date(startDate)));
      }

      if (endDate) {
        filterConditions.push(lte(historique.date, new Date(endDate)));
      }

      whereClause = and(...filterConditions) as SQL<unknown>;

      // Build the order by clause
      const orderBy = (() => {
        const direction = sortOrder === "asc" ? asc : desc;

        switch (sortBy) {
          case "date":
            return direction(historique.date);
          case "type":
            return direction(historique.type);
          case "title":
            return direction(historique.title);
          default:
            return direction(historique.date);
        }
      })();

      // Execute the query
      const records = await db
        .select()
        .from(historique)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(historique)
        .where(whereClause);

      return {
        data: records,
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
   * Get a medical record by ID
   */
  static async getMedicalRecordById(id: string) {
    const cacheKey = `medical-records:${id}`;

    return withCache(cacheKey, async () => {
      const [record] = await db
        .select()
        .from(historique)
        .where(eq(historique.id, id));

      if (!record) {
        throw ApiError.notFound(`Medical record with ID ${id} not found`);
      }

      return record;
    });
  }

  /**
   * Create a new medical record
   */
  static async createMedicalRecord(data: {
    patientId: string;
    date: string;
    title: string;
    description: string;
    type: string;
    medecin: string;
  }) {
    const { patientId, date, title, description, type, medecin } = data;
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

      // Insert medical record
      await db.insert(historique).values({
        id,
        patientId,
        title,
        date: new Date(date),
        description,
        type,
        medecin,
        createdAt: now,
        updatedAt: now,
      });

      // Invalidate cache
      await deleteCacheByPattern(`patients:${patientId}:history:*`);

      // Get the created record
      return this.getMedicalRecordById(id);
    } catch (error) {
      console.error("Error creating medical record:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to create medical record");
    }
  }

  /**
   * Update a medical record
   */
  static async updateMedicalRecord(
    id: string,
    data: Partial<{
      date: string;
      title: string;
      description: string;
      type: string;
      medecin: string;
    }>
  ) {
    const now = new Date();

    try {
      // Check if record exists
      const existingRecord = await this.getMedicalRecordById(id);

      // Prepare update fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateFields: any = {
        updatedAt: now,
      };

      if (data.date) updateFields.date = new Date(data.date);
      if (data.title) updateFields.title = data.title;
      if (data.description) updateFields.description = data.description;
      if (data.type) updateFields.type = data.type;
      if (data.medecin) updateFields.medecin = data.medecin;

      // Update record
      await db
        .update(historique)
        .set(updateFields)
        .where(eq(historique.id, id));

      // Invalidate cache
      await deleteCache(`medical-records:${id}`);
      await deleteCacheByPattern(
        `patients:${existingRecord.patientId}:history:*`
      );

      // Get the updated record
      return this.getMedicalRecordById(id);
    } catch (error) {
      console.error("Error updating medical record:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to update medical record");
    }
  }

  /**
   * Delete a medical record
   */
  static async deleteMedicalRecord(id: string) {
    try {
      // Check if record exists
      const existingRecord = await this.getMedicalRecordById(id);

      // Delete record
      await db.delete(historique).where(eq(historique.id, id));

      // Invalidate cache
      await deleteCache(`medical-records:${id}`);
      await deleteCacheByPattern(
        `patients:${existingRecord.patientId}:history:*`
      );

      return { success: true, message: "Medical record deleted successfully" };
    } catch (error) {
      console.error("Error deleting medical record:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to delete medical record");
    }
  }

  /**
   * Get statistics about medical records for a patient
   */
  static async getMedicalHistoryStats(patientId: string) {
    const cacheKey = `patients:${patientId}:history:stats`;

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

        // Get count by type
        const typeStats = await db
          .select({
            type: historique.type,
            count: sql<number>`count(*)`,
          })
          .from(historique)
          .where(eq(historique.patientId, patientId))
          .groupBy(historique.type);

        // Get count by month (last 12 months)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const monthlyStats = await db
          .select({
            month: sql<string>`to_char(${historique.date}, 'YYYY-MM')`,
            count: sql<number>`count(*)`,
          })
          .from(historique)
          .where(
            and(
              eq(historique.patientId, patientId),
              gte(historique.date, oneYearAgo)
            )
          )
          .groupBy(sql`to_char(${historique.date}, 'YYYY-MM')`)
          .orderBy(sql`to_char(${historique.date}, 'YYYY-MM')`);

        // Get latest record
        const [latestRecord] = await db
          .select()
          .from(historique)
          .where(eq(historique.patientId, patientId))
          .orderBy(desc(historique.date))
          .limit(1);

        return {
          totalRecords: typeStats.reduce(
            (sum, stat) => sum + Number(stat.count),
            0
          ),
          typeDistribution: typeStats,
          monthlyDistribution: monthlyStats,
          latestRecord,
        };
      },
      300
    ); // Cache for 5 minutes
  }
}
