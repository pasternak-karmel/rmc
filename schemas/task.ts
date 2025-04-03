import { z } from "zod";

export interface Task {
//   id: string;
  title: string;
  priority: string;
  completed: boolean;
  dueDate: string;
  assignedTo: string;
  patientId: string;
//   createdAt: string;
//   updatedAt: string;
}

export const createTaskSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format"),
  priority: z.enum(["high", "medium", "low"]),
  assignedTo: z.string().min(1, "Assignee name is required"),
  completed: z.boolean().default(false),
  patientId: z.string().uuid("Invalid patient ID"),
});

export const updateTaskSchema = createTaskSchema.partial();
export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  patientId: z.string().uuid("Invalid patient ID").optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  completed: z.boolean().optional(),
  sortBy: z.enum(["dueDate", "priority"]).default("dueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
