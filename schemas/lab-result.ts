import { z } from "zod";

export const createLabResultSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  results: z
    .array(
      z.object({
        name: z.string().min(1, "Test name is required"),
        value: z.number(),
        unit: z.string(),
        referenceMin: z.number().optional(),
        referenceMax: z.number().optional(),
        isAbnormal: z.boolean().default(false),
      })
    )
    .min(1, "At least one result is required"),
  labName: z.string().optional(),
  notes: z.string().optional(),
});

export const updateLabResultSchema = createLabResultSchema
  .partial()
  .omit({ patientId: true });

export const labResultQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
  abnormalOnly: z.boolean().default(false),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateLabResultInput = z.infer<typeof createLabResultSchema>;
export type UpdateLabResultInput = z.infer<typeof updateLabResultSchema>;
export type LabResultQueryParams = z.infer<typeof labResultQuerySchema>;
