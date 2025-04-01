import { db } from "@/db";
import { notifications } from "@/db/schema";
import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 50,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    const user = await getAuthenticatedUser(req);

    // Get all notifications for the user
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id));
    // .orderBy({ createdAt: "desc" });

    return Response.json(userNotifications);
  } catch (error) {
    return handleApiError(error);
  }
}
