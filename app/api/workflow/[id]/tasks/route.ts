import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { WorkflowService } from "@/services/workflow-service";
import type { NextRequest } from "next/server";

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
      const result = await WorkflowService.getWorkflowTasks(params.id);

      return Response.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  }