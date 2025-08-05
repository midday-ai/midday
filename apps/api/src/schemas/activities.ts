import { z } from "@hono/zod-openapi";

export const getActivitiesSchema = z
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
        description: "Number of activities to return per page (1-100)",
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
          "Filter by activity status. Can be a single status or array of statuses. unread = new notifications, read = viewed but not dismissed, archived = dismissed from view",
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
        description: "Filter activities by specific user ID",
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
        description: "Filter activities by priority level (1-10)",
        example: 5,
        param: {
          in: "query",
        },
      }),
  })
  .openapi("GetActivitiesSchema");

export const updateActivityStatusSchema = z
  .object({
    activityId: z.string().uuid().openapi({
      description: "The ID of the activity to update",
      example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
    }),
    status: z.enum(["unread", "read", "archived"]).openapi({
      description: "The new status for the activity",
      example: "read",
    }),
  })
  .openapi("UpdateActivityStatusSchema");

export const updateAllActivitiesStatusSchema = z
  .object({
    status: z.enum(["unread", "read", "archived"]).openapi({
      description: "The new status for all activities",
      example: "read",
    }),
    userId: z.string().uuid().optional().openapi({
      description:
        "Optional user ID to limit the operation to activities for a specific user",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
  })
  .openapi("UpdateAllActivitiesStatusSchema");

// Response schemas for REST API
export const activitySchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier of the activity",
      example: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
    }),
    createdAt: z.string().openapi({
      description: "ISO timestamp when the activity was created",
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
      description: "Type of activity",
      example: "transactions_created",
    }),
    priority: z.number().int().min(1).max(10).openapi({
      description: "Priority level of the activity (1-10)",
      example: 5,
    }),
    source: z.enum(["system", "user"]).openapi({
      description: "Source of the activity",
      example: "system",
    }),
    status: z.enum(["unread", "read", "archived"]).openapi({
      description: "Current status of the activity",
      example: "unread",
    }),
    metadata: z.record(z.any()).openapi({
      description: "Additional metadata for the activity",
      example: { transactionCount: 5, enrichedCount: 3 },
    }),
    lastUsedAt: z.string().nullable().openapi({
      description:
        "ISO timestamp when the activity was last used by the system",
      example: "2024-04-15T11:00:00.000Z",
    }),
  })
  .openapi("ActivitySchema");

export const activitiesResponseSchema = z
  .object({
    data: z.array(activitySchema).openapi({
      description: "Array of activities",
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
  .openapi("ActivitiesResponseSchema");

export const activityResponseSchema = z
  .object({
    data: activitySchema.openapi({
      description: "The updated activity",
    }),
  })
  .openapi("ActivityResponseSchema");

export const updateAllActivitiesStatusResponseSchema = z
  .object({
    data: z.array(activitySchema).openapi({
      description: "Array of activities that were updated",
    }),
  })
  .openapi("UpdateAllActivitiesStatusResponseSchema");
