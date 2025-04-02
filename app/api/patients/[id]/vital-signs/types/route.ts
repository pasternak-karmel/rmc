import { ApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { VitalSignsService } from "@/services/vital-signs-service";
import { type NextRequest, NextResponse } from "next/server";

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
    const { id } = params;
    const result = await VitalSignsService.getAvailableVitalSignTypes(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching available vital sign types:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch available vital sign types" },
      { status: 500 }
    );
  }
}
