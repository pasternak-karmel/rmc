import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { AppointmentService } from "@/services/appointment-service";
import type { NextRequest } from "next/server";
import { z } from "zod";

const appointmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  duration: z.number().int().positive().default(30),
  location: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  notes: z.string().optional(),
  sendConfirmation: z.boolean().optional(),
  sendReminder: z.boolean().optional(),
});

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
    const searchParams = req.nextUrl.searchParams;

    const validatedParams = appointmentQuerySchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    const appointments = await AppointmentService.getAppointments({
      patientId: params.id,
      ...validatedParams,
    });

    return Response.json(appointments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 20,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    const user = await getAuthenticatedUser(req);
    const params = await segmentData.params;
    const body = await req.json();

    if (body.doctorId === "current-user") {
      body.doctorId = user.id;
    }

    const validatedData = createAppointmentSchema.parse({
      ...body,
      patientId: params.id,
    });

    const appointment =
      await AppointmentService.createAppointment(validatedData);

    return Response.json(appointment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
