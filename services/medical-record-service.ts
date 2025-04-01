import { db } from "@/db";
import { historique, patient } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { deleteCache, deleteCacheByPattern, withCache } from "@/lib/cache";
import type {
  CreateMedicalRecordInput,
  MedicalRecordQueryParams,
  UpdateMedicalRecordInput,
} from "@/schemas/medical-record";
import { and, asc, desc, eq, gte, lte, SQL, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class MedicalRecordService {
  /**
   * Get medical records for a patient with pagination and filtering
   */
  static async getMedicalRecords(
    patientId: string,
    params: MedicalRecordQueryParams
  ) {
    const { page, limit, type, startDate, endDate, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    // Build the cache key based on query parameters
    const cacheKey = `patients:${patientId}:records:${page}:${limit}:${
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
      const filters = [whereClause];

      if (type) {
        filters.push(eq(historique.type, type));
      }

      if (startDate) {
        filters.push(gte(historique.date, new Date(startDate)));
      }

      if (endDate) {
        filters.push(lte(historique.date, new Date(endDate)));
      }

      whereClause = and(...filters) as SQL<unknown>;

      // Build the order by clause
      const orderBy = (() => {
        const direction = sortOrder === "asc" ? asc : desc;

        switch (sortBy) {
          case "date":
            return direction(historique.date);
          case "type":
            return direction(historique.type);
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
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    });
  }

  /**
   * Get a medical record by ID
   */
  static async getMedicalRecordById(id: string) {
    const cacheKey = `records:${id}`;

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
  static async createMedicalRecord(data: CreateMedicalRecordInput) {
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
        date: new Date(date),
        title,
        description,
        type,
        medecin,
        createdAt: now,
        updatedAt: now,
      });

      // Invalidate cache
      await deleteCacheByPattern(`patients:${patientId}:records:*`);

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
  static async updateMedicalRecord(id: string, data: UpdateMedicalRecordInput) {
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
      await deleteCache(`records:${id}`);
      await deleteCacheByPattern(
        `patients:${existingRecord.patientId}:records:*`
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
      await deleteCache(`records:${id}`);
      await deleteCacheByPattern(
        `patients:${existingRecord.patientId}:records:*`
      );

      return { success: true };
    } catch (error) {
      console.error("Error deleting medical record:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to delete medical record");
    }
  }
}
