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
    const { id } = await segmentData.params;
    const result = await LabResultsService.getLabResultById(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching lab result:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch lab result" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 100,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);
    const { id } = await segmentData.params;
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
      date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),
      results: z
        .array(labTestResultSchema)
        .min(1, "At least one test result is required")
        .optional(),
      labName: z.string().optional(),
      notes: z.string().optional(),
    });

    const validatedData = schema.parse(body);
    const result = await LabResultsService.updateLabResult(id, validatedData);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating lab result:", error);

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
      { error: "Failed to update lab result" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 100,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);
    const { id } = await segmentData.params;
    const result = await LabResultsService.deleteLabResult(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting lab result:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete lab result" },
      { status: 500 }
    );
  }
}
