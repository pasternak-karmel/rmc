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
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Vital sign type is required" },
        { status: 400 }
      );
    }

    const result = await VitalSignsService.getVitalSignTrends(id, type);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching vital sign trends:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch vital sign trends" },
      { status: 500 }
    );
  }
}
