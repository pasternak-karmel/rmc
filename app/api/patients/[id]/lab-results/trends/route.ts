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
    const { searchParams } = new URL(req.url);
    const testName = searchParams.get("testName");

    if (!testName) {
      return NextResponse.json(
        { error: "Test name is required" },
        { status: 400 }
      );
    }

    const params = await segmentData.params;
    const result = await LabResultsService.getLabResultTrends(
      params.id,
      testName
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching lab result trends:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch lab result trends" },
      { status: 500 }
    );
  }
}
