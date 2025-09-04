import { z } from "@hono/zod-openapi";

export const getNotificationsSchema = z
  .object({
    cursor: z
      .string()
      .nullable()
      .optional()
      .openapi({
        description:
          "Cursor for pagination, representing the last item from the previous page",
        example: "20",
        param: {
          in: "query",
        },
      }),
    pageSize: z.coerce
      .number()
      .min(1)
      .max(100)
      .optional()
      .openapi({
        description: "Number of notifications to return per page (1-100)",
        example: 20,
        param: {
          in: "query",
        },
      }),
    status: z
      .union([
        z.enum(["unread", "read", "archived"]),
        z.array(z.enum(["unread", "read", "archived"])),
      ])
      .optional()
      .openapi({
        description:
          "Filter by notification status. Can be a single status or array of statuses. unread = new notifications, read = viewed but not dismissed, archived = dismissed from view",
        example: ["unread", "read"],
        param: {
          in: "query",
        },
      }),
    userId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .openapi({
        description: "Filter notifications by specific user ID",
        example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        param: {
          in: "query",
        },
      }),
    priority: z.coerce
      .number()
      .int()
      .min(1)
      .max(10)
      .nullable()
      .optional()
      .openapi({
        description: "Filter notifications by priority level (1-10)",
        example: 5,
        param: {
          in: "query",
        },
      }),
    maxPriority: z.coerce
      .number()
      .int()
      .min(1)
      .max(10)
      .nullable()
      .optional()
      .openapi({
        description:
          "Filter notifications by maximum priority level (priority <= maxPriority). Use 3 for user-facing notifications only.",
        example: 3,
        param: {
          in: "query",
        },
      }),
  })
  .openapi("GetNotificationsSchema");

export const updateNotificationStatusSchema = z
  .object({
    activityId: z.string().uuid().openapi({
      description: "The ID of the notification to update",
      example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
    }),
    status: z.enum(["unread", "read", "archived"]).openapi({
      description: "The new status for the notification",
      example: "read",
    }),
  })
  .openapi("UpdateNotificationStatusSchema");

export const updateAllNotificationsStatusSchema = z
  .object({
    status: z.enum(["unread", "read", "archived"]).openapi({
      description:
        "The new status to apply to all notifications for the authenticated user",
      example: "read",
    }),
  })
  .openapi("UpdateAllNotificationsStatusSchema");

// Response schemas for REST API
export const notificationSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier of the notification",
      example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
    }),
    createdAt: z.string().openapi({
      description: "ISO timestamp when the notification was created",
      example: "2024-04-15T09:00:00.000Z",
    }),
    teamId: z.string().uuid().openapi({
      description: "Unique identifier of the team",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    userId: z.string().uuid().nullable().openapi({
      description: "Unique identifier of the user (if applicable)",
      example: "c2d3e4f5-a6b7-8901-bcde-f23456789012",
    }),
    type: z.string().openapi({
      description: "Type of notification",
      example: "transactions_created",
    }),
    priority: z.number().int().min(1).max(10).openapi({
      description:
        "Priority level of the notification (1-3 = user notifications, 4-10 = insights)",
      example: 3,
    }),
    source: z.enum(["system", "user"]).openapi({
      description: "Source of the notification",
      example: "system",
    }),
    status: z.enum(["unread", "read", "archived"]).openapi({
      description: "Current status of the notification",
      example: "unread",
    }),
    metadata: z.record(z.any(), z.any()).openapi({
      description: "Additional metadata for the notification",
      example: {
        transactionCount: 5,
        dateRange: { from: "2024-04-01", to: "2024-04-15" },
      },
    }),
    lastUsedAt: z.string().nullable().openapi({
      description:
        "ISO timestamp when the notification was last used by the system",
      example: "2024-04-15T11:00:00.000Z",
    }),
  })
  .openapi("NotificationSchema");

export const notificationsResponseSchema = z
  .object({
    data: z.array(notificationSchema).openapi({
      description: "Array of notifications",
    }),
    meta: z
      .object({
        cursor: z.string().nullable().openapi({
          description: "Cursor for pagination (null if no more pages)",
          example: "40",
        }),
        hasPreviousPage: z.boolean().openapi({
          description: "Whether there are previous pages available",
          example: true,
        }),
        hasNextPage: z.boolean().openapi({
          description: "Whether there are more pages available",
          example: false,
        }),
      })
      .openapi({
        description: "Pagination metadata",
      }),
  })
  .openapi("NotificationsResponseSchema");

export const notificationResponseSchema = z
  .object({
    data: notificationSchema.openapi({
      description: "The updated notification",
    }),
  })
  .openapi("NotificationResponseSchema");

export const updateAllNotificationsStatusResponseSchema = z
  .object({
    data: z.array(notificationSchema).openapi({
      description: "Array of updated notifications",
    }),
  })
  .openapi("UpdateAllNotificationsStatusResponseSchema");
