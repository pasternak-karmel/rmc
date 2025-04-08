import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { ReportService } from "@/services/report-service";
import type { NextRequest } from "next/server";
import { z } from "zod";

const reportQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const createReportSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  content: z.string().min(1, "Content is required"),
  status: z.string().optional(),
  sendToPatient: z.boolean().optional(),
});

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 100,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);
    const params = await segmentData.params;
    const searchParams = req.nextUrl.searchParams;

    // Parse and validate query parameters
    const validatedParams = reportQuerySchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    // Get reports for the patient
    const reports = await ReportService.getReports({
      patientId: params.id,
      ...validatedParams,
    });

    return Response.json(reports);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 20,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    const user = await getAuthenticatedUser(req);
    const params = await segmentData.params;
    const body = await req.json();

    // Validate request body
    const validatedData = createReportSchema.parse({
      ...body,
      patientId: params.id,
    });

    // Create report
    const report = await ReportService.createReport({
      ...validatedData,
      doctorId: user.id,
    });

    return Response.json(report, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
