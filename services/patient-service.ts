/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import {
  historique,
  infoMedical,
  patient,
  patientTraitement,
} from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { deleteCache, deleteCacheByPattern, withCache } from "@/lib/cache";
import { calculateAge, formatDate } from "@/lib/utils";
import type {
  CreatePatientInput,
  PatientQueryParams,
  UpdatePatientInput,
} from "@/schemas/patient";
import { and, asc, desc, eq, ilike, inArray, like, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export class PatientService {
  /**
   * Get all patients with filtering, sorting, and pagination
   */
  static async getPatients(params?: PatientQueryParams) {
    const {
      page = 1,
      limit = 10,
      search,
      stage,
      status,
      sortBy = "name",
      sortOrder = "asc",
    } = params || {};

    const offset = (page - 1) * limit;
    const cacheKey = `patients:list:${page}:${limit}:${search || ""}:${
      stage || ""
    }:${status || ""}:${sortBy}:${sortOrder}`;

    return withCache(cacheKey, async () => {
      // Build the where clause based on filters
      let whereClause = undefined;
      const filters = [];

      if (search) {
        filters.push(
          or(
            ilike(patient.firstname, `%${search}%`),
            ilike(patient.lastname, `%${search}%`),
            ilike(patient.email, `%${search}%`)
          )
        );
      }

      if (stage) {
        filters.push(eq(infoMedical.stade, Number(stage)));
      }

      if (status) {
        filters.push(eq(infoMedical.status, status));
      }

      if (filters.length > 0) {
        whereClause = and(...filters);
      }

      // Build the order by clause
      const orderBy = (() => {
        const direction = sortOrder === "asc" ? asc : desc;

        switch (sortBy) {
          case "name":
            return [direction(patient.lastname), direction(patient.firstname)];
          case "stage":
            return [direction(infoMedical.stade)];
          case "dfg":
            return [direction(infoMedical.dfg)];
          case "lastVisit":
            return [direction(infoMedical.lastvisite)];
          default:
            return [direction(patient.lastname)];
        }
      })();

      // Execute the query
      const patients = await db
        .select({
          id: patient.id,
          firstname: patient.firstname,
          lastname: patient.lastname,
          birthdate: patient.birthdate,
          email: patient.email,
          sex: patient.sex,
          phone: patient.phone,
          address: patient.address,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
          medicalInfo: {
            id: infoMedical.id,
            stade: infoMedical.stade,
            status: infoMedical.status,
            medecin: infoMedical.medecin,
            dfg: infoMedical.dfg,
            previousDfg: infoMedical.previousDfg,
            proteinurie: infoMedical.proteinurie,
            previousProteinurie: infoMedical.previousProteinurie,
            lastvisite: infoMedical.lastvisite,
            nextvisite: infoMedical.nextvisite,
          },
        })
        .from(patient)
        .leftJoin(infoMedical, eq(patient.id, infoMedical.patientId))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(patient)
        .leftJoin(infoMedical, eq(patient.id, infoMedical.patientId))
        .where(whereClause);

      return {
        data: patients,
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
   * Get a patient by ID with all related information
   */
  static async getPatientById(id: string) {
    const cacheKey = `patients:${id}`;

    return withCache(cacheKey, async () => {
      const [result] = await db
        .select({
          id: patient.id,
          firstname: patient.firstname,
          lastname: patient.lastname,
          birthdate: patient.birthdate,
          email: patient.email,
          sex: patient.sex,
          phone: patient.phone,
          address: patient.address,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
          medicalInfo: {
            id: infoMedical.id,
            stade: infoMedical.stade,
            status: infoMedical.status,
            medecin: user.name,
            dfg: infoMedical.dfg,
            previousDfg: infoMedical.previousDfg,
            proteinurie: infoMedical.proteinurie,
            previousProteinurie: infoMedical.previousProteinurie,
            lastvisite: infoMedical.lastvisite,
            nextvisite: infoMedical.nextvisite,
          },
        })
        .from(patient)
        .leftJoin(infoMedical, eq(patient.id, infoMedical.patientId))
        .rightJoin(user, eq(infoMedical.medecin, user.id))
        .where(eq(patient.id, id));

      if (!result) {
        throw ApiError.notFound(`Patient with ID ${id} not found`);
      }

      // Get patient's medical history
      const medicalHistory = await db
        .select()
        .from(historique)
        .where(eq(historique.patientId, id))
        .orderBy(desc(historique.date))
        .limit(10);

      // Get patient's treatments
      const treatments = await db
        .select()
        .from(patientTraitement)
        .where(eq(patientTraitement.patientId, id))
        .orderBy(desc(patientTraitement.createdAt));

      return {
        ...result,
        medicalHistory,
        treatments,
      };
    });
  }

  /**
   * Create a new patient with medical information
   */
  static async createPatient(data: CreatePatientInput) {
    const {
      firstname,
      lastname,
      birthdate,
      sex,
      email,
      phone,
      address,
      medicalInfo,
    } = data;
    const patientId = uuidv4();
    const now = new Date();

    try {
      const [existingPatient] = await db
        .select({ id: patient.id })
        .from(patient)
        .where(eq(patient.email, email));

      if (existingPatient) {
        throw ApiError.conflict(`Patient with email ${email} already exists`);
      }

      const medecin = await auth.api.getSession({
        headers: await headers(),
      });

      if (!medecin || !medecin.user) {
        throw ApiError.unauthorized(
          "Vous devez être connecté pour créer un patient"
        );
      }

      await db.insert(patient).values({
        id: patientId,
        firstname,
        lastname,
        birthdate,
        sex,
        email,
        phone,
        address,
        createdAt: now,
        updatedAt: now,
      });

      try {
        await db.insert(infoMedical).values({
          id: uuidv4(),
          patientId,
          stade: medicalInfo.stage,
          status: medicalInfo.status,
          medecin: medicalInfo.medecin,
          dfg: medicalInfo.dfg,
          previousDfg: medicalInfo.dfg,
          proteinurie: medicalInfo.proteinurie,
          previousProteinurie: medicalInfo.proteinurie,
          lastvisite: now,
          nextvisite: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        });

        await db.insert(historique).values({
          id: uuidv4(),
          patientId,
          date: now,
          title: "Enregistrement initial",
          description: `Patient enregistré avec stade MRC ${medicalInfo.stage}, DFG ${medicalInfo.dfg} ml/min, protéinurie ${medicalInfo.proteinurie} g/24h.`,
          type: "consultation",
          medecin: medecin?.user.id,
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        await db.delete(patient).where(eq(patient.id, patientId));
        if (error instanceof ApiError) {
          throw error;
        }
        throw ApiError.internalServer("Failed to create patient");
      }

      await deleteCacheByPattern("patients:list:*");
      await deleteCacheByPattern("dashboard:stats");

      return this.getPatientById(patientId);
    } catch (error) {
      console.error("Error creating patient:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to create patient");
    }
  }

  /**
   * Update a patient and their medical information
   */
  static async updatePatient(id: string, data: UpdatePatientInput) {
    const now = new Date();

    try {
      const existingPatient = await this.getPatientById(id);

      const user = await auth.api.getSession({
        headers: await headers(),
      });

      if (!user || !user.user) {
        throw ApiError.unauthorized(
          "Vous devez être connecté pour modifier un patient"
        );
      }

      try {
        const patientFields: any = {};

        if (data.firstname !== undefined)
          patientFields.firstname = data.firstname;
        if (data.lastname !== undefined) patientFields.lastname = data.lastname;
        if (data.birthdate !== undefined)
          patientFields.birthdate = data.birthdate;
        if (data.sex !== undefined) patientFields.sex = data.sex;
        if (data.email !== undefined) patientFields.email = data.email;
        if (data.phone !== undefined) patientFields.phone = data.phone;
        if (data.address !== undefined) patientFields.address = data.address;

        if (Object.keys(patientFields).length > 0) {
          patientFields.updatedAt = now;
          await db.update(patient).set(patientFields).where(eq(patient.id, id));
        }

        if (data.medicalInfo) {
          const { stage, status, medecin, dfg, proteinurie } = data.medicalInfo;

          const medicalFields: any = {
            updatedAt: now,
          };

          if (stage !== undefined) medicalFields.stade = stage;
          if (status !== undefined) medicalFields.status = status;
          if (medecin !== undefined) medicalFields.medecin = medecin;

          if (dfg !== undefined) {
            medicalFields.previousDfg = existingPatient.medicalInfo?.dfg;
            medicalFields.dfg = dfg;
          }

          if (proteinurie !== undefined) {
            medicalFields.previousProteinurie =
              existingPatient.medicalInfo?.proteinurie;
            medicalFields.proteinurie = proteinurie;
          }

          await db
            .update(infoMedical)
            .set(medicalFields)
            .where(eq(infoMedical.patientId, id));

          // Add medical record entry for significant changes
          if (
            dfg !== undefined ||
            proteinurie !== undefined ||
            status !== undefined
          ) {
            let description = "Mise à jour des informations médicales: ";

            if (dfg !== undefined) {
              description += `DFG ${existingPatient.medicalInfo?.dfg} → ${dfg} ml/min. `;
            }

            if (proteinurie !== undefined) {
              description += `Protéinurie ${existingPatient.medicalInfo?.proteinurie} → ${proteinurie} g/24h. `;
            }

            if (
              status !== undefined &&
              status !== existingPatient.medicalInfo?.status
            ) {
              description += `Statut ${existingPatient.medicalInfo?.status} → ${status}. `;
            }

            await db.insert(historique).values({
              id: uuidv4(),
              patientId: id,
              date: now,
              title: "Mise à jour des paramètres médicaux",
              description,
              type: "consultation",
              medecin:
                medecin || existingPatient.medicalInfo?.medecin || user.user.id,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw ApiError.internalServer("Failed to update patient information");
      }

      // Invalidate cache
      await deleteCache(`patients:${id}`);
      await deleteCacheByPattern("patients:list:*");
      await deleteCacheByPattern("dashboard:stats");

      // Get the updated patient
      return this.getPatientById(id);
    } catch (error) {
      console.error("Error updating patient:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to update patient");
    }
  }

  /**
   * Delete a patient and all related data
   */
  static async deletePatient(id: string) {
    try {
      // Check if patient exists
      await this.getPatientById(id);

      // Delete patient (cascade will delete related records)
      await db.delete(patient).where(eq(patient.id, id));

      // Invalidate cache
      await deleteCache(`patients:${id}`);
      await deleteCacheByPattern("patients:list:*");
      await deleteCacheByPattern("dashboard:stats");

      return { success: true, message: "Patient deleted successfully" };
    } catch (error) {
      console.error("Error deleting patient:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to delete patient");
    }
  }

  /**
   * Search patients by name, email, or phone
   */
  static async searchPatients(query: string, limit = 10) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const searchTerm = `%${query}%`;

      const results = await db
        .select({
          id: patient.id,
          firstname: patient.firstname,
          lastname: patient.lastname,
          email: patient.email,
          phone: patient.phone,
          medicalInfo: {
            stade: infoMedical.stade,
            status: infoMedical.status,
          },
        })
        .from(patient)
        .leftJoin(infoMedical, eq(patient.id, infoMedical.patientId))
        .where(
          or(
            like(patient.firstname, searchTerm),
            like(patient.lastname, searchTerm),
            like(patient.email, searchTerm),
            like(patient.phone, searchTerm)
          )
        )
        .limit(limit);

      return results;
    } catch (error) {
      console.error("Error searching patients:", error);
      throw ApiError.internalServer("Failed to search patients");
    }
  }

  /**
   * Get patients by stage
   */
  static async getPatientsByStage(stages: number[]) {
    try {
      const results = await db
        .select({
          id: patient.id,
          firstname: patient.firstname,
          lastname: patient.lastname,
          medicalInfo: {
            stade: infoMedical.stade,
            status: infoMedical.status,
            dfg: infoMedical.dfg,
            proteinurie: infoMedical.proteinurie,
            lastvisite: infoMedical.lastvisite,
            nextvisite: infoMedical.nextvisite,
          },
        })
        .from(patient)
        .innerJoin(infoMedical, eq(patient.id, infoMedical.patientId))
        .where(inArray(infoMedical.stade, stages))
        .orderBy(asc(patient.lastname), asc(patient.firstname));

      return results;
    } catch (error) {
      console.error("Error getting patients by stage:", error);
      throw ApiError.internalServer("Failed to get patients by stage");
    }
  }

  /**
   * Get patients with upcoming appointments
   */
  static async getPatientsWithUpcomingAppointments(days = 7) {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + days);

      const results = await db
        .select({
          id: patient.id,
          firstname: patient.firstname,
          lastname: patient.lastname,
          appointmentDate: infoMedical.nextvisite,
          medicalInfo: {
            stade: infoMedical.stade,
            status: infoMedical.status,
          },
        })
        .from(patient)
        .innerJoin(infoMedical, eq(patient.id, infoMedical.patientId))
        .where(
          and(
            sql`${infoMedical.nextvisite} >= CURRENT_DATE`,
            sql`${infoMedical.nextvisite} <= ${endDate}`
          )
        )
        .orderBy(asc(infoMedical.nextvisite));

      return results;
    } catch (error) {
      console.error(
        "Error getting patients with upcoming appointments:",
        error
      );
      throw ApiError.internalServer(
        "Failed to get patients with upcoming appointments"
      );
    }
  }

  /**
   * Get critical patients (status = critical)
   */
  static async getCriticalPatients() {
    try {
      const results = await db
        .select({
          id: patient.id,
          firstname: patient.firstname,
          lastname: patient.lastname,
          medicalInfo: {
            stade: infoMedical.stade,
            status: infoMedical.status,
            dfg: infoMedical.dfg,
            proteinurie: infoMedical.proteinurie,
            lastvisite: infoMedical.lastvisite,
            nextvisite: infoMedical.nextvisite,
          },
        })
        .from(patient)
        .innerJoin(infoMedical, eq(patient.id, infoMedical.patientId))
        .where(eq(infoMedical.status, "critical"))
        .orderBy(asc(infoMedical.stade), asc(patient.lastname));

      return results;
    } catch (error) {
      console.error("Error getting critical patients:", error);
      throw ApiError.internalServer("Failed to get critical patients");
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    const cacheKey = "dashboard:stats";

    return withCache(
      cacheKey,
      async () => {
        // Get total patient count
        const [{ count: totalPatients }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(patient);

        // Get patients by stage
        const stageDistribution = await db
          .select({
            stage: infoMedical.stade,
            count: sql<number>`count(*)`,
          })
          .from(infoMedical)
          .groupBy(infoMedical.stade)
          .orderBy(asc(infoMedical.stade));

        // Get patients by status
        const statusDistribution = await db
          .select({
            status: infoMedical.status,
            count: sql<number>`count(*)`,
          })
          .from(infoMedical)
          .groupBy(infoMedical.status);

        // Get critical patients count
        const [{ count: criticalPatients }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(infoMedical)
          .where(eq(infoMedical.status, "critical"));

        const [{ count: activeAlerts }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(historique)
          .where(
            and(
              eq(historique.type, "alert"),
              eq(historique.isResolved, false),
              eq(historique.alertType, "critical")
            )
          );

        // Get upcoming appointments (next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcomingAppointmentsQuery = await db
          .select({
            patient: sql<string>`${patient.firstname} || ' ' || ${patient.lastname}`,
            date: infoMedical.nextvisite,
            patientId: patient.id,
            type: sql<string>`'Consultation'`, //TODO: Add appointment type
            virtual: sql<boolean>`false`, //TODO: Add virtual appointment flag
            avatar: sql<string>`'/placeholder.svg?height=40&width=40'`,
            initials: sql<string>`substring(${patient.firstname}, 1, 1) || substring(${patient.lastname},
            1, 1)`,
          })
          .from(patient)
          .innerJoin(infoMedical, eq(patient.id, infoMedical.patientId))
          .where(
            and(
              sql`${infoMedical.nextvisite} >= CURRENT_DATE`,
              sql`${infoMedical.nextvisite} <= ${nextWeek}`
            )
          )
          .orderBy(asc(infoMedical.nextvisite))
          .limit(5);

        const upcomingAppointments = upcomingAppointmentsQuery.map(
          (appointment, index) => ({
            ...appointment,
            id: index + 1,
            date: formatDate(new Date(appointment.date), false),
            time: new Date(appointment.date).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })
        );

        //Get Recent Patient data
        const recentPatientsQuery = await db
          .select({
            id: patient.id,
            name: sql<string>`${patient.firstname} || ' ' || ${patient.lastname}`,
            lastVisit: infoMedical.lastvisite,
            stage: infoMedical.stade,
            birthdate: patient.birthdate,
            critical: eq(infoMedical.status, "critical"),
            initials: sql<string>`substring(${patient.firstname}, 1, 1) || substring(${patient.lastname}, 1, 1)`,
            avatar: sql<string>`'/placeholder.svg?height=40&width=40'`,
            updatedAt: patient.updatedAt,
          })
          .from(patient)
          .innerJoin(infoMedical, eq(patient.id, infoMedical.patientId))
          .orderBy(desc(infoMedical.lastvisite))
          .limit(5);

        const recentPatients = recentPatientsQuery.map((patient) => ({
          ...patient,
          age: calculateAge(patient.birthdate),
          lastVisit: formatDate(new Date(patient.lastVisit)),
        }));

        const alertData = await db
          .select({
            id: historique.id,
            patient: sql<string>`${patient.firstname} || ' ' || ${patient.lastname}`,
            patientId: historique.patientId,
            type: historique.alertType,
            message: historique.description,
            date: historique.date,
            resolved: historique.isResolved,
          })
          .from(historique)
          .innerJoin(patient, eq(patient.id, historique.patientId))
          .where(eq(historique.type, "alert"))
          .orderBy(desc(historique.date))
          .limit(5);

        const alerts = alertData.map((alert, index) => ({
          ...alert,
          // id: index + 1,
          date: formatDate(new Date(alert.date)),
        }));

        return {
          totalPatients,
          stageDistribution,
          statusDistribution,
          criticalPatients,
          upcomingAppointments,
          recentPatients,
          alerts,
        };
      },
      300
    );
  }

  /**
   * get users
   * @returns
   */
  static async getUsers() {
    const cacheKey = "dashboard:users";

    return withCache(
      cacheKey,
      async () => {
        const users = await db
          .select({
            id: user.id,
            name: user.name,
          })
          .from(user)
          .orderBy(asc(user.name));

        return users;
      },
      300
    );
  }

  /**
   * get patient history
   * @param id
   * @returns
   */
  static async getPatientHistory(id: string) {
    try {
      const results = await db
        .select({
          id: historique.id,
          date: historique.date,
          title: historique.title,
          description: historique.description,
          type: historique.type,
          medecin: user.name,
          createdAt: historique.createdAt,
          updatedAt: historique.updatedAt,
        })
        .from(historique)
        .where(eq(historique.patientId, id))
        .leftJoin(user, eq(historique.medecin, user.id))
        .orderBy(desc(historique.date));

      return results;
    } catch (error) {
      console.error("Error getting patient history:", error);
      throw ApiError.internalServer("Failed to get patient history");
    }
  }

  /**
   * get patient treatments
   * @param id
   * @returns
   */
  static async createPatientTraitement(data: any) {
    try {
      const result = await db.insert(patientTraitement).values({
        id: uuidv4(),
        ...data,
      });
      return result;
    } catch (error) {
      console.error("Error creating patient treatment:", error);
      throw ApiError.internalServer("Failed to create patient treatment");
    }
  }

  /**
   * get patient treatments
   * @param id
   * @returns
   */
  static async getPatientTraitements(id: string) {
    try {
      const results = await db
        .select({
          id: patientTraitement.id,
          medicament: patientTraitement.medicament,
          category: patientTraitement.category,
          posologie: patientTraitement.posologie,
          frequence: patientTraitement.frequence,
          date: patientTraitement.date,
          endDate: patientTraitement.endDate,
          status: patientTraitement.status,
          medecin: user.name,
          notes: patientTraitement.notes,
          interactions: patientTraitement.interactions,
          createdAt: patientTraitement.createdAt,
          updatedAt: patientTraitement.updatedAt,
        })
        .from(patientTraitement)
        .where(eq(patientTraitement.patientId, id))
        .leftJoin(user, eq(patientTraitement.medecin, user.id))
        .orderBy(asc(patientTraitement.date));

      return results;
    } catch (error) {
      console.error("Error getting patient treatments:", error);
      throw ApiError.internalServer("Failed to get patient treatments");
    }
  }
}
