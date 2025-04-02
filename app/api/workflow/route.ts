import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { createWorkflowSchema, workflowQuerySchema } from "@/schemas/workflow";
import { WorkflowService } from "@/services/workflow-service";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 100,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    };

    // Validate query parameters
    const validatedParams = workflowQuerySchema.parse({
      page: queryParams.page ? Number(queryParams.page) : undefined,
      limit: queryParams.limit ? Number(queryParams.limit) : undefined,
      search: queryParams.search || undefined,
      sortBy: queryParams.sortBy || undefined,
      sortOrder: queryParams.sortOrder || undefined,
    });

    const result = await WorkflowService.getWorkflows(validatedParams);

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 20,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);

    const body = await req.json();

    const validatedData = createWorkflowSchema.parse(body);

    const result = await WorkflowService.createWorkflow(validatedData);

    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
