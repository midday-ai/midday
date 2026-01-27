import { z } from "@hono/zod-openapi";

export const periodTypeSchema = z
  .enum(["weekly", "monthly", "quarterly", "yearly"])
  .openapi({
    description: "Type of insight period",
    example: "weekly",
  });

export const listInsightsSchema = z
  .object({
    periodType: periodTypeSchema.optional().openapi({
      description: "Filter by period type",
    }),
    limit: z.coerce.number().min(1).max(50).default(10).openapi({
      description: "Number of insights to return per page",
      example: 10,
    }),
    cursor: z.string().nullish().openapi({
      description:
        "A cursor for pagination. Pass the value returned from the previous response to get the next page.",
    }),
    includeDismissed: z
      .union([z.boolean(), z.string().transform((val) => val === "true")])
      .optional()
      .default(false)
      .openapi({
        description: "Whether to include insights the user has dismissed",
        example: false,
      }),
  })
  .openapi({
    description: "Query parameters for listing insights",
  });

export const latestInsightSchema = z
  .object({
    periodType: periodTypeSchema.optional().openapi({
      description: "Filter by period type to get the latest of that type",
    }),
  })
  .openapi({
    description: "Query parameters for getting the latest insight",
  });

export const insightByIdSchema = z
  .object({
    id: z
      .string()
      .uuid()
      .openapi({
        description: "Unique identifier of the insight",
        example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
        param: {
          in: "path",
          name: "id",
        },
      }),
  })
  .openapi({
    description: "Parameters for getting an insight by ID",
  });

