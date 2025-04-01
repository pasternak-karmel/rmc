import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import {
  createMedicalRecordSchema,
  medicalRecordQuerySchema,
} from "@/schemas/medical-record";
import { MedicalRecordService } from "@/services/medical-record-service";
import type { NextRequest } from "next/server";

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 100,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);

    const searchParams = req.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      type: searchParams.get("type"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    };

    const validatedParams = medicalRecordQuerySchema.parse({
      page: queryParams.page ? Number.parseInt(queryParams.page) : undefined,
      limit: queryParams.limit ? Number.parseInt(queryParams.limit) : undefined,
      type: queryParams.type || undefined,
      startDate: queryParams.startDate || undefined,
      endDate: queryParams.endDate || undefined,
      sortBy: queryParams.sortBy || undefined,
      sortOrder: queryParams.sortOrder || undefined,
    });

    const params = await segmentData.params;

    const result = await MedicalRecordService.getMedicalRecords(
      params.id,
      validatedParams
    );

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 50,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    const user = await getAuthenticatedUser(req);
    const params = await segmentData.params;

    const body = await req.json();
    const validatedData = createMedicalRecordSchema.parse({
      ...body,
      patientId: params.id,
      medecin: body.medecin || user.name || "Unknown",
    });

    const result = await MedicalRecordService.createMedicalRecord(
      validatedData
    );

    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
