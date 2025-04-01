import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { PatientService } from "@/services/patient-service";
import type { NextRequest } from "next/server";
import { z } from "zod";

const searchQuerySchema = z.object({
  q: z.string().min(2, "Search query must be at least 2 characters"),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 100,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = searchParams.get("limit");

    const validatedParams = searchQuerySchema.parse({
      q: query || "",
      limit: limit ? Number(limit) : undefined,
    });

    const results = await PatientService.searchPatients(
      validatedParams.q,
      validatedParams.limit
    );

    return Response.json(results);
  } catch (error) {
    return handleApiError(error);
  }
}
