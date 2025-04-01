import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { updatePatientSchema } from "@/schemas/patient";
import { PatientService } from "@/services/patient-service";
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

    const params = await segmentData.params;
    const result = await PatientService.getPatientById(params.id);

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 50,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    const user = await getAuthenticatedUser(req);
    const params = await segmentData.params;
    const body = await req.json();

    // If medecin is not provided in the update, use the authenticated user's name
    if (body.medicalInfo && !body.medicalInfo.medecin) {
      body.medicalInfo.medecin = user.name || user.email;
    }

    const validatedData = updatePatientSchema.parse(body);

    const result = await PatientService.updatePatient(params.id, validatedData);

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 20,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);

    const params = await segmentData.params;
    const result = await PatientService.deletePatient(params.id);

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
