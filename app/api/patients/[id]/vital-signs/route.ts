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
    const { searchParams } = new URL(req.url);

    const filters = {
      type: searchParams.get("type") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
      page: searchParams.has("page")
        ? Number(searchParams.get("page"))
        : undefined,
      limit: searchParams.has("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
    };

    const result = await VitalSignsService.getVitalSigns(id, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching vital signs:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch vital signs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
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

    const vitalSignDataSchema = z.object({
      type: z.string().min(1, "Type is required"),
      value: z.number(),
      unit: z.string(),
    });

    const schema = z.object({
      date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }),
      measurements: z
        .array(vitalSignDataSchema)
        .min(1, "At least one measurement is required"),
      notes: z.string().optional(),
    });

    const validatedData = schema.parse(body);

    const data = {
      ...validatedData,
      patientId: id,
    };

    const result = await VitalSignsService.createVitalSign(data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating vital sign:", error);

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
      { error: "Failed to create vital sign" },
      { status: 500 }
    );
  }
}
