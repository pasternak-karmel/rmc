import { ApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { LabResultsService } from "@/services/lab-results-service";
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
    const { id } = await segmentData.params;
    const result = await LabResultsService.getAvailableTestNames(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching available test names:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch available test names" },
      { status: 500 }
    );
  }
}
