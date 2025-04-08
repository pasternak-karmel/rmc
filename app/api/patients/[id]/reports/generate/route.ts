import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { ReportService } from "@/services/report-service";
import type { NextRequest } from "next/server";
import { z } from "zod";

const generateReportSchema = z.object({
  type: z.string().min(1, "Type is required"),
});

type Params = Promise<{ id: string }>;

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

    // Validate request body
    const validatedData = generateReportSchema.parse(body);

    // Generate report
    const report = await ReportService.generateReport(
      params.id,
      user.id,
      validatedData.type
    );

    return Response.json(report);
  } catch (error) {
    return handleApiError(error);
  }
}
