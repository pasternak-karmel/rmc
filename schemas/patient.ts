import { z } from "zod";

export const createPatientSchema = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must be in YYYY-MM-DD format"),
  sex: z.enum(["M", "F"], {
    errorMap: () => ({ message: "Sex must be either M or F" }),
  }),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  medicalInfo: z.object({
    stage: z.number().int().min(1).max(5),
    status: z.enum(["stable", "improving", "worsening", "critical"]),
    medecin: z.string().min(1, "Doctor name is required"),
    dfg: z.number().int().min(0),
    proteinurie: z.number().min(0),
  }),
});

export const updatePatientSchema = createPatientSchema.partial();

export const patientQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  stage: z.coerce.number().int().min(1).max(5).optional(),
  status: z.enum(["stable", "improving", "worsening", "critical"]).optional(),
  sortBy: z.enum(["name", "stage", "dfg", "lastVisit"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const patientSchema = z.object({
  id: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  birthdate: z.string(),
  sex: z.string(),
  phone: z.string(),
  address: z.string(),
  medicalInfo: z.object({
    stade: z.number(),
    status: z.string(),
    medecin: z.string(),
    dfg: z.number(),
    proteinurie: z.number(),
    lastvisite: z.string(),
    nextvisite: z.string(),
  }),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientQueryParams = z.infer<typeof patientQuerySchema>;
