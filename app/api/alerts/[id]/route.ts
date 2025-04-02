import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { AlertService } from "@/services/alert-service";
import type { NextRequest } from "next/server";

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 50,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);

    const params = await segmentData.params;
    const result = await AlertService.resolve(params.id);

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
