import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { PatientService } from "@/services/patient-service";
import type { NextRequest } from "next/server";
import { z } from "zod";

const appointmentsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(30).optional().default(7),
});

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 50,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);

    const searchParams = req.nextUrl.searchParams;
    const days = searchParams.get("days");

    const validatedParams = appointmentsQuerySchema.parse({
      days: days ? Number(days) : undefined,
    });

    const results = await PatientService.getPatientsWithUpcomingAppointments(
      validatedParams.days
    );

    return Response.json(results);
  } catch (error) {
    return handleApiError(error);
  }
}
