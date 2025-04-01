import { z } from "zod";

export const createMedicationSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
  status: z.enum(["active", "discontinued"]).default("active"),
  prescribedBy: z.string().min(1, "Prescriber name is required"),
  notes: z.string().optional(),
  category: z.string().optional(),
  interactions: z.boolean().default(false),
});

export const updateMedicationSchema = createMedicationSchema
  .partial()
  .omit({ patientId: true });

export const medicationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["active", "discontinued"]).optional(),
  category: z.string().optional(),
  sortBy: z.enum(["name", "startDate"]).default("startDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type MedicationQueryParams = z.infer<typeof medicationQuerySchema>;
