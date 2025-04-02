import { ApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { LabResultsService } from "@/services/lab-results-service";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

    const filters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      abnormalOnly: searchParams.has("abnormalOnly")
        ? searchParams.get("abnormalOnly") === "true"
        : undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
      page: searchParams.has("page")
        ? Number(searchParams.get("page"))
        : undefined,
      limit: searchParams.has("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
    };

    const params = await segmentData.params;
    const result = await LabResultsService.getLabResults(params.id, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching lab results:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch lab results" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const body = await req.json();

    const labTestResultSchema = z.object({
      name: z.string().min(1, "Test name is required"),
      value: z.number(),
      unit: z.string(),
      referenceMin: z.number().optional(),
      referenceMax: z.number().optional(),
      isAbnormal: z.boolean(),
    });

    const schema = z.object({
      date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }),
      results: z
        .array(labTestResultSchema)
        .min(1, "At least one test result is required"),
      labName: z.string().optional(),
      notes: z.string().optional(),
    });

    const validatedData = schema.parse(body);

    const params = await segmentData.params;
    const data = {
      ...validatedData,
      patientId: params.id,
    };

    const result = await LabResultsService.createLabResult(data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating lab result:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to create lab result" },
      { status: 500 }
    );
  }
}
