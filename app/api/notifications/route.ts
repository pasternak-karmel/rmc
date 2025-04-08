import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { NotificationService } from "@/services/notification-service";
import type { NextRequest } from "next/server";
import { z } from "zod";

const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  read: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  actionRequired: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;

    try {
      const validatedParams = notificationQuerySchema.parse(
        Object.fromEntries(searchParams.entries())
      );

      const notifications = await NotificationService.getNotifications({
        userId: user.id,
        ...validatedParams,
      });

      return Response.json(notifications);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json(
          { error: "Invalid query parameters", details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

const createNotificationSchema = z.object({
  patientId: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.string().min(1, "Type is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "dismissed"])
    .optional(),
  actionRequired: z.boolean().optional(),
  actionType: z.string().optional(),
  actionUrl: z.string().optional(),
  scheduledFor: z.string().optional(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 20,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    const user = await getAuthenticatedUser(req);
    if (!user || !user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.log(error);
      return Response.json(
        { error: "Invalid JSON in request body" },
        {
          status: 400,
        }
      );
    }

    try {
      // Validate request body
      const validatedData = createNotificationSchema.parse(body);

      // Create notification
      const notification = await NotificationService.createNotification({
        userId: user.id,
        ...validatedData,
      });

      return Response.json(notification, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json(
          { error: "Invalid notification data", details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
