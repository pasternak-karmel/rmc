import { z } from "zod";

export const createMedicalRecordSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  type: z.enum(["consultation", "lab", "medication", "document", "alert"]),
  medecin: z.string().min(1, "Doctor name is required"),
});

export const updateMedicalRecordSchema = createMedicalRecordSchema
  .partial()
  .omit({ patientId: true });

export const medicalRecordQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  type: z
    .enum(["consultation", "lab", "medication", "document", "alert"])
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
  sortBy: z.enum(["date", "type"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateMedicalRecordInput = z.infer<
  typeof createMedicalRecordSchema
>;
export type UpdateMedicalRecordInput = z.infer<
  typeof updateMedicalRecordSchema
>;
export type MedicalRecordQueryParams = z.infer<typeof medicalRecordQuerySchema>;
