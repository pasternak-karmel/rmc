import { db } from "@/db";
import {
  historique,
  infoMedical,
  patient,
  tasks as taskTable,
  workflow,
  workflowPatient,
} from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { deleteCache, withCache } from "@/lib/cache";
import { headers } from "next/headers";
import { and, asc, desc, eq, ilike, inArray, like, or, sql } from "drizzle-orm";
import { CreateWorkflowInput, WorkflowQueryParams } from "@/schemas/workflow";
import { v4 as uuidv4 } from "uuid";
import { calculateAge, formatDate } from "@/lib/utils";

export class WorkflowService {
  static async getWorkflows(params?: WorkflowQueryParams) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "title",
      sortOrder = "asc",
    } = params || {};

    const offset = (page - 1) * limit;
    const cacheKey = `workflows:${JSON.stringify(params)}`;

    return withCache(cacheKey, async () => {
      // Build the where clause based on filters
      let whereClause = undefined;
      const filters = [];

      if (search) {
        filters.push(
          or(
            ilike(workflow.title, `%${search}%`),
            ilike(workflow.description, `%${search}%`)
          )
        );
      }

      if (filters.length > 0) {
        whereClause = and(...filters);
      }

      // Build the order by clause
      const orderBy = (() => {
        const direction = sortOrder === "asc" ? asc : desc;

        switch (sortBy) {
          case "title":
            return [direction(workflow.title)];
          default:
            return [direction(workflow.createdAt)];
        }
      })();

      // Execute the query
      const workflows = await db
        .select({
          id: workflow.id,
          title: workflow.title,
          description: workflow.description,
          createdAt: workflow.createdAt,
          lastUpdated: workflow.updatedAt,
        })
        .from(workflow)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset);

      const newWorkflows = await Promise.all(
        workflows.map(async (workflow) => {
          const [{ patients }] = await db
            .select({ patients: sql<number>`count(*)` })
            .from(workflowPatient)
            .where(eq(workflowPatient.workflowId, workflow.id));

          const [{ alerts }] = await db
            .select({ alerts: sql<number>`count(*)` })
            .from(workflowPatient)
            .innerJoin(
              historique,
              eq(historique.patientId, workflowPatient.patientId)
            )
            .where(
              and(
                eq(historique.type, "alert"),
                eq(workflowPatient.workflowId, workflow.id)
              )
            );

          const [{ tasks }] = await db
          .select({ tasks: sql<number>`count(*)` })
          .from(workflowPatient)
          .innerJoin(
            taskTable,
            eq(taskTable.patientId, workflowPatient.patientId)
          )
          .where(
              eq(workflowPatient.workflowId, workflow.id)
          );

          return {
            ...workflow,
            patients,
            alerts,
            tasks,
            lastUpdated: formatDate(workflow.lastUpdated),
          };
        })
      );

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(workflow)
        .where(whereClause);

      return {
        data: newWorkflows,
        pagination: {
          page,
          limit,
          totalItems: Number(count),
          totalPages: Math.ceil(Number(count) / limit),
        },
      };
    });
  }

  static async getWorkflowById(id: string) {
    const cacheKey = `workflows:${id}`;

    return withCache(cacheKey, async () => {
      const result = await db
        .select()
        .from(workflow)
        .where(eq(workflow.id, id));

      if (!result) {
        throw ApiError.notFound(`Workflow with ID ${id} not found`);
      }

      const data = await Promise.all(
        result.map(async (workflow) => {
          const [{ patients }] = await db
            .select({ patients: sql<number>`count(*)` })
            .from(workflowPatient)
            .where(eq(workflowPatient.workflowId, workflow.id));

          const [{ criticalAlerts }] = await db
            .select({ criticalAlerts: sql<number>`count(*)` })
            .from(workflowPatient)
            .innerJoin(
              historique,
              eq(historique.patientId, workflowPatient.patientId)
            )
            .where(
              and(
                eq(historique.type, "alert"),
                eq(workflowPatient.workflowId, workflow.id),
                eq(historique.alertType, "critical")
              )
            );

          const [{ warningAlerts }] = await db
            .select({ warningAlerts: sql<number>`count(*)` })
            .from(workflowPatient)
            .innerJoin(
              historique,
              eq(historique.patientId, workflowPatient.patientId)
            )
            .where(
              and(
                eq(historique.type, "alert"),
                eq(workflowPatient.workflowId, workflow.id),
                eq(historique.alertType, "warning")
              )
            );

          const [{ pendingTasks }] = await db
            .select({ pendingTasks: sql<number>`count(*)` })
            .from(workflowPatient)
            .innerJoin(
              taskTable,
              eq(taskTable.patientId, workflowPatient.patientId)
            )
            .where(
              and(
                eq(workflowPatient.workflowId, workflow.id),
                eq(taskTable.completed, false)
              )
            );

            const [{ completedTasks }] = await db
            .select({ completedTasks: sql<number>`count(*)` })
            .from(workflowPatient)
            .innerJoin(
              taskTable,
              eq(taskTable.patientId, workflowPatient.patientId)
            )
            .where(
              and(
                eq(workflowPatient.workflowId, workflow.id),
                eq(taskTable.completed, true)
              )
            );

          return {
            ...workflow,
            patients,
            alerts: {
              total: Number(criticalAlerts) + Number(warningAlerts),
              critical: criticalAlerts,
              warning: warningAlerts,
            },
            tasks: {
              total: Number(completedTasks) + Number(pendingTasks),
              completed: completedTasks,
              pending: pendingTasks,
            },
            lastUpdated: formatDate(workflow.updatedAt),
          };
        })
      );

      return data[0];
    });
  }

  static async getWorkflowPatients(id: string) {
    const cacheKey = `workflows-patients:${id}`;

    return withCache(cacheKey, async () => {
      const result = await db
        .select({
          id: patient.id,
          name: sql<string>`${patient.firstname} || ' ' || ${patient.lastname}`,
          stage: infoMedical.stade,
          lastVisit: infoMedical.lastvisite,
          nextVisit: infoMedical.nextvisite,
          birthdate: patient.birthdate,
          status: infoMedical.status,
          initials: sql<string>`substring(${patient.firstname}, 1, 1) || substring(${patient.lastname}, 1, 1)`,
          avatar: sql<string>`'/placeholder.svg?height=40&width=40'`,
        })
        .from(workflowPatient)
        .innerJoin(patient, eq(patient.id, workflowPatient.patientId))
        .innerJoin(infoMedical, eq(infoMedical.patientId, patient.id))
        .where(eq(workflowPatient.workflowId, id));

      if (!result) {
        throw ApiError.notFound(`Workflow with ID ${id} not found`);
      }

      const data = await Promise.all(
        result.map(async (data) => {
          const [{ alerts }] = await db
            .select({ alerts: sql<number>`count(*)` })
            .from(workflowPatient)
            .innerJoin(
              historique,
              eq(historique.patientId, workflowPatient.patientId)
            )
            .where(
              and(
                eq(historique.type, "alert"),
                eq(workflowPatient.workflowId, id)
              )
            );

          return {
            ...data,
            alerts,
            tasks: 3,
            age: calculateAge(data.birthdate),
          };
        })
      );
      return data;
    });
  }

  static async getWorkflowTasks(id: string) {
    const cacheKey = `workflows-tasks:${id}`;
    return withCache(cacheKey, async () => {
      const result = await db
        .select({
          id: taskTable.id,
          title: taskTable.title,
          patientId: taskTable.patientId,
          patient: sql<string>`${patient.firstname} || ' ' || ${patient.lastname}`,
          avatar: sql<string>`'/placeholder.svg?height=40&width=40'`,
          initials: sql<string>`substring(${patient.firstname}, 1, 1) || substring(${patient.lastname}, 1, 1)`,
          dueDate: taskTable.dueDate,
          priority: taskTable.priority,
          completed: taskTable.completed,
          assignedTo: taskTable.assignedTo,
        })
        .from(workflowPatient)
        .innerJoin(patient, eq(patient.id, workflowPatient.patientId))
        .innerJoin(taskTable, eq(taskTable.patientId, workflowPatient.patientId))
        .where(eq(workflowPatient.workflowId, id))
        .orderBy(desc(taskTable.dueDate))
        ;

      if (!result) {
        throw ApiError.notFound(`Workflow with ID ${id} not found`);
      }

      const data = await Promise.all(
        result.map(async (item) => {
          const patientData = {
            id: item.patientId,
            name: item.patient,
            avatar: item.avatar,
            initials: item.initials,
          };

          const { patientId, patient, avatar, initials, ...rest } = item;

          return {
            ...rest,
            patient: patientData,
            dueDate: formatDate(item.dueDate),
          };
        })
      );

      return data;
    
    });
  }

  static async getWorkflowAlerts(id: string) {
    const cacheKey = `workflows-alerts:${id}`;

    return withCache(cacheKey, async () => {
      const result = await db
        .select({
          id: historique.id,
          patientId: historique.patientId,
          patient: sql<string>`${patient.firstname} || ' ' || ${patient.lastname}`,
          avatar: sql<string>`'/placeholder.svg?height=40&width=40'`,
          initials: sql<string>`substring(${patient.firstname}, 1, 1) || substring(${patient.lastname}, 1, 1)`,
          type: historique.alertType,
          message: historique.description,
          createdAt: historique.createdAt,
          resolved: historique.isResolved,
          // date: sql<string>`strftime('%d/%m/%Y', ${historique.createdAt})`,
        })
        .from(workflowPatient)
        .innerJoin(
          historique,
          eq(historique.patientId, workflowPatient.patientId)
        )
        .innerJoin(patient, eq(patient.id, historique.patientId))
        .where(
          and(eq(workflowPatient.workflowId, id), eq(historique.type, "alert"))
        );

      if (!result) {
        throw ApiError.notFound(`Workflow with ID ${id} not found`);
      }

      const data = await Promise.all(
        result.map(async (item) => {
          const patientData = {
            id: item.patientId,
            name: item.patient,
            avatar: item.avatar,
            initials: item.initials,
          };

          const { patientId, patient, avatar, initials, ...rest } = item;

          return {
            ...rest,
            patient: patientData,
            date: formatDate(item.createdAt),
          };
        })
      );

      return data;
    });
  }

  static async createWorkflow(data: CreateWorkflowInput) {
    const { title, description } = data;

    try {
      const medecin = await auth.api.getSession({
        headers: await headers(),
      });

      if (!medecin || !medecin.user) {
        throw ApiError.unauthorized(
          "Vous devez être connecté pour créer un workflow"
        );
      }

      const existingWorkflow = await db
        .select()
        .from(workflow)
        .where(eq(workflow.title, title))
        .limit(1);

      if (existingWorkflow.length > 0) {
        throw ApiError.conflict("Le workflow existe déjà");
      }

      const [insertedWorkflow] = await db
        .insert(workflow)
        .values({
          id: uuidv4(),
          title,
          description,
        })
        .returning();

      return this.getWorkflowById(insertedWorkflow.id);
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Erreur lors de la création du workflow");
    }

    // const workflow = await db.workflow.create(data);
    // return workflow;
  }
}
