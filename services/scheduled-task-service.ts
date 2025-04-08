/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { appointments, patient, reports, scheduledTasks } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { and, eq, lte, sql } from "drizzle-orm";
import { NotificationService } from "./notification-service";

export class ScheduledTaskService {
  /**
   * Process due tasks
   */
  static async processDueTasks() {
    try {
      const now = new Date();
      let processedCount = 0;
      let errorCount = 0;

      const dueTasks = await db
        .select()
        .from(scheduledTasks)
        .where(
          and(
            eq(scheduledTasks.status, "pending"),
            lte(scheduledTasks.scheduledFor, now),
            sql`${scheduledTasks.retryCount} < ${scheduledTasks.maxRetries}`
          )
        )
        .limit(50);


      for (const task of dueTasks) {
        try {
          if (!task.data) {
            throw new Error("Task data is missing or invalid");
          }

          // try {
          //   const taskData = JSON.parse(task.data);
          // } catch (e) {
          //   throw new Error(`Invalid task data format: ${e.message}`);
          // }

          // Mark task as processing
          await db
            .update(scheduledTasks)
            .set({
              status: "processing",
              updatedAt: now,
            })
            .where(eq(scheduledTasks.id, task.id));

          let result;
          switch (task.type) {
            case "appointment_confirmation":
              result = await this.processAppointmentConfirmation(task);
              break;
            case "appointment_reminder":
              result = await this.processAppointmentReminder(task);
              break;
            case "report_sending":
              result = await this.processReportSending(task);
              break;
            case "medication_reminder":
              result = await this.processMedicationReminder(task);
              break;
            default:
              throw new Error(`Unknown task type: ${task.type}`);
          }

          await db
            .update(scheduledTasks)
            .set({
              status: "completed",
              processedAt: now,
              result: JSON.stringify(result),
              updatedAt: now,
            })
            .where(eq(scheduledTasks.id, task.id));

          processedCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error processing task ${task.id}:`, error);

          await db
            .update(scheduledTasks)
            .set({
              status:
                task.retryCount + 1 >= task.maxRetries ? "failed" : "pending",
              retryCount: task.retryCount + 1,
              error: error instanceof Error ? error.message : "Unknown error",
              updatedAt: now,
            })
            .where(eq(scheduledTasks.id, task.id));
        }
      }

      return {
        processed: processedCount,
        errors: errorCount,
        total: dueTasks.length,
      };
    } catch (error) {
      console.error("Error processing due tasks:", error);
      throw error;
    }
  }

  /**
   * Process appointment confirmation task
   */
  private static async processAppointmentConfirmation(task: any) {
    try {
      const data = JSON.parse(task.data);
      const { appointmentId, patientId, doctorId } = data;

      if (!appointmentId || !patientId || !doctorId) {
        throw new Error("Missing required fields in task data");
      }

      // Get appointment details
      const [appointment] = await db
        .select({
          id: appointments.id,
          title: appointments.title,
          date: appointments.date,
          patient: {
            id: patient.id,
            firstname: patient.firstname,
            lastname: patient.lastname,
            email: patient.email,
          },
        })
        .from(appointments)
        .leftJoin(patient, eq(appointments.patientId, patient.id))
        .where(eq(appointments.id, appointmentId));

      if (!appointment) {
        throw new Error(`Appointment with ID ${appointmentId} not found`);
      }

      

      // Create notification for doctor
      await NotificationService.createNotification({
        userId: doctorId,
        patientId,
        title: "Appointment Confirmation Sent",
        message: `Confirmation for appointment with ${appointment?.patient?.firstname} ${appointment?.patient?.lastname} on ${new Date(appointment.date).toLocaleDateString()} has been sent`,
        type: "appointment",
        category: "appointment",
        priority: "low",
        actionRequired: false,
      });

      // Update appointment
      await db
        .update(appointments)
        .set({
          confirmationSent: true,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, appointmentId));

      return { success: true, message: "Appointment confirmation sent" };
    } catch (error) {
      console.error("Error in processAppointmentConfirmation:", error);
      throw error;
    }
  }

  /**
   * Process appointment reminder task
   */
  private static async processAppointmentReminder(task: any) {
    const data = JSON.parse(task.data);
    const { appointmentId, patientId, doctorId } = data;

    // Get appointment details
    const [appointment] = await db
      .select({
        id: appointments.id,
        title: appointments.title,
        date: appointments.date,
        patient: {
          id: patient.id,
          firstname: patient.firstname,
          lastname: patient.lastname,
          email: patient.email,
        },
      })
      .from(appointments)
      .leftJoin(patient, eq(appointments.patientId, patient.id))
      .where(eq(appointments.id, appointmentId));

    if (!appointment) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }

    // console.log(
    //   `Sending appointment reminder email to ${appointment?.patient?.email}`
    // );

    // Create notification for doctor
    await NotificationService.createNotification({
      userId: doctorId,
      patientId,
      title: "Appointment Reminder Sent",
      message: `Reminder for appointment with ${appointment?.patient?.firstname} ${appointment?.patient?.lastname} tomorrow at ${new Date(appointment.date).toLocaleTimeString()} has been sent`,
      type: "appointment",
      category: "appointment",
      priority: "low",
      actionRequired: false,
    });

    // Update appointment
    await db
      .update(appointments)
      .set({
        reminderSent: true,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    return { success: true, message: "Appointment reminder sent" };
  }

  /**
   * Process report sending task
   */
  private static async processReportSending(task: any) {
    const data = JSON.parse(task.data);
    const { reportId, patientId, doctorId } = data;

    // Get report details
    const [report] = await db
      .select({
        id: reports.id,
        title: reports.title,
        patient: {
          id: patient.id,
          firstname: patient.firstname,
          lastname: patient.lastname,
          email: patient.email,
        },
      })
      .from(reports)
      .leftJoin(patient, eq(reports.patientId, patient.id))
      .where(eq(reports.id, reportId));

    if (!report) {
      throw new Error(`Report with ID ${reportId} not found`);
    }

    // In a real implementation, this would send an email to the patient
    // console.log(`Sending report to ${report.patient.email}`);

    // Create notification for doctor
    await NotificationService.createNotification({
      userId: doctorId,
      patientId,
      title: "Report Sent to Patient",
      message: `Report "${report.title}" has been sent to ${report?.patient?.firstname} ${report?.patient?.lastname}`,
      type: "report",
      category: "administrative",
      priority: "normal",
      actionRequired: false,
    });

    // Update report
    await db
      .update(reports)
      .set({
        sentToPatient: true,
        sentDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId));

    return { success: true, message: "Report sent to patient" };
  }

  /**
   * Process medication reminder task
   */
  private static async processMedicationReminder(task: any) {
    const data = JSON.parse(task.data);
    const { patientId, doctorId, medicationName } = data;

    // Get patient details
    const [patientData] = await db
      .select({
        id: patient.id,
        firstname: patient.firstname,
        lastname: patient.lastname,
        email: patient.email,
      })
      .from(patient)
      .where(eq(patient.id, patientId));

    if (!patientData) {
      throw new Error(`Patient with ID ${patientId} not found`);
    }


    // Create notification for doctor
    await NotificationService.createNotification({
      userId: doctorId,
      patientId,
      title: "Medication Reminder Sent",
      message: `Reminder for ${medicationName} has been sent to ${patientData.firstname} ${patientData.lastname}`,
      type: "medication",
      category: "medication",
      priority: "low",
      actionRequired: false,
    });

    return { success: true, message: "Medication reminder sent" };
  }

  /**
   * Schedule a task
   */
  static async scheduleTask(
    type: string,
    data: any,
    scheduledFor: Date | string,
    options: {
      maxRetries?: number;
    } = {}
  ) {
    try {
      const taskId = crypto.randomUUID();
      const now = new Date();
      const scheduledForDate =
        typeof scheduledFor === "string"
          ? new Date(scheduledFor)
          : scheduledFor;

      await db.insert(scheduledTasks).values({
        id: taskId,
        type,
        status: "pending",
        data: JSON.stringify(data),
        scheduledFor: scheduledForDate,
        maxRetries: options.maxRetries ?? 3,
        createdAt: now,
        updatedAt: now,
      });

      return { id: taskId, success: true };
    } catch (error) {
      console.error("Error scheduling task:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to schedule task");
    }
  }
}
