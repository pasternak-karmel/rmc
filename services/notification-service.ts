import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { Notifications, notificationPreferences, patient } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { deleteCache, deleteCacheByPattern, withCache } from "@/lib/cache";
import { and, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export interface NotificationFilters {
  userId?: string;
  patientId?: string;
  type?: string | string[];
  category?: string | string[];
  priority?: string | string[];
  status?: string | string[];
  read?: boolean;
  actionRequired?: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateNotificationInput {
  userId: string;
  patientId?: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority?: string;
  status?: string;
  actionRequired?: boolean;
  actionType?: string;
  actionUrl?: string;
  scheduledFor?: Date | string;
  expiresAt?: Date | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Get notifications with filtering, sorting, and pagination
   */
  static async getNotifications(filters: NotificationFilters = {}) {
    const {
      patientId,
      type,
      category,
      priority,
      status,
      read,
      actionRequired,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sortBy = "createdAt",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sortOrder = "desc",
    } = filters;

    let userId = filters.userId;

    // const offset = (page - 1) * limit;

    const cacheKey = `notifications:${userId || ""}:${page}:${limit}:${JSON.stringify(filters)}`;

    return withCache(cacheKey, async () => {
      const whereConditions = [];

      if (userId) {
        whereConditions.push(eq(Notifications.userId, userId));
      }

      if (patientId) {
        whereConditions.push(eq(Notifications.patientId, patientId));
      }

      if (type) {
        if (Array.isArray(type)) {
          whereConditions.push(inArray(Notifications.type, type));
        } else {
          whereConditions.push(eq(Notifications.type, type));
        }
      }

      if (category) {
        if (Array.isArray(category)) {
          whereConditions.push(inArray(Notifications.category, category));
        } else {
          whereConditions.push(eq(Notifications.category, category));
        }
      }

      if (priority) {
        if (Array.isArray(priority)) {
          whereConditions.push(inArray(Notifications.priority, priority));
        } else {
          whereConditions.push(eq(Notifications.priority, priority));
        }
      }

      if (status) {
        if (Array.isArray(status)) {
          whereConditions.push(inArray(Notifications.status, status));
        } else {
          whereConditions.push(eq(Notifications.status, status));
        }
      }

      if (read !== undefined) {
        whereConditions.push(eq(Notifications.read, read));
      }

      if (actionRequired !== undefined) {
        whereConditions.push(eq(Notifications.actionRequired, actionRequired));
      }

      if (startDate) {
        const startDateObj =
          typeof startDate === "string" ? new Date(startDate) : startDate;
        whereConditions.push(gte(Notifications.createdAt, startDateObj));
      }

      if (endDate) {
        const endDateObj =
          typeof endDate === "string" ? new Date(endDate) : endDate;
        whereConditions.push(lte(Notifications.createdAt, endDateObj));
      }

      if (search) {
        whereConditions.push(
          or(
            ilike(Notifications.title, `%${search}%`),
            ilike(Notifications.message, `%${search}%`)
          )
        );
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Build order by clause
      // const orderByClause = (() => {
      //   const direction = sortOrder === "asc" ? asc : desc;

      //   switch (sortBy) {
      //     case "createdAt":
      //       return direction(Notifications.createdAt);
      //     case "priority":
      //       return direction(Notifications.priority);
      //     case "scheduledFor":
      //       return direction(Notifications.scheduledFor);
      //     case "expiresAt":
      //       return direction(Notifications.expiresAt);
      //     default:
      //       return direction(Notifications.createdAt);
      //   }
      // })();

      // let notifications;

      // if (patientId) {
      //   // Query with patient join
      //   const query = db
      //     .select({
      //       id: Notifications.id,
      //       userId: Notifications.userId,
      //       patientId: Notifications.patientId,
      //       title: Notifications.title,
      //       message: Notifications.message,
      //       type: Notifications.type,
      //       category: Notifications.category,
      //       priority: Notifications.priority,
      //       status: Notifications.status,
      //       read: Notifications.read,
      //       actionRequired: Notifications.actionRequired,
      //       actionType: Notifications.actionType,
      //       actionUrl: Notifications.actionUrl,
      //       scheduledFor: Notifications.scheduledFor,
      //       expiresAt: Notifications.expiresAt,
      //       metadata: Notifications.metadata,
      //       createdAt: Notifications.createdAt,
      //       updatedAt: Notifications.updatedAt,
      //       patient: {
      //         id: patient.id,
      //         firstname: patient.firstname,
      //         lastname: patient.lastname,
      //       },
      //     })
      //     .from(Notifications)
      //     .leftJoin(patient, eq(Notifications.patientId, patient.id));

      //   if (whereClause) {
      //     notifications = await query
      //       .where(whereClause)
      //       .orderBy(orderByClause)
      //       .limit(limit)
      //       .offset(offset);
      //   } else {
      //     notifications = await query
      //       .orderBy(orderByClause)
      //       .limit(limit)
      //       .offset(offset);
      //   }
      // } else {
      //   // Query without patient join
      //   const query = db.select().from(Notifications);

      //   if (whereClause) {
      //     notifications = await query
      //       .where(whereClause)
      //       .orderBy(orderByClause)
      //       .limit(limit)
      //       .offset(offset);
      //   } else {
      //     notifications = await query
      //       .orderBy(orderByClause)
      //       .limit(limit)
      //       .offset(offset);
      //   }
      // }

      if (!userId) {
        const session = await auth.api.getSession({
          headers: await headers(),
        });
        userId = session?.user?.id;
      }

      if (!userId) {
        throw ApiError.badRequest("User not found");
      }
      const notifications = await db.select().from(Notifications);
      // .where(eq(Notifications.userId, userId));
      // .orderBy(orderByClause)
      // .limit(limit)
      // .offset(offset);

      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(Notifications);

      if (whereClause) {
        countQuery.where(whereClause);
      }

      const [{ count }] = await countQuery;

      return {
        data: notifications,
        pagination: {
          page,
          limit,
          totalItems: Number(count),
          totalPages: Math.ceil(Number(count) / limit),
        },
      };
    });
  }

  /**
   * Get a notification by ID
   */
  static async getNotificationById(id: string) {
    const cacheKey = `notification:${id}`;

    return withCache(cacheKey, async () => {
      const [notification] = await db
        .select({
          id: Notifications.id,
          userId: Notifications.userId,
          patientId: Notifications.patientId,
          title: Notifications.title,
          message: Notifications.message,
          type: Notifications.type,
          category: Notifications.category,
          priority: Notifications.priority,
          status: Notifications.status,
          read: Notifications.read,
          actionRequired: Notifications.actionRequired,
          actionType: Notifications.actionType,
          actionUrl: Notifications.actionUrl,
          scheduledFor: Notifications.scheduledFor,
          expiresAt: Notifications.expiresAt,
          metadata: Notifications.metadata,
          createdAt: Notifications.createdAt,
          updatedAt: Notifications.updatedAt,
          patient: {
            id: patient.id,
            firstname: patient.firstname,
            lastname: patient.lastname,
          },
        })
        .from(Notifications)
        .leftJoin(patient, eq(Notifications.patientId, patient.id))
        .where(eq(Notifications.id, id));

      if (!notification) {
        throw ApiError.notFound(`Notification with ID ${id} not found`);
      }

      return notification;
    });
  }

  /**
   * Create a new notification
   */
  static async createNotification(data: CreateNotificationInput) {
    const {
      userId,
      patientId,
      title,
      message,
      type,
      category,
      priority = "normal",
      status = "pending",
      actionRequired = false,
      actionType,
      actionUrl,
      scheduledFor,
      expiresAt,
      metadata,
    } = data;

    try {
      if (!userId) {
        throw ApiError.badRequest("User ID is required");
      }

      if (!title || !message) {
        throw ApiError.badRequest("Title and message are required");
      }

      // Check if user exists
      const [userExists] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId));

      if (!userExists) {
        throw ApiError.notFound(`User with ID ${userId} not found`);
      }

      // Check if patient exists (if patientId is provided)
      if (patientId) {
        const [patientExists] = await db
          .select({ id: patient.id })
          .from(patient)
          .where(eq(patient.id, patientId));

        if (!patientExists) {
          throw ApiError.notFound(`Patient with ID ${patientId} not found`);
        }
      }

      // Check user notification preferences
      const [preferences] = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.userId, userId),
            eq(notificationPreferences.category, category)
          )
        );

      // If preferences exist and notifications are disabled for this category, don't create the notification
      if (preferences && !preferences.enabled) {
        return {
          skipped: true,
          reason: "Notifications disabled for this category",
        };
      }

      // If preferences exist and the priority is below the minimum priority, don't create the notification
      if (
        preferences &&
        !isPriorityHighEnough(priority, preferences.minPriority)
      ) {
        return {
          skipped: true,
          reason: "Notification priority below minimum threshold",
        };
      }

      // Create notification
      const id = uuidv4();
      const now = new Date();

      // Validate dates if provided
      const scheduledForDate = scheduledFor ? new Date(scheduledFor) : null;
      const expiresAtDate = expiresAt ? new Date(expiresAt) : null;

      // Validate that dates are valid
      if (scheduledFor && isNaN(scheduledForDate!.getTime())) {
        throw ApiError.badRequest("Invalid scheduledFor date format");
      }

      if (expiresAt && isNaN(expiresAtDate!.getTime())) {
        throw ApiError.badRequest("Invalid expiresAt date format");
      }

      // Validate metadata is valid JSON if provided
      let parsedMetadata = null;
      if (metadata) {
        try {
          parsedMetadata = JSON.stringify(metadata);
        } catch (error) {
          throw ApiError.badRequest(`Invalid metadata format ${error}`);
        }
      }

      await db.insert(Notifications).values({
        id,
        userId,
        patientId,
        title,
        message,
        type,
        category,
        priority,
        status,
        actionRequired,
        actionType,
        actionUrl,
        scheduledFor: scheduledForDate,
        expiresAt: expiresAtDate,
        metadata: parsedMetadata,
        createdAt: now,
        updatedAt: now,
      });

      // Invalidate cache
      await deleteCacheByPattern(`notifications:${userId}:*`);
      await deleteCache(`notification-stats:${userId}`);

      // Get the created notification
      return this.getNotificationById(id);
    } catch (error) {
      console.error("Error creating notification:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        throw ApiError.internalServer(
          `Failed to create notification: ${error.message}`
        );
      }

      throw ApiError.internalServer("Failed to create notification");
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id: string) {
    try {
      const notification = await this.getNotificationById(id);

      await db
        .update(Notifications)
        .set({ read: true, updatedAt: new Date() })
        .where(eq(Notifications.id, id));

      // Invalidate cache
      await deleteCache(`notification:${id}`);
      await deleteCacheByPattern(`notifications:${notification.userId}:*`);

      return { success: true };
    } catch (error) {
      console.error("Error marking notification as read:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to mark notification as read");
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      await db
        .update(Notifications)
        .set({ read: true, updatedAt: new Date() })
        .where(
          and(eq(Notifications.userId, userId), eq(Notifications.read, false))
        );

      // Invalidate cache
      await deleteCacheByPattern(`notifications:${userId}:*`);
      await deleteCacheByPattern(`notification:*`); // This is a bit aggressive, but ensures all notification caches are invalidated

      return { success: true };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to mark all notifications as read");
    }
  }

  /**
   * Update notification status
   */
  static async updateStatus(id: string, status: string) {
    try {
      const notification = await this.getNotificationById(id);

      await db
        .update(Notifications)
        .set({ status, updatedAt: new Date() })
        .where(eq(Notifications.id, id));

      // Invalidate cache
      await deleteCache(`notification:${id}`);
      await deleteCacheByPattern(`notifications:${notification.userId}:*`);

      return { success: true };
    } catch (error) {
      console.error("Error updating notification status:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to update notification status");
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(id: string) {
    try {
      const notification = await this.getNotificationById(id);

      await db.delete(Notifications).where(eq(Notifications.id, id));

      // Invalidate cache
      await deleteCache(`notification:${id}`);
      await deleteCacheByPattern(`notifications:${notification.userId}:*`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting notification:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Failed to delete notification");
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string) {
    const cacheKey = `notifications:${userId}:unread-count`;

    return withCache(
      cacheKey,
      async () => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(Notifications)
          .where(
            and(eq(Notifications.userId, userId), eq(Notifications.read, false))
          );

        return { count: Number(count) };
      },
      60
    ); // Cache for 1 minute
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userId: string) {
    const cacheKey = `notifications:${userId}:stats`;

    return withCache(
      cacheKey,
      async () => {
        // Get total count
        const [{ total }] = await db
          .select({ total: sql<number>`count(*)` })
          .from(Notifications)
          .where(eq(Notifications.userId, userId));

        // Get unread count
        const [{ unread }] = await db
          .select({ unread: sql<number>`count(*)` })
          .from(Notifications)
          .where(
            and(eq(Notifications.userId, userId), eq(Notifications.read, false))
          );

        // Get action required count
        const [{ actionRequired }] = await db
          .select({ actionRequired: sql<number>`count(*)` })
          .from(Notifications)
          .where(
            and(
              eq(Notifications.userId, userId),
              eq(Notifications.actionRequired, true),
              eq(Notifications.status, "pending")
            )
          );

        // Get counts by priority
        const priorityCounts = await db
          .select({
            priority: Notifications.priority,
            count: sql<number>`count(*)`,
          })
          .from(Notifications)
          .where(eq(Notifications.userId, userId))
          .groupBy(Notifications.priority);

        // Get counts by category
        const categoryCounts = await db
          .select({
            category: Notifications.category,
            count: sql<number>`count(*)`,
          })
          .from(Notifications)
          .where(eq(Notifications.userId, userId))
          .groupBy(Notifications.category);

        return {
          total: Number(total),
          unread: Number(unread),
          actionRequired: Number(actionRequired),
          byPriority: priorityCounts.reduce(
            (acc, { priority, count }) => {
              acc[priority] = Number(count);
              return acc;
            },
            {} as Record<string, number>
          ),
          byCategory: categoryCounts.reduce(
            (acc, { category, count }) => {
              acc[category] = Number(count);
              return acc;
            },
            {} as Record<string, number>
          ),
        };
      },
      300
    ); // Cache for 5 minutes
  }

  /**
   * Get notification preferences for a user
   */
  static async getNotificationPreferences(userId: string) {
    const cacheKey = `notification-preferences:${userId}`;

    return withCache(cacheKey, async () => {
      const preferences = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));

      return preferences;
    });
  }

  /**
   * Update notification preferences for a user
   */
  static async updateNotificationPreferences(
    userId: string,
    category: string,
    preferences: {
      enabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      smsEnabled?: boolean;
      minPriority?: string;
    }
  ) {
    try {
      // Check if preferences exist
      const [existingPreferences] = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.userId, userId),
            eq(notificationPreferences.category, category)
          )
        );

      const now = new Date();

      if (existingPreferences) {
        // Update existing preferences
        await db
          .update(notificationPreferences)
          .set({
            ...preferences,
            updatedAt: now,
          })
          .where(eq(notificationPreferences.id, existingPreferences.id));
      } else {
        // Create new preferences
        await db.insert(notificationPreferences).values({
          id: uuidv4(),
          userId,
          category,
          enabled: preferences.enabled ?? true,
          emailEnabled: preferences.emailEnabled ?? true,
          pushEnabled: preferences.pushEnabled ?? true,
          smsEnabled: preferences.smsEnabled ?? false,
          minPriority: preferences.minPriority ?? "normal",
          createdAt: now,
          updatedAt: now,
        });
      }

      // Invalidate cache
      await deleteCache(`notification-preferences:${userId}`);

      return { success: true };
    } catch (error) {
      console.error("Error updating notification preferences:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer(
        "Failed to update notification preferences"
      );
    }
  }
}

/**
 * Helper function to check if a priority is high enough
 */
function isPriorityHighEnough(priority: string, minPriority: string): boolean {
  const priorityValues = {
    low: 0,
    normal: 1,
    high: 2,
    urgent: 3,
  };

  return (
    (priorityValues[priority as keyof typeof priorityValues] || 0) >=
    (priorityValues[minPriority as keyof typeof priorityValues] || 0)
  );
}