export const insightByPeriodSchema = z
  .object({
    periodType: periodTypeSchema.openapi({
      description: "Type of insight period",
    }),
    periodYear: z.coerce.number().int().min(2000).max(2100).openapi({
      description: "Year of the insight period",
      example: 2024,
    }),
    periodNumber: z.coerce.number().int().min(1).max(2100).openapi({
      description:
        "Period number (week 1-53, month 1-12, quarter 1-4, or year e.g. 2024)",
      example: 1,
    }),
  })
  .superRefine((data, ctx) => {
    // Period number limits by type (yearly uses the actual year as periodNumber)
    const periodNumberLimits = {
      weekly: { min: 1, max: 53 },
      monthly: { min: 1, max: 12 },
      quarterly: { min: 1, max: 4 },
      yearly: { min: 2000, max: 2100 },
    } as const;

    const limits = periodNumberLimits[data.periodType];
    if (data.periodNumber < limits.min || data.periodNumber > limits.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Period number for ${data.periodType} periods must be between ${limits.min} and ${limits.max}`,
        path: ["periodNumber"],
      });
    }

    // For yearly periods, periodNumber should equal periodYear
    if (data.periodType === "yearly" && data.periodNumber !== data.periodYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `For yearly periods, periodNumber must equal periodYear (got ${data.periodNumber}, expected ${data.periodYear})`,
        path: ["periodNumber"],
      });
    }
  })
  .openapi({
    description: "Parameters for getting an insight by specific period",
  });

export const insightAudioUrlSchema = z
  .object({
    id: z
      .string()
      .uuid()
      .openapi({
        description: "Unique identifier of the insight",
        example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
        param: {
          in: "path",
          name: "id",
        },
      }),
  })
  .openapi({
    description: "Parameters for getting an insight audio URL",
  });

export const markInsightAsReadSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier of the insight to mark as read",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    }),
  })
  .openapi({
    description: "Parameters for marking an insight as read",
  });

export const dismissInsightSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier of the insight to dismiss",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    }),
  })
  .openapi({
    description: "Parameters for dismissing an insight",
  });

// Response schemas

// Insight metric schema
const insightMetricSchema = z
  .object({
    type: z.string().openapi({ description: "Metric type identifier" }),
    label: z.string().openapi({ description: "Human-readable metric label" }),
    value: z.number().openapi({ description: "Current period value" }),
    previousValue: z.number().openapi({ description: "Previous period value" }),
    change: z.number().openapi({ description: "Percentage change" }),
    changeDirection: z
      .enum(["up", "down", "flat"])
      .openapi({ description: "Direction of change" }),
    unit: z.string().optional().openapi({ description: "Unit of measurement" }),
    currency: z.string().optional().openapi({ description: "Currency code" }),
  })
  .openapi({ description: "A metric with comparison data" });

// Insight content schema
const insightContentSchema = z
  .object({
    title: z.string().openapi({ description: "Short hook for widget cards" }),
    summary: z.string().openapi({ description: "Opening summary sentence" }),
    story: z.string().openapi({ description: "Narrative explanation" }),
    actions: z
      .array(
        z.object({
          text: z.string(),
          type: z.string().optional(),
          entityType: z
            .enum(["invoice", "project", "customer", "transaction"])
            .optional(),
          entityId: z.string().optional(),
        }),
      )
      .openapi({ description: "Recommended actions with optional deep links" }),
  })
  .openapi({ description: "AI-generated insight content" });

// Single insight response schema
export const insightResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ description: "Unique insight identifier" }),
    teamId: z.string().uuid().openapi({ description: "Team identifier" }),
    periodType: periodTypeSchema,
    periodYear: z.number().openapi({ description: "Year of the period" }),
    periodNumber: z.number().openapi({ description: "Period number" }),
    periodStart: z.string().openapi({ description: "Period start date" }),
    periodEnd: z.string().openapi({ description: "Period end date" }),
    status: z
      .enum(["pending", "processing", "completed", "failed"])
      .openapi({ description: "Generation status" }),
    title: z.string().nullable().openapi({ description: "AI-generated title" }),
    currency: z
      .string()
      .nullable()
      .openapi({ description: "Primary currency" }),
    selectedMetrics: z
      .array(insightMetricSchema)
      .nullable()
      .openapi({ description: "Key metrics for this period" }),
    content: insightContentSchema
      .nullable()
      .openapi({ description: "AI-generated content" }),
    audioPath: z
      .string()
      .nullable()
      .openapi({ description: "Path to audio file" }),
    generatedAt: z
      .string()
      .nullable()
      .openapi({ description: "When insight was generated" }),
    createdAt: z.string().openapi({ description: "Creation timestamp" }),
    updatedAt: z.string().openapi({ description: "Last update timestamp" }),
  })
  .openapi({ description: "A business insight for a period" });

// List response schema
export const insightsListResponseSchema = z
  .object({
    meta: z
      .object({
        cursor: z.string().nullable().optional().openapi({
          description: "Cursor for next page",
        }),
        hasNextPage: z.boolean().openapi({
          description: "Whether there are more results",
        }),
      })
      .openapi({ description: "Pagination metadata" }),
    data: z.array(insightResponseSchema).openapi({
      description: "Array of insights",
    }),
  })
  .openapi({ description: "Paginated list of insights" });

export const audioUrlResponseSchema = z
  .object({
    audioUrl: z.string().url().openapi({
      description: "Pre-signed URL for the audio file",
      example: "https://storage.example.com/audio/insight-123.mp3?token=abc",
    }),
    expiresIn: z.number().openapi({
      description: "Time in seconds until the URL expires",
      example: 3600,
    }),
  })
  .openapi({
    description: "Response containing a pre-signed audio URL",
  });

export const markAsReadResponseSchema = z
  .object({
    success: z.boolean().openapi({
      description: "Whether the operation was successful",
      example: true,
    }),
    readAt: z.string().datetime().openapi({
      description: "ISO 8601 timestamp when the insight was marked as read",
      example: "2024-04-15T10:00:00.000Z",
    }),
  })
  .openapi({
    description: "Response from marking an insight as read",
  });

export const dismissResponseSchema = z
  .object({
    success: z.boolean().openapi({
      description: "Whether the operation was successful",
      example: true,
    }),
    dismissedAt: z.string().datetime().openapi({
      description: "ISO 8601 timestamp when the insight was dismissed",
      example: "2024-04-15T10:00:00.000Z",
    }),
  })
  .openapi({
    description: "Response from dismissing an insight",
  });
