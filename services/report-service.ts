/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { patient, reports, scheduledTasks } from "@/db/schema";
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

export interface ReportFilters {
  patientId?: string;
  doctorId?: string;
  type?: string | string[];
  status?: string | string[];
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateReportInput {
  patientId: string;
  doctorId: string;
  title: string;
  type: string;
  content: string;
  status?: string;
  sendToPatient?: boolean;
}

export class ReportService {
  /**
   * Get reports with filtering, sorting, and pagination
   */
  static async getReports(filters: ReportFilters = {}) {
    const {
      patientId,
      doctorId,
      type,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const offset = (page - 1) * limit;

    // Build cache key
    const cacheKey = `reports:${patientId || ""}:${doctorId || ""}:${page}:${limit}:${JSON.stringify(filters)}`;

    return withCache(cacheKey, async () => {
      // Build where clause
      const whereConditions = [];

      if (patientId) {
        whereConditions.push(eq(reports.patientId, patientId));
      }

      if (doctorId) {
        whereConditions.push(eq(reports.doctorId, doctorId));
      }

      if (type) {
        if (Array.isArray(type)) {
          whereConditions.push(inArray(reports.type, type));
        } else {
          whereConditions.push(eq(reports.type, type));
        }
      }

      if (status) {
        if (Array.isArray(status)) {
          whereConditions.push(inArray(reports.status, status));
        } else {
          whereConditions.push(eq(reports.status, status));
        }
      }

      if (startDate) {
        const startDateObj =
          typeof startDate === "string" ? new Date(startDate) : startDate;
        whereConditions.push(gte(reports.createdAt, startDateObj));
      }

      if (endDate) {
        const endDateObj =
          typeof endDate === "string" ? new Date(endDate) : endDate;
        whereConditions.push(lte(reports.createdAt, endDateObj));
      }

      if (search) {
        whereConditions.push(
          or(
            ilike(reports.title, `%${search}%`),
            ilike(reports.content, `%${search}%`)
          )
        );
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Build order by clause
      const orderByClause = (() => {
        const direction = sortOrder === "asc" ? asc : desc;

        switch (sortBy) {
          case "createdAt":
            return direction(reports.createdAt);
          case "updatedAt":
            return direction(reports.updatedAt);
          case "sentDate":
            return direction(reports.sentDate);
          default:
            return direction(reports.createdAt);
        }
      })();

      // Execute query
      const reportsList = await db
        .select({
          id: reports.id,
          patientId: reports.patientId,
          doctorId: reports.doctorId,
          title: reports.title,
          type: reports.type,
          content: reports.content,
          status: reports.status,
          sentToPatient: reports.sentToPatient,
          sentDate: reports.sentDate,
          generatedAutomatically: reports.generatedAutomatically,
          createdAt: reports.createdAt,
          updatedAt: reports.updatedAt,
          patient: {
            id: patient.id,
            firstname: patient.firstname,
            lastname: patient.lastname,
            email: patient.email,
          },
          doctor: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        })
        .from(reports)
        .leftJoin(patient, eq(reports.patientId, patient.id))
        .leftJoin(user, eq(reports.doctorId, user.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(reports)
        .where(whereClause);

      return {
        data: reportsList,
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
   * Get a report by ID
   */
  static async getReportById(id: string) {
    const cacheKey = `report:${id}`;

    return withCache(cacheKey, async () => {
      const [report] = await db
        .select({
          id: reports.id,
          patientId: reports.patientId,
          doctorId: reports.doctorId,
          title: reports.title,
          type: reports.type,
          content: reports.content,
          status: reports.status,
          sentToPatient: reports.sentToPatient,
          sentDate: reports.sentDate,
          generatedAutomatically: reports.generatedAutomatically,
          createdAt: reports.createdAt,
          updatedAt: reports.updatedAt,
          patient: {
            id: patient.id,
            firstname: patient.firstname,
            lastname: patient.lastname,
            email: patient.email,
          },
          doctor: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        })
        .from(reports)
        .leftJoin(patient, eq(reports.patientId, patient.id))
        .leftJoin(user, eq(reports.doctorId, user.id))
        .where(eq(reports.id, id));

      if (!report) {
        throw ApiError.notFound(`Report with ID ${id} not found`);
      }

      return report;
    });
  }

  /**
   * Create a new report
   */
  static async createReport(data: CreateReportInput) {
    const {
      patientId,
      doctorId,
      title,
      type,
      content,
      status = "draft",
      sendToPatient = false,
    } = data;

    try {
      // Check if patient exists
      const [patientExists] = await db
        .select({ id: patient.id })
        .from(patient)
        .where(eq(patient.id, patientId));

      if (!patientExists) {
        throw ApiError.notFound(`Patient with ID ${patientId} not found`);
      }

      // Check if doctor exists
      const [doctorExists] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, doctorId));

      if (!doctorExists) {
        throw ApiError.notFound(`Doctor with ID ${doctorId} not found`);
      }

      // Create report
      const id = uuidv4();
      const now = new Date();

      await db.insert(reports).values({
        id,
        patientId,
        doctorId,
        title,
        type,
        content,
        status,
        sentToPatient: false,
        generatedAutomatically: false,
        createdAt: now,
        updatedAt: now,
      });

      // If status is finalized, create notification
      if (status === "finalized") {
        await NotificationService.createNotification({
          userId: doctorId,
          patientId,
          title: "New Report Finalized",
          message: `Report "${title}" for patient ${patientExists.id} has been finalized`,
          type: "report",
          category: "administrative",
          priority: "normal",
          actionRequired: false,
          actionType: "view",
          actionUrl: `/reports/${id}`,
        });
      }

      // If sendToPatient is true, schedule sending the report
      if (sendToPatient && status === "finalized") {
        const sendTaskId = uuidv4();
        const sendDate = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

        await db.insert(scheduledTasks).values({
          id: sendTaskId,
          type: "report_sending",
          status: "pending",
          data: JSON.stringify({
            reportId: id,
            patientId,
            doctorId,
          }),
          scheduledFor: sendDate,
          createdAt: now,
          updatedAt: now,
        });

        // Update report to mark as scheduled for sending
        await db
          .update(reports)
          .set({ sentToPatient: true, sentDate: sendDate })
          .where(eq(reports.id, id));
      }

      // Invalidate cache
      await deleteCacheByPattern(`reports:*`);

      // Get the created report
      return this.getReportById(id);
    } catch (error) {
      console.error("Error creating report:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to create report");
    }
  }

  /**
   * Update a report
   */
  static async updateReport(
    id: string,
    data: Partial<CreateReportInput> & { status?: string }
  ) {
    try {
      const report = await this.getReportById(id);
      const now = new Date();

      // Prepare update data
      const updateData: any = {
        updatedAt: now,
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.status !== undefined) updateData.status = data.status;

      // Update report
      await db.update(reports).set(updateData).where(eq(reports.id, id));

      // If status changed to finalized, create notification
      if (data.status === "finalized" && report.status !== "finalized") {
        await NotificationService.createNotification({
          userId: report.doctorId,
          patientId: report.patientId,
          title: "Report Finalized",
          message: `Report "${report.title}" for patient ${report?.patient?.firstname} ${report?.patient?.lastname} has been finalized`,
          type: "report",
          category: "administrative",
          priority: "normal",
          actionRequired: false,
          actionType: "view",
          actionUrl: `/reports/${id}`,
        });
      }

      // If sendToPatient is true and report is finalized, schedule sending
      if (
        data.sendToPatient &&
        (data.status === "finalized" || report.status === "finalized")
      ) {
        const sendTaskId = uuidv4();
        const sendDate = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

        await db.insert(scheduledTasks).values({
          id: sendTaskId,
          type: "report_sending",
          status: "pending",
          data: JSON.stringify({
            reportId: id,
            patientId: report.patientId,
            doctorId: report.doctorId,
          }),
          scheduledFor: sendDate,
          createdAt: now,
          updatedAt: now,
        });

        // Update report to mark as scheduled for sending
        await db
          .update(reports)
          .set({ sentToPatient: true, sentDate: sendDate })
          .where(eq(reports.id, id));
      }

      // Invalidate cache
      await deleteCache(`report:${id}`);
      await deleteCacheByPattern(`reports:*`);

      // Get the updated report
      return this.getReportById(id);
    } catch (error) {
      console.error("Error updating report:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to update report");
    }
  }

  /**
   * Delete a report
   */
  static async deleteReport(id: string) {
    try {
      // const report = await this.getReportById(id);

      // Delete report
      await db.delete(reports).where(eq(reports.id, id));

      // Delete related scheduled tasks
      await db
        .delete(scheduledTasks)
        .where(sql`${scheduledTasks.data}::jsonb->>'reportId' = ${id}`);

      // Invalidate cache
      await deleteCache(`report:${id}`);
      await deleteCacheByPattern(`reports:*`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting report:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to delete report");
    }
  }

  /**
   * Generate a report automatically
   */
  static async generateReport(
    patientId: string,
    doctorId: string,
    type: string
  ) {
    try {
      // Check if patient exists
      const [patientExists] = await db
        .select({
          id: patient.id,
          firstname: patient.firstname,
          lastname: patient.lastname,
        })
        .from(patient)
        .where(eq(patient.id, patientId));

      if (!patientExists) {
        throw ApiError.notFound(`Patient with ID ${patientId} not found`);
      }

      // Check if doctor exists
      const [doctorExists] = await db
        .select({
          id: user.id,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, doctorId));

      if (!doctorExists) {
        throw ApiError.notFound(`Doctor with ID ${doctorId} not found`);
      }

      // Generate report content based on type
      let title = "";
      let content = "";

      switch (type) {
        case "medical_summary":
          title = `Medical Summary for ${patientExists.firstname} ${patientExists.lastname}`;
          content = await this.generateMedicalSummary(patientId);
          break;
        case "lab_results":
          title = `Lab Results Report for ${patientExists.firstname} ${patientExists.lastname}`;
          content = await this.generateLabResultsReport(patientId);
          break;
        case "treatment_plan":
          title = `Treatment Plan for ${patientExists.firstname} ${patientExists.lastname}`;
          content = await this.generateTreatmentPlan(patientId);
          break;
        case "progress_note":
          title = `Progress Note for ${patientExists.firstname} ${patientExists.lastname}`;
          content = await this.generateProgressNote(patientId);
          break;
        default:
          throw ApiError.badRequest(`Unsupported report type: ${type}`);
      }

      // Create report
      const id = uuidv4();
      const now = new Date();

      await db.insert(reports).values({
        id,
        patientId,
        doctorId,
        title,
        type,
        content,
        status: "draft",
        sentToPatient: false,
        generatedAutomatically: true,
        createdAt: now,
        updatedAt: now,
      });

      // Create notification
      await NotificationService.createNotification({
        userId: doctorId,
        patientId,
        title: "Report Generated Automatically",
        message: `A ${type.replace("_", " ")} report has been automatically generated for ${patientExists.firstname} ${patientExists.lastname}`,
        type: "report",
        category: "administrative",
        priority: "normal",
        actionRequired: true,
        actionType: "review",
        actionUrl: `/reports/${id}`,
      });

      // Invalidate cache
      await deleteCacheByPattern(`reports:*`);

      // Get the created report
      return this.getReportById(id);
    } catch (error) {
      console.error("Error generating report:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to generate report");
    }
  }

  /**
   * Generate medical summary content
   */
  private static async generateMedicalSummary(
    patientId: string
  ): Promise<string> {
    return `# Medical Summary

## Patient Information
This is an automatically generated medical summary for the patient.

## Medical History
- Patient has a history of chronic kidney disease
- Regular follow-up appointments have been maintained

## Current Status
- Patient is currently stable
- Medication regimen is being followed as prescribed

## Recommendations
- Continue current treatment plan
- Schedule follow-up appointment in 3 months
- Monitor kidney function with regular lab tests

*This report was automatically generated and requires review by a healthcare professional.*`;
  }

  /**
   * Generate lab results report content
   */
  private static async generateLabResultsReport(
    patientId: string
  ): Promise<string> {
    return `# Lab Results Report

## Test Results
| Test | Result | Reference Range | Status |
|------|--------|----------------|--------|
| Creatinine | 1.2 mg/dL | 0.7-1.3 mg/dL | Normal |
| eGFR | 65 mL/min | >60 mL/min | Normal |
| BUN | 18 mg/dL | 7-20 mg/dL | Normal |
| Potassium | 4.5 mEq/L | 3.5-5.0 mEq/L | Normal |
| Sodium | 140 mEq/L | 135-145 mEq/L | Normal |
| Phosphorus | 3.5 mg/dL | 2.5-4.5 mg/dL | Normal |
| Calcium | 9.5 mg/dL | 8.5-10.5 mg/dL | Normal |

## Interpretation
Overall, the lab results are within normal ranges, indicating stable kidney function.

## Recommendations
- Continue current monitoring schedule
- No immediate changes to treatment plan required

*This report was automatically generated and requires review by a healthcare professional.*`;
  }

  /**
   * Generate treatment plan content
   */
  private static async generateTreatmentPlan(
    patientId: string
  ): Promise<string> {
    return `# Treatment Plan

## Current Medications
1. Medication A - 10mg daily
2. Medication B - 25mg twice daily
3. Medication C - 5mg as needed for symptoms

## Dietary Recommendations
- Low sodium diet (<2g sodium per day)
- Moderate protein intake (0.8g/kg body weight)
- Adequate hydration (2L of water daily)

## Lifestyle Modifications
- Regular physical activity (30 minutes, 5 days per week)
- Blood pressure monitoring at home
- Weight management

## Follow-up Schedule
- Next appointment: In 3 months
- Lab tests: Every 3 months
- Specialist consultation: As needed

*This treatment plan was automatically generated and requires review by a healthcare professional.*`;
  }

  /**
   * Generate progress note content
   */
  private static async generateProgressNote(
    patientId: string
  ): Promise<string> {
    return `# Progress Note

## Subjective
Patient reports feeling well overall. No new symptoms reported. Medication compliance has been good.

## Objective
- Vital Signs: BP 130/80, HR 72, RR 16, Temp 98.6°F
- Physical Exam: No edema, clear lungs, regular heart rhythm
- Recent Lab Results: Stable kidney function

## Assessment
Chronic kidney disease, stage 3, currently stable.

## Plan
1. Continue current medication regimen
2. Maintain dietary and lifestyle recommendations
3. Follow up in 3 months with repeat labs
4. Patient educated on signs and symptoms that would require immediate attention

*This progress note was automatically generated and requires review by a healthcare professional.*`;
  }
}
