import { db } from "@/db";
import { notifications } from "@/db/schema";
import { ApiError, handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 50,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    const user = await getAuthenticatedUser(req);
    const params = await segmentData.params;

    const [notification] = await db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.id, params.id), eq(notifications.userId, user.id))
      );

    if (!notification) {
      throw ApiError.notFound("Notification not found");
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, params.id));
  } catch (error) {
    return handleApiError(error);
  }
}
