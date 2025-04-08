import { db } from "@/db";
import { Notifications } from "@/db/schema";
import { handleApiError } from "@/lib/api-error";
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
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await segmentData.params;
    if (!params.id) {
      return Response.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const [notification] = await db
      .select()
      .from(Notifications)
      .where(
        and(eq(Notifications.id, params.id), eq(Notifications.userId, user.id))
      );

    if (!notification) {
      return Response.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    await db
      .update(Notifications)
      .set({
        read: true,
        updatedAt: new Date(),
      })
      .where(eq(Notifications.id, params.id));

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
