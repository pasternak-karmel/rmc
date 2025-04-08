import { db } from "@/db";
import { patient, vitalSigns } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { deleteCache, deleteCacheByPattern, withCache } from "@/lib/cache";
import { and, asc, desc, eq, gte, lte, type SQL, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface VitalSignFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface VitalSignData {
  type: string;
  value: number;
  unit: string;
}

export interface CreateVitalSignInput {
  patientId: string;
  date: string;
  measurements: VitalSignData[];
  notes?: string;
}

export class VitalSignsService {
  /**
   * Get vital signs for a patient with pagination and filtering
   */
  static async getVitalSigns(
    patientId: string,
    filters: VitalSignFilters = {}
  ) {
    const {
      type,
      startDate,
      endDate,
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = filters;

    const offset = (page - 1) * limit;

    // Build the cache key based on query parameters
    const cacheKey = `patients:${patientId}:vitals:${page}:${limit}:${
      type || ""
    }:${startDate || ""}:${endDate || ""}:${sortOrder}`;

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
      let whereClause = eq(vitalSigns.patientId, patientId);
      const filterConditions = [whereClause];

      if (type) {
        filterConditions.push(
          sql`${vitalSigns.measurements}::jsonb @> '[{"type": "${type}"}]'`
        );
      }

      if (startDate) {
        filterConditions.push(gte(vitalSigns.date, new Date(startDate)));
      }

      if (endDate) {
        filterConditions.push(lte(vitalSigns.date, new Date(endDate)));
      }

      whereClause = and(...filterConditions) as SQL<unknown>;

      // Build the order by clause
      const orderBy =
        sortOrder === "asc" ? asc(vitalSigns.date) : desc(vitalSigns.date);

      // Execute the query
      const results = await db
        .select()
        .from(vitalSigns)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(vitalSigns)
        .where(whereClause);

      return {
        data: results,
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
   * Get a vital sign record by ID
   */
  static async getVitalSignById(id: string) {
    const cacheKey = `vital-signs:${id}`;

    return withCache(cacheKey, async () => {
      const [result] = await db
        .select()
        .from(vitalSigns)
        .where(eq(vitalSigns.id, id));

      if (!result) {
        throw ApiError.notFound(`Vital sign record with ID ${id} not found`);
      }

      return result;
    });
  }

  /**
   * Create a new vital sign record
   */
  static async createVitalSign(data: CreateVitalSignInput) {
    const { patientId, date, measurements, notes } = data;
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

      // Insert vital sign record
      await db.insert(vitalSigns).values({
        id,
        patientId,
        date: new Date(date),
        measurements: JSON.stringify(measurements),
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      });

      // Invalidate cache
      await deleteCacheByPattern(`patients:${patientId}:vitals:*`);

      // Get the created record
      return this.getVitalSignById(id);
    } catch (error) {
      console.error("Error creating vital sign record:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to create vital sign record");
    }
  }

  /**
   * Update a vital sign record
   */
  static async updateVitalSign(
    id: string,
    data: Partial<{
      date: string;
      measurements: VitalSignData[];
      notes?: string;
    }>
  ) {
    const now = new Date();

    try {
      // Check if record exists
      const existingRecord = await this.getVitalSignById(id);

      // Prepare update fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateFields: any = {
        updatedAt: now,
      };

      if (data.date) updateFields.date = new Date(data.date);
      if (data.measurements)
        updateFields.measurements = JSON.stringify(data.measurements);
      if (data.notes !== undefined) updateFields.notes = data.notes || null;

      // Update record
      await db
        .update(vitalSigns)
        .set(updateFields)
        .where(eq(vitalSigns.id, id));

      // Invalidate cache
      await deleteCache(`vital-signs:${id}`);
      await deleteCacheByPattern(
        `patients:${existingRecord.patientId}:vitals:*`
      );

      // Get the updated record
      return this.getVitalSignById(id);
    } catch (error) {
      console.error("Error updating vital sign record:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to update vital sign record");
    }
  }

  /**
   * Delete a vital sign record
   */
  static async deleteVitalSign(id: string) {
    try {
      // Check if record exists
      const existingRecord = await this.getVitalSignById(id);

      // Delete record
      await db.delete(vitalSigns).where(eq(vitalSigns.id, id));

      // Invalidate cache
      await deleteCache(`vital-signs:${id}`);
      await deleteCacheByPattern(
        `patients:${existingRecord.patientId}:vitals:*`
      );

      return {
        success: true,
        message: "Vital sign record deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting vital sign record:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to delete vital sign record");
    }
  }

  /**
   * Get vital sign trends for a specific type
   */
  static async getVitalSignTrends(patientId: string, type: string) {
    const cacheKey = `patients:${patientId}:vitals:trends:${type}`;

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

        // Get all vital sign records for this patient
        const records = await db
          .select({
            id: vitalSigns.id,
            date: vitalSigns.date,
            measurements: vitalSigns.measurements,
          })
          .from(vitalSigns)
          .where(eq(vitalSigns.patientId, patientId))
          .orderBy(asc(vitalSigns.date));

        // Extract the specific vital sign values from each record
        const trends = records
          .map((record) => {
            const parsedMeasurements =
              typeof record.measurements === "string"
                ? JSON.parse(record.measurements)
                : record.measurements;
            const measurement = parsedMeasurements.find(
              (m: VitalSignData) => m.type.toLowerCase() === type.toLowerCase()
            );

            return {
              date: record.date,
              value: measurement?.value || null,
              unit: measurement?.unit || null,
            };
          })
          .filter((item) => item.value !== null);

        return trends;
      },
      300
    ); // Cache for 5 minutes
  }

  /**
   * Get all available vital sign types for a patient
   */
  static async getAvailableVitalSignTypes(patientId: string) {
    const cacheKey = `patients:${patientId}:vitals:types`;

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

        // Get all vital sign records for this patient
        const records = await db
          .select({
            measurements: vitalSigns.measurements,
          })
          .from(vitalSigns)
          .where(eq(vitalSigns.patientId, patientId));

        // Extract all unique vital sign types
        const types = new Set<string>();

        records.forEach((record) => {
          // const parsedMeasurements = JSON.parse(
          //   record.measurements as unknown as string
          // );

          const parsedMeasurements =
            typeof record.measurements === "string"
              ? JSON.parse(record.measurements)
              : record.measurements;

          parsedMeasurements.forEach((m: VitalSignData) => {
            types.add(m.type);
          });
        });

        return Array.from(types).sort();
      },
      300
    ); // Cache for 5 minutes
  }
}
