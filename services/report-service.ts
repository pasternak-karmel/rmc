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
import { callGeminiAI } from "./gemini-ai";
import { LabResultsService } from "./lab-results-service";
import { PatientService } from "./patient-service";
import { TreatmentService } from "./treatment-service";

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
      const [patientExists] = await db
        .select({ id: patient.id })
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

      if (!doctorExists)
        throw ApiError.notFound(`Docteur with ID ${doctorId} not found`);

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
    const patient = await PatientService.getPatientById(patientId);
    const prompt = `
You are a medical AI assistant. Based on the provided patient object, generate a structured medical summary in markdown format.

The format must follow this structure exactly:

# Medical Summary

## Patient Information
- Start with: "This is an automatically generated medical summary for the patient."

## Medical History
- Mention relevant historical conditions if available
- If none, say: "No significant medical history reported."

## Current Status
- Indicate current kidney status using the stage and status fields
- Compare current DFG and proteinuria to previous values
- Mention current treatments if provided

## Recommendations
- Suggest a general follow-up plan based on the next visit date
- Recommend monitoring kidney function with lab tests
- Reinforce treatment adherence

Close the summary with the following disclaimer:
*This report was automatically generated and requires review by a healthcare professional.*

Here is the patient data:
${typeof patient === "string" ? patient : JSON.stringify(patient, null, 2)}
`;

    return await callGeminiAI<string>(prompt);
  }

  /**
   * Generate lab results report content
   */
  private static async generateLabResultsReport(
    patientId: string
  ): Promise<string> {
    const { data: labResults } =
      await LabResultsService.getLabResults(patientId);

    const prompt = `
  You are a medical AI assistant. Based on the provided lab results, generate a structured lab results report in markdown format.
  
  ### Lab Results Data (as JSON)
  ${typeof labResults === "string" ? labResults : JSON.stringify(labResults, null, 2)}
  
  The markdown report should have the following format:
  
  # Lab Results Report
  
  ## Test Results
  Include a table with columns: Test | Result | Reference Range | Status (e.g., Normal/High/Low)
  
  ## Interpretation
  Provide a summary of the patient's kidney function and overall condition based on the results.
  
  ## Recommendations
  Provide general recommendations based on the interpretation, such as continuing monitoring, treatment changes, etc.
  
  Conclude with:
  *This report was automatically generated and requires review by a healthcare professional.*
  `;

    return await callGeminiAI<string>(prompt);
  }

  /**
   * Generate treatment plan content
   */
  private static async generateTreatmentPlan(
    patientId: string
  ): Promise<string> {
    const { data: treatments } =
      await TreatmentService.getTreatments(patientId);

    const prompt = `
  You are a medical AI assistant. Based on the provided active treatments for a patient, generate a structured treatment plan in markdown format.
  
  ### Input Treatment Data (JSON)

  ${typeof treatments === "string" ? treatments : JSON.stringify(treatments, null, 2)}

  
  Your response must follow this exact markdown structure:
  
  # Treatment Plan
  
  ## Current Medications
  - List each medication with its dosage and frequency.
  
  ## Dietary Recommendations
  - Provide general recommendations for patients with chronic kidney disease (or relevant condition if you can infer it from the treatments).
  
  ## Lifestyle Modifications
  - Include physical activity, monitoring, or behavioral habits relevant to the condition.
  
  ## Follow-up Schedule
  - Provide a generic follow-up schedule: next appointment, lab tests, and specialist review.
  
  Conclude with:
  *This treatment plan was automatically generated and requires review by a healthcare professional.*
  `;

    return await callGeminiAI<string>(prompt);
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
