import { z } from "zod";

export const createWorkflowSchema = z.object({
  title: z.string().min(2, "Workflow name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  // createdBy: z.string().min(1, "Creator name is required"),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

export const addPatientToWorkflowSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  workflowId: z.string().uuid("Invalid workflow ID"),
});

export const createWorkflowTaskSchema = z.object({
  workflowId: z.string().uuid("Invalid workflow ID"),
  patientId: z.string().uuid("Invalid patient ID"),
  title: z.string().min(2, "Task title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format"),
  priority: z.enum(["high", "medium", "low"]),
  assignedTo: z.string().min(1, "Assignee name is required"),
  completed: z.boolean().default(false),
});

export const updateWorkflowTaskSchema = createWorkflowTaskSchema
  .partial()
  .omit({ workflowId: true });

export const workflowQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(["title", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const workflowTaskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  patientId: z.string().uuid("Invalid patient ID").optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  completed: z.boolean().optional(),
  sortBy: z.enum(["dueDate", "priority"]).default("dueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type AddPatientToWorkflowInput = z.infer<
  typeof addPatientToWorkflowSchema
>;
export type CreateWorkflowTaskInput = z.infer<typeof createWorkflowTaskSchema>;
export type UpdateWorkflowTaskInput = z.infer<typeof updateWorkflowTaskSchema>;
export type WorkflowQueryParams = z.infer<typeof workflowQuerySchema>;
export type WorkflowTaskQueryParams = z.infer<typeof workflowTaskQuerySchema>;
