import { sendNotificationEmail } from "@/action/send-notification";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { appointments, patient, scheduledTasks } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { deleteCache, deleteCacheByPattern, withCache } from "@/lib/cache";
import { NotificationService } from "@/services/notification-service";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface AppointmentFilters {
  patientId?: string;
  doctorId?: string;
  status?: string | string[];
  type?: string | string[];
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  title: string;
  description?: string;
  date: Date | string;
  duration?: number;
  location?: string;
  status?: string;
  type?: string;
  notes?: string;
  sendConfirmation?: boolean;
}

export class AppointmentService {
  /**
   * Get appointments with filtering, sorting, and pagination
   */
  static async getAppointments(filters: AppointmentFilters = {}) {
    const {
      patientId,
      doctorId,
      status,
      type,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = "date",
      sortOrder = "asc",
    } = filters;

    const offset = (page - 1) * limit;

    const cacheKey = `appointments:${patientId || ""}:${doctorId || ""}:${page}:${limit}:${JSON.stringify(filters)}`;

    return withCache(cacheKey, async () => {
      const whereConditions = [];

      if (patientId) {
        whereConditions.push(eq(appointments.patientId, patientId));
      }

      if (doctorId) {
        whereConditions.push(eq(appointments.doctorId, doctorId));
      }

      if (status) {
        if (Array.isArray(status)) {
          whereConditions.push(inArray(appointments.status, status));
        } else {
          whereConditions.push(eq(appointments.status, status));
        }
      }

      if (type) {
        if (Array.isArray(type)) {
          whereConditions.push(inArray(appointments.type, type));
        } else {
          whereConditions.push(eq(appointments.type, type));
        }
      }

      if (startDate) {
        const startDateObj =
          typeof startDate === "string" ? new Date(startDate) : startDate;
        whereConditions.push(gte(appointments.date, startDateObj));
      }

      if (endDate) {
        const endDateObj =
          typeof endDate === "string" ? new Date(endDate) : endDate;
        whereConditions.push(lte(appointments.date, endDateObj));
      }

      if (search) {
        whereConditions.push(
          or(
            ilike(appointments.title, `%${search}%`),
            ilike(appointments.description, `%${search}%`),
            ilike(appointments.location, `%${search}%`),
            ilike(appointments.notes, `%${search}%`)
          )
        );
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Build order by clause
      const orderByClause = (() => {
        const direction = sortOrder === "asc" ? asc : desc;

        switch (sortBy) {
          case "date":
            return direction(appointments.date);
          case "createdAt":
            return direction(appointments.createdAt);
          case "updatedAt":
            return direction(appointments.updatedAt);
          default:
            return direction(appointments.date);
        }
      })();

      // Execute query
      const appointmentsList = await db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          doctorId: appointments.doctorId,
          title: appointments.title,
          description: appointments.description,
          date: appointments.date,
          duration: appointments.duration,
          location: appointments.location,
          status: appointments.status,
          type: appointments.type,
          reminderSent: appointments.reminderSent,
          confirmationSent: appointments.confirmationSent,
          confirmationStatus: appointments.confirmationStatus,
          notes: appointments.notes,
          createdAt: appointments.createdAt,
          updatedAt: appointments.updatedAt,
          patient: {
            id: patient.id,
            firstname: patient.firstname,
            lastname: patient.lastname,
            email: patient.email,
            phone: patient.phone,
          },
          doctor: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        })
        .from(appointments)
        .leftJoin(patient, eq(appointments.patientId, patient.id))
        .leftJoin(user, eq(appointments.doctorId, user.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(whereClause);

      return {
        data: appointmentsList,
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
   * Get an appointment by ID
   */
  static async getAppointmentById(id: string) {
    const cacheKey = `appointment:${id}`;

    return withCache(cacheKey, async () => {
      const [appointment] = await db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          doctorId: appointments.doctorId,
          title: appointments.title,
          description: appointments.description,
          date: appointments.date,
          duration: appointments.duration,
          location: appointments.location,
          status: appointments.status,
          type: appointments.type,
          reminderSent: appointments.reminderSent,
          confirmationSent: appointments.confirmationSent,
          confirmationStatus: appointments.confirmationStatus,
          notes: appointments.notes,
          createdAt: appointments.createdAt,
          updatedAt: appointments.updatedAt,
          patient: {
            id: patient.id,
            firstname: patient.firstname,
            lastname: patient.lastname,
            email: patient.email,
            phone: patient.phone,
          },
          doctor: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        })
        .from(appointments)
        .leftJoin(patient, eq(appointments.patientId, patient.id))
        .leftJoin(user, eq(appointments.doctorId, user.id))
        .where(eq(appointments.id, id));

      if (!appointment) {
        throw ApiError.notFound(`Appointment with ID ${id} not found`);
      }

      return appointment;
    });
  }

  /**
   * Create a new appointment
   */
  static async createAppointment(data: CreateAppointmentInput) {
    const {
      patientId,
      doctorId,
      title,
      description,
      date,
      duration = 30,
      location,
      status = "scheduled",
      type = "in_person",
      notes,
      sendConfirmation = true,
    } = data;

    try {
      const [patientExists] = await db
        .select({
          id: patient.id,
          firstname: patient.firstname,
          lastname: patient.lastname,
          email: patient.email,
        })
        .from(patient)
        .where(eq(patient.id, patientId));

      if (!patientExists) {
        throw ApiError.notFound(`Patient with ID ${patientId} not found`);
      }

      const [doctorExists] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, doctorId));

      if (!doctorExists) {
        throw ApiError.notFound(`Doctor with ID ${doctorId} not found`);
      }

      const id = uuidv4();
      const now = new Date();
      const appointmentDate = typeof date === "string" ? new Date(date) : date;

      await db.insert(appointments).values({
        id,
        patientId,
        doctorId,
        title,
        description,
        date: appointmentDate,
        duration,
        location,
        status,
        type,
        notes,
        createdAt: now,
        updatedAt: now,
      });

      if (sendConfirmation) {
        const confirmationTaskId = uuidv4();
        const confirmationDate = new Date(now.getTime() + 5 * 60 * 1000);

        await db.insert(scheduledTasks).values({
          id: confirmationTaskId,
          type: "appointment_confirmation",
          status: "pending",
          data: JSON.stringify({
            appointmentId: id,
            patientId,
            doctorId,
          }),
          scheduledFor: confirmationDate,
          createdAt: now,
          updatedAt: now,
        });

        await db
          .update(appointments)
          .set({ confirmationSent: true })
          .where(eq(appointments.id, id));
      }

      const reminderTaskId = uuidv4();
      const reminderDate = new Date(
        appointmentDate.getTime() - 24 * 60 * 60 * 1000
      );

      if (reminderDate > now) {
        await db.insert(scheduledTasks).values({
          id: reminderTaskId,
          type: "appointment_reminder",
          status: "pending",
          data: JSON.stringify({
            appointmentId: id,
            patientId,
            doctorId,
          }),
          scheduledFor: reminderDate,
          createdAt: now,
          updatedAt: now,
        });
      }

      await sendNotificationEmail({
        to: patientExists.email,
        subject: "Nouvel rendez-vous",
        notificationTitle: "Nouvel rendez-vous programmé",
        notificationContent: `Nouvel rendez-vous programmé avec ${patientExists.firstname} ${patientExists.lastname} le ${appointmentDate.toLocaleDateString()} à ${appointmentDate.toLocaleTimeString()}`,
        appName: "HealthCare",
      });
      await NotificationService.createNotification({
        userId: doctorId,
        patientId,
        title: "New Appointment Scheduled",
        message: `New appointment scheduled with ${patientExists.firstname} ${patientExists.lastname} on ${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString()}`,
        type: "appointment",
        category: "appointment",
        priority: "normal",
        actionRequired: false,
        actionType: "view",
        actionUrl: `/appointments/${id}`,
      });

      await deleteCacheByPattern(`appointments:*`);

      return this.getAppointmentById(id);
    } catch (error) {
      console.error("Error creating appointment:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to create appointment");
    }
  }

  /**
   * Update an appointment
   */
  static async updateAppointment(
    id: string,
    data: Partial<CreateAppointmentInput>
  ) {
    try {
      const appointment = await this.getAppointmentById(id);
      const now = new Date();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        updatedAt: now,
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.date !== undefined)
        updateData.date =
          typeof data.date === "string" ? new Date(data.date) : data.date;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.notes !== undefined) updateData.notes = data.notes;

      // Update appointment
      await db
        .update(appointments)
        .set(updateData)
        .where(eq(appointments.id, id));

      // If date changed, update reminder task
      if (data.date !== undefined) {
        const appointmentDate =
          typeof data.date === "string" ? new Date(data.date) : data.date;
        const reminderDate = new Date(
          appointmentDate.getTime() - 24 * 60 * 60 * 1000
        ); // 1 day before appointment

        // Find existing reminder task
        const [existingTask] = await db
          .select()
          .from(scheduledTasks)
          .where(
            and(
              eq(scheduledTasks.type, "appointment_reminder"),
              sql`${scheduledTasks.data}::jsonb->>'appointmentId' = ${id}`
            )
          );

        if (existingTask) {
          // Update existing task
          await db
            .update(scheduledTasks)
            .set({
              scheduledFor: reminderDate,
              updatedAt: now,
              status: reminderDate > now ? "pending" : "completed", // Mark as completed if in the past
            })
            .where(eq(scheduledTasks.id, existingTask.id));
        } else if (reminderDate > now) {
          // Create new reminder task
          await db.insert(scheduledTasks).values({
            id: uuidv4(),
            type: "appointment_reminder",
            status: "pending",
            data: JSON.stringify({
              appointmentId: id,
              patientId: appointment.patientId,
              doctorId: appointment.doctorId,
            }),
            scheduledFor: reminderDate,
            createdAt: now,
            updatedAt: now,
          });
        }

        // Create notification about rescheduled appointment
        await NotificationService.createNotification({
          userId: appointment.doctorId,
          patientId: appointment.patientId,
          title: "Appointment Rescheduled",
          message: `Appointment with ${appointment?.patient?.firstname} ${appointment?.patient?.lastname} has been rescheduled to ${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString()}`,
          type: "appointment",
          category: "appointment",
          priority: "normal",
          actionRequired: false,
          actionType: "view",
          actionUrl: `/appointments/${id}`,
        });
      }

      if (data.status !== undefined && data.status !== appointment.status) {
        const statusMessages = {
          scheduled: "Appointment has been scheduled",
          confirmed: "Appointment has been confirmed",
          cancelled: "Appointment has been cancelled",
          completed: "Appointment has been marked as completed",
          no_show: "Patient did not show up for the appointment",
        };

        const message =
          statusMessages[data.status as keyof typeof statusMessages] ||
          `Appointment status changed to ${data.status}`;

        await NotificationService.createNotification({
          userId: appointment.doctorId,
          patientId: appointment.patientId,
          title: "Appointment Status Updated",
          message: `${message} for ${appointment?.patient?.firstname} ${appointment?.patient?.lastname} on ${new Date(appointment.date).toLocaleDateString()}`,
          type: "appointment",
          category: "appointment",
          priority: data.status === "cancelled" ? "high" : "normal",
          actionRequired: false,
          actionType: "view",
          actionUrl: `/appointments/${id}`,
        });
      }

      // Invalidate cache
      await deleteCache(`appointment:${id}`);
      await deleteCacheByPattern(`appointments:*`);

      // Get the updated appointment
      return this.getAppointmentById(id);
    } catch (error) {
      console.error("Error updating appointment:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to update appointment");
    }
  }

  /**
   * Delete an appointment
   */
  static async deleteAppointment(id: string) {
    try {
      const appointment = await this.getAppointmentById(id);

      // Delete appointment
      await db.delete(appointments).where(eq(appointments.id, id));

      // Delete related scheduled tasks
      await db
        .delete(scheduledTasks)
        .where(sql`${scheduledTasks.data}::jsonb->>'appointmentId' = ${id}`);

      // Create notification about deleted appointment
      await NotificationService.createNotification({
        userId: appointment.doctorId,
        patientId: appointment.patientId,
        title: "Appointment Deleted",
        message: `Appointment with ${appointment?.patient?.firstname} ${appointment?.patient?.lastname} on ${new Date(appointment.date).toLocaleDateString()} has been deleted`,
        type: "appointment",
        category: "appointment",
        priority: "high",
        actionRequired: false,
      });

      // Invalidate cache
      await deleteCache(`appointment:${id}`);
      await deleteCacheByPattern(`appointments:*`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting appointment:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to delete appointment");
    }
  }

  /**
   * Confirm an appointment
   */
  static async confirmAppointment(id: string) {
    try {
      const appointment = await this.getAppointmentById(id);

      // Update appointment status
      await db
        .update(appointments)
        .set({
          status: "confirmed",
          confirmationStatus: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, id));

      // Create notification
      await NotificationService.createNotification({
        userId: appointment.doctorId,
        patientId: appointment.patientId,
        title: "Appointment Confirmed",
        message: `${appointment?.patient?.firstname} ${appointment?.patient?.lastname} has confirmed their appointment on ${new Date(appointment.date).toLocaleDateString()} at ${new Date(appointment.date).toLocaleTimeString()}`,
        type: "appointment",
        category: "appointment",
        priority: "normal",
        actionRequired: false,
        actionType: "view",
        actionUrl: `/appointments/${id}`,
      });

      // Invalidate cache
      await deleteCache(`appointment:${id}`);
      await deleteCacheByPattern(`appointments:*`);

      return { success: true };
    } catch (error) {
      console.error("Error confirming appointment:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to confirm appointment");
    }
  }

  /**
   * Get upcoming appointments
   */
  static async getUpcomingAppointments(doctorId?: string, days = 7) {
    const cacheKey = `appointments:upcoming:${doctorId || "all"}:${days}`;

    return withCache(
      cacheKey,
      async () => {
        const now = new Date();
        const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const whereConditions = [
          gte(appointments.date, now),
          lte(appointments.date, endDate),
          inArray(appointments.status, ["scheduled", "confirmed"]),
        ];

        if (doctorId) {
          whereConditions.push(eq(appointments.doctorId, doctorId));
        }

        const upcomingAppointments = await db
          .select({
            id: appointments.id,
            patientId: appointments.patientId,
            doctorId: appointments.doctorId,
            title: appointments.title,
            date: appointments.date,
            status: appointments.status,
            type: appointments.type,
            patient: {
              id: patient.id,
              firstname: patient.firstname,
              lastname: patient.lastname,
            },
            doctor: {
              id: user.id,
              name: user.name,
            },
          })
          .from(appointments)
          .leftJoin(patient, eq(appointments.patientId, patient.id))
          .leftJoin(user, eq(appointments.doctorId, user.id))
          .where(and(...whereConditions))
          .orderBy(asc(appointments.date));

        return upcomingAppointments;
      },
      300
    ); // Cache for 5 minutes
  }

  /**
   * Get appointment statistics
   */
  static async getAppointmentStats(
    doctorId?: string,
    startDate?: Date | string,
    endDate?: Date | string
  ) {
    const start = startDate
      ? typeof startDate === "string"
        ? new Date(startDate)
        : startDate
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate
      ? typeof endDate === "string"
        ? new Date(endDate)
        : endDate
      : new Date();

    const cacheKey = `appointments:stats:${doctorId || "all"}:${start.toISOString()}:${end.toISOString()}`;

    return withCache(
      cacheKey,
      async () => {
        const whereConditions = [
          gte(appointments.date, start),
          lte(appointments.date, end),
        ];

        if (doctorId) {
          whereConditions.push(eq(appointments.doctorId, doctorId));
        }

        // Get total count
        const [{ total }] = await db
          .select({ total: sql<number>`count(*)` })
          .from(appointments)
          .where(and(...whereConditions));

        // Get counts by status
        const statusCounts = await db
          .select({
            status: appointments.status,
            count: sql<number>`count(*)`,
          })
          .from(appointments)
          .where(and(...whereConditions))
          .groupBy(appointments.status);

        // Get counts by type
        const typeCounts = await db
          .select({
            type: appointments.type,
            count: sql<number>`count(*)`,
          })
          .from(appointments)
          .where(and(...whereConditions))
          .groupBy(appointments.type);

        // Get counts by day
        const dayCounts = await db
          .select({
            day: sql<string>`to_char(${appointments.date}, 'YYYY-MM-DD')`,
            count: sql<number>`count(*)`,
          })
          .from(appointments)
          .where(and(...whereConditions))
          .groupBy(sql`to_char(${appointments.date}, 'YYYY-MM-DD')`)
          .orderBy(asc(sql`to_char(${appointments.date}, 'YYYY-MM-DD')`));

        return {
          total: Number(total),
          byStatus: statusCounts.reduce(
            (acc, { status, count }) => {
              acc[status] = Number(count);
              return acc;
            },
            {} as Record<string, number>
          ),
          byType: typeCounts.reduce(
            (acc, { type, count }) => {
              acc[type] = Number(count);
              return acc;
            },
            {} as Record<string, number>
          ),
          byDay: dayCounts.reduce(
            (acc, { day, count }) => {
              acc[day] = Number(count);
              return acc;
            },
            {} as Record<string, number>
          ),
        };
      },
      300
    ); // Cache for 5 minutes
  }
}
