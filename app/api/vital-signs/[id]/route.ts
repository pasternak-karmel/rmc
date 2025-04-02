import { ApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { VitalSignsService } from "@/services/vital-signs-service";
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

    const params = await segmentData.params;
    const { id } = params;
    const result = await VitalSignsService.getVitalSignById(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching vital sign:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch vital sign" },
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

    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    // Validate request body
    const vitalSignDataSchema = z.object({
      type: z.string().min(1, "Type is required"),
      value: z.number(),
      unit: z.string(),
    });

    const schema = z.object({
      date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),
      measurements: z
        .array(vitalSignDataSchema)
        .min(1, "At least one measurement is required")
        .optional(),
      notes: z.string().optional(),
    });

    const validatedData = schema.parse(body);
    const result = await VitalSignsService.updateVitalSign(id, validatedData);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating vital sign:", error);

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
      { error: "Failed to update vital sign" },
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

    const params = await segmentData.params;

    const { id } = params;
    const result = await VitalSignsService.deleteVitalSign(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting vital sign:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete vital sign" },
      { status: 500 }
    );
  }
}
