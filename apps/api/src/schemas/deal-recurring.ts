import { z } from "@hono/zod-openapi";
import {
  RECURRING_END_TYPES,
  RECURRING_FREQUENCIES,
  RECURRING_STATUSES,
} from "@midday/deal/recurring";
import { isValidTimezone } from "@midday/location/timezones";
import { draftLineItemSchema, upsertDealTemplateSchema } from "./deal";

/**
 * Zod schema for timezone validation
 */
const timezoneSchema = z
  .string()
  .refine(isValidTimezone, {
    message:
      "Invalid timezone. Use IANA timezone format (e.g., 'America/New_York', 'Europe/London', 'UTC')",
  })
  .openapi({
    description:
      "Timezone for scheduling (e.g., 'America/New_York'). Must be a valid IANA timezone identifier.",
    example: "America/New_York",
  });

// Frequency enum schema - derived from canonical constants
export const dealRecurringFrequencySchema = z.enum(RECURRING_FREQUENCIES);

// End type enum schema - derived from canonical constants
export const dealRecurringEndTypeSchema = z.enum(RECURRING_END_TYPES);

// Status enum schema - derived from canonical constants
export const dealRecurringStatusSchema = z.enum(RECURRING_STATUSES);

// Base recurring deal schema for tRPC
export const createDealRecurringSchema = z
  .object({
    // Optional: Link an existing draft deal as the first deal in the series
    dealId: z.string().uuid().optional().openapi({
      description:
        "Optional draft deal ID to convert to the first recurring deal",
      example: "d1e2f3a4-b5c6-7890-abcd-ef1234567890",
    }),
    merchantId: z.string().uuid().openapi({
      description:
        "Merchant ID for the recurring deal series (required - recurring deals auto-send)",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    merchantName: z.string().nullable().optional().openapi({
      description: "Merchant name for display",
      example: "Acme Corporation",
    }),
    // Frequency settings
    frequency: dealRecurringFrequencySchema.openapi({
      description:
        "How often deals should be generated: 'weekly' - every week on a specific day, 'biweekly' - every 2 weeks on a specific day, 'monthly_date' - monthly on a specific date (e.g., 15th), 'monthly_weekday' - monthly on a specific weekday occurrence (e.g., 1st Friday), 'monthly_last_day' - monthly on the last day, 'quarterly' - every 3 months, 'semi_annual' - every 6 months, 'annual' - every 12 months, 'custom' - every X days",
      example: "monthly_date",
    }),
    frequencyDay: z
      .number()
      .int()
      .min(0)
      .max(31)
      .nullable()
      .optional()
      .openapi({
        description:
          "For 'weekly': day of week (0=Sunday, 6=Saturday). For 'monthly_date': day of month (1-31). For 'monthly_weekday': day of week (0=Sunday, 6=Saturday)",
        example: 15,
      }),
    frequencyWeek: z
      .number()
      .int()
      .min(1)
      .max(5)
      .nullable()
      .optional()
      .openapi({
        description:
          "For 'monthly_weekday': which occurrence of the weekday (1=first, 2=second, etc.)",
        example: 1,
      }),
    frequencyInterval: z.number().int().min(1).nullable().optional().openapi({
      description: "For 'custom': number of days between deals",
      example: 14,
    }),
    // End conditions
    endType: dealRecurringEndTypeSchema.openapi({
      description:
        "When the series should end: 'never' - continues indefinitely, 'on_date' - ends on a specific date, 'after_count' - ends after a specific number of deals",
      example: "after_count",
    }),
    endDate: z.string().datetime().nullable().optional().openapi({
      description: "End date for the series (required if endType is 'on_date')",
      example: "2025-12-31T23:59:59.000Z",
    }),
    endCount: z.number().int().min(1).nullable().optional().openapi({
      description:
        "Number of deals to generate (required if endType is 'after_count')",
      example: 12,
    }),
    // Timezone
    timezone: timezoneSchema,
    // Payment terms
    dueDateOffset: z.number().int().min(0).default(30).openapi({
      description: "Days from issue date to due date",
      example: 30,
    }),
    // Deal template data
    amount: z.number().nullable().optional().openapi({
      description: "Total amount for each deal",
      example: 1500.0,
    }),
    currency: z.string().nullable().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    lineItems: z.array(draftLineItemSchema).nullable().optional().openapi({
      description: "Line items for the deal",
    }),
    template: upsertDealTemplateSchema.nullable().optional().openapi({
      description: "Deal template settings",
    }),
    paymentDetails: z.any().nullable().optional().openapi({
      description: "Payment details in TipTap JSONContent format",
    }),
    fromDetails: z.any().nullable().optional().openapi({
      description: "Sender details in TipTap JSONContent format",
    }),
    noteDetails: z.any().nullable().optional().openapi({
      description: "Note details in TipTap JSONContent format",
    }),
    vat: z.number().nullable().optional().openapi({
      description: "VAT amount",
      example: 150.0,
    }),
    tax: z.number().nullable().optional().openapi({
      description: "Tax amount",
      example: 50.0,
    }),
    discount: z.number().nullable().optional().openapi({
      description: "Discount amount",
      example: 100.0,
    }),
    subtotal: z.number().nullable().optional().openapi({
      description: "Subtotal before taxes and discounts",
      example: 1400.0,
    }),
    topBlock: z.any().nullable().optional().openapi({
      description: "Custom content block for top of deal",
    }),
    bottomBlock: z.any().nullable().optional().openapi({
      description: "Custom content block for bottom of deal",
    }),
    templateId: z.string().uuid().nullable().optional().openapi({
      description: "Reference to deal template",
      example: "c4d5e6f7-8901-2345-6789-abcdef012345",
    }),
  })
  .superRefine((data, ctx) => {
    // Validate frequencyDay is required and in valid range for weekly frequency
    if (data.frequency === "weekly") {
      if (data.frequencyDay === null || data.frequencyDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "frequencyDay is required for weekly frequency (0-6, Sunday-Saturday)",
          path: ["frequencyDay"],
        });
      } else if (data.frequencyDay < 0 || data.frequencyDay > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "For weekly frequency, frequencyDay must be 0-6 (Sunday-Saturday)",
          path: ["frequencyDay"],
        });
      }
    }

    // Validate frequencyDay is required and in valid range for biweekly frequency
    if (data.frequency === "biweekly") {
      if (data.frequencyDay === null || data.frequencyDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "frequencyDay is required for biweekly frequency (0-6, Sunday-Saturday)",
          path: ["frequencyDay"],
        });
      } else if (data.frequencyDay < 0 || data.frequencyDay > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "For biweekly frequency, frequencyDay must be 0-6 (Sunday-Saturday)",
          path: ["frequencyDay"],
        });
      }
    }

    // monthly_last_day doesn't require frequencyDay

    // Frequencies that require frequencyDay as day of month (1-31)
    const dayOfMonthFrequencies = [
      "monthly_date",
      "quarterly",
      "semi_annual",
      "annual",
    ] as const;

    // Validate frequencyDay is required and in valid range for day-of-month frequencies
    if (
      dayOfMonthFrequencies.includes(
        data.frequency as (typeof dayOfMonthFrequencies)[number],
      )
    ) {
      if (data.frequencyDay === null || data.frequencyDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `frequencyDay is required for ${data.frequency} frequency (1-31, day of month)`,
          path: ["frequencyDay"],
        });
      } else if (data.frequencyDay < 1 || data.frequencyDay > 31) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `For ${data.frequency} frequency, frequencyDay must be 1-31 (day of month)`,
          path: ["frequencyDay"],
        });
      }
    }

    // Validate frequencyDay and frequencyWeek are required for monthly_weekday frequency
    if (data.frequency === "monthly_weekday") {
      if (data.frequencyDay === null || data.frequencyDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "frequencyDay is required for monthly_weekday frequency (0-6, Sunday-Saturday)",
          path: ["frequencyDay"],
        });
      } else if (data.frequencyDay < 0 || data.frequencyDay > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "For monthly_weekday frequency, frequencyDay must be 0-6 (Sunday-Saturday)",
          path: ["frequencyDay"],
        });
      }

      if (data.frequencyWeek === null || data.frequencyWeek === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "frequencyWeek is required for monthly_weekday frequency (1-5, which occurrence)",
          path: ["frequencyWeek"],
        });
      } else if (data.frequencyWeek < 1 || data.frequencyWeek > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "For monthly_weekday frequency, frequencyWeek must be 1-5 (1st through 5th occurrence)",
          path: ["frequencyWeek"],
        });
      }
    }

    // Validate frequencyInterval is required when frequency is 'custom'
    if (data.frequency === "custom") {
      if (
        data.frequencyInterval === null ||
        data.frequencyInterval === undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "frequencyInterval is required when frequency is 'custom'",
          path: ["frequencyInterval"],
        });
      }
    }

    // Validate endDate is required when endType is 'on_date'
    if (data.endType === "on_date") {
      if (data.endDate === null || data.endDate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endDate is required when endType is 'on_date'",
          path: ["endDate"],
        });
      }
    }

    // Validate endCount is required when endType is 'after_count'
    if (data.endType === "after_count") {
      if (data.endCount === null || data.endCount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endCount is required when endType is 'after_count'",
          path: ["endCount"],
        });
      }
    }
  });

// Update schema - extends create with id and allows partial updates
export const updateDealRecurringSchema = z
  .object({
    id: z
      .string()
      .uuid()
      .openapi({
        description: "Unique identifier for the recurring deal series",
        example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
        param: { in: "path", name: "id" },
      }),
    merchantId: z.string().uuid().optional(),
    merchantName: z.string().nullable().optional(),
    frequency: dealRecurringFrequencySchema.optional(),
    frequencyDay: z.number().int().min(0).max(31).nullable().optional(),
    frequencyWeek: z.number().int().min(1).max(5).nullable().optional(),
    frequencyInterval: z.number().int().min(1).nullable().optional(),
    endType: dealRecurringEndTypeSchema.optional(),
    endDate: z.string().datetime().nullable().optional(),
    endCount: z.number().int().min(1).nullable().optional(),
    timezone: timezoneSchema.optional(),
    dueDateOffset: z.number().int().min(0).optional(),
    amount: z.number().nullable().optional(),
    currency: z.string().nullable().optional(),
    lineItems: z.array(draftLineItemSchema).nullable().optional(),
    template: upsertDealTemplateSchema.nullable().optional(),
    paymentDetails: z.any().nullable().optional(),
    fromDetails: z.any().nullable().optional(),
    noteDetails: z.any().nullable().optional(),
    vat: z.number().nullable().optional(),
    tax: z.number().nullable().optional(),
    discount: z.number().nullable().optional(),
    subtotal: z.number().nullable().optional(),
    topBlock: z.any().nullable().optional(),
    bottomBlock: z.any().nullable().optional(),
    templateId: z.string().uuid().nullable().optional(),
    status: dealRecurringStatusSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // Frequencies that require a non-null frequencyDay value (day of week: 0-6)
    const dayOfWeekFrequencies = [
      "weekly",
      "biweekly",
      "monthly_weekday",
    ] as const;

    // Frequencies that require a non-null frequencyDay value (day of month: 1-31)
    const dayOfMonthFrequencies = [
      "monthly_date",
      "quarterly",
      "semi_annual",
      "annual",
    ] as const;

    // All frequencies that require frequencyDay
    const frequenciesRequiringDay = [
      ...dayOfWeekFrequencies,
      ...dayOfMonthFrequencies,
    ] as const;

    // Validate that frequencyDay is not null when frequency requires it
    // This prevents invalid API calls like { frequency: "weekly", frequencyDay: null }
    if (
      data.frequency !== undefined &&
      frequenciesRequiringDay.includes(
        data.frequency as (typeof frequenciesRequiringDay)[number],
      ) &&
      data.frequencyDay === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `frequencyDay is required for ${data.frequency} frequency and cannot be null`,
        path: ["frequencyDay"],
      });
    }

    // Validate that frequencyWeek is not null when frequency is monthly_weekday
    // This prevents invalid API calls like { frequency: "monthly_weekday", frequencyWeek: null }
    if (data.frequency === "monthly_weekday" && data.frequencyWeek === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "frequencyWeek is required for monthly_weekday frequency and cannot be null",
        path: ["frequencyWeek"],
      });
    }

    // Validate frequencyDay based on frequency type (when both are provided in the update).
    // NOTE: When only one of frequency/frequencyDay is provided, validation against the
    // existing value is performed in the tRPC router (deal-recurring.ts) after
    // fetching the existing record. This prevents invalid states like:
    // - frequencyDay: 15 with frequency: "weekly" (weekly requires 0-6)
    // - frequencyDay: 0 with frequency: "monthly_date" (monthly_date requires 1-31)
    if (
      data.frequencyDay !== null &&
      data.frequencyDay !== undefined &&
      data.frequency !== undefined
    ) {
      // Validate day-of-week frequencies (0-6)
      if (
        dayOfWeekFrequencies.includes(
          data.frequency as (typeof dayOfWeekFrequencies)[number],
        ) &&
        data.frequencyDay > 6
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `For ${data.frequency} frequency, frequencyDay must be 0-6 (Sunday-Saturday)`,
          path: ["frequencyDay"],
        });
      }

      // Validate day-of-month frequencies (1-31)
      if (
        dayOfMonthFrequencies.includes(
          data.frequency as (typeof dayOfMonthFrequencies)[number],
        ) &&
        (data.frequencyDay < 1 || data.frequencyDay > 31)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `For ${data.frequency} frequency, frequencyDay must be 1-31 (day of month)`,
          path: ["frequencyDay"],
        });
      }
    }

    // Validate frequencyWeek range when both frequency and frequencyWeek are provided
    // NOTE: When only one is provided, validation against the existing value is
    // performed in the tRPC router after fetching the existing record.
    if (
      data.frequencyWeek !== null &&
      data.frequencyWeek !== undefined &&
      data.frequency !== undefined &&
      data.frequency === "monthly_weekday"
    ) {
      if (data.frequencyWeek < 1 || data.frequencyWeek > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "For monthly_weekday frequency, frequencyWeek must be 1-5 (1st through 5th occurrence)",
          path: ["frequencyWeek"],
        });
      }
    }

    // Validate endDate is required when endType is being set to 'on_date'
    // Only validate when endType is explicitly provided in the update
    if (data.endType === "on_date") {
      if (data.endDate === null || data.endDate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endDate is required when endType is 'on_date'",
          path: ["endDate"],
        });
      }
    }

    // Validate endCount is required when endType is being set to 'after_count'
    // Only validate when endType is explicitly provided in the update
    if (data.endType === "after_count") {
      if (data.endCount === null || data.endCount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endCount is required when endType is 'after_count'",
          path: ["endCount"],
        });
      }
    }

    // Validate frequencyInterval is required when frequency is being set to 'custom'
    // Only validate when frequency is explicitly provided in the update
    if (data.frequency === "custom") {
      if (
        data.frequencyInterval === null ||
        data.frequencyInterval === undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "frequencyInterval is required when frequency is 'custom'",
          path: ["frequencyInterval"],
        });
      }
    }
  });

// Get by ID schema
export const getDealRecurringByIdSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier for the recurring deal series",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      param: { in: "path", name: "id" },
    }),
});

// List schema
export const getDealRecurringListSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: "Cursor for pagination",
      param: { in: "query" },
    }),
  pageSize: z.coerce
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(25)
    .openapi({
      description: "Number of items per page (1-100)",
      param: { in: "query" },
    }),
  status: z
    .array(dealRecurringStatusSchema)
    .nullable()
    .optional()
    .openapi({
      description: "Filter by status",
      param: { in: "query" },
    }),
  merchantId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .openapi({
      description: "Filter by merchant ID",
      param: { in: "query" },
    }),
});

// Pause/Resume schema
export const pauseResumeDealRecurringSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier for the recurring deal series",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      param: { in: "path", name: "id" },
    }),
});

// Get upcoming deals schema
export const getUpcomingDealsSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier for the recurring deal series",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      param: { in: "path", name: "id" },
    }),
  limit: z.coerce
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .openapi({
      description: "Maximum number of upcoming deals to preview",
      param: { in: "query" },
    }),
});

// Delete schema
export const deleteDealRecurringSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description:
        "Unique identifier for the recurring deal series to delete",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      param: { in: "path", name: "id" },
    }),
});

// Response schemas
export const upcomingDealSchema = z.object({
  date: z.string().openapi({
    description: "Scheduled date for the deal (ISO 8601)",
    example: "2026-02-01T00:00:00.000Z",
  }),
  amount: z.number().openapi({
    description: "Deal amount",
    example: 1500.0,
  }),
});

export const upcomingSummarySchema = z.object({
  hasEndDate: z.boolean().openapi({
    description: "Whether the series has an end date or count",
    example: true,
  }),
  totalCount: z.number().nullable().openapi({
    description: "Total number of deals in the series (null if no end)",
    example: 12,
  }),
  totalAmount: z.number().nullable().openapi({
    description: "Total amount of all deals (null if no end)",
    example: 18000.0,
  }),
  currency: z.string().openapi({
    description: "Currency code",
    example: "USD",
  }),
});

export const getUpcomingDealsResponseSchema = z.object({
  deals: z.array(upcomingDealSchema).openapi({
    description: "List of upcoming scheduled deals",
  }),
  summary: upcomingSummarySchema.openapi({
    description: "Summary of the recurring series",
  }),
});

export const dealRecurringResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier for the recurring deal series",
    example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
  }),
  createdAt: z.string().openapi({
    description: "When the series was created (ISO 8601)",
    example: "2024-06-01T00:00:00.000Z",
  }),
  updatedAt: z.string().nullable().openapi({
    description: "When the series was last updated (ISO 8601)",
    example: "2024-06-15T00:00:00.000Z",
  }),
  status: dealRecurringStatusSchema.openapi({
    description: "Current status of the recurring series",
    example: "active",
  }),
  frequency: dealRecurringFrequencySchema.openapi({
    description: "Frequency of deal generation",
    example: "monthly_date",
  }),
  frequencyDay: z.number().nullable().openapi({
    description: "Day parameter for frequency",
    example: 15,
  }),
  frequencyWeek: z.number().nullable().openapi({
    description: "Week parameter for monthly_weekday frequency",
    example: null,
  }),
  frequencyInterval: z.number().nullable().openapi({
    description: "Interval for custom frequency",
    example: null,
  }),
  endType: dealRecurringEndTypeSchema.openapi({
    description: "How the series ends",
    example: "after_count",
  }),
  endDate: z.string().nullable().openapi({
    description: "End date (if endType is 'on_date')",
    example: null,
  }),
  endCount: z.number().nullable().openapi({
    description: "End count (if endType is 'after_count')",
    example: 12,
  }),
  dealsGenerated: z.number().openapi({
    description: "Number of deals generated so far",
    example: 3,
  }),
  nextScheduledAt: z.string().nullable().openapi({
    description: "Next scheduled generation date (ISO 8601)",
    example: "2026-02-15T00:00:00.000Z",
  }),
  lastGeneratedAt: z.string().nullable().openapi({
    description: "When the last deal was generated (ISO 8601)",
    example: "2026-01-15T00:00:00.000Z",
  }),
  amount: z.number().nullable().openapi({
    description: "Deal amount",
    example: 1500.0,
  }),
  currency: z.string().nullable().openapi({
    description: "Currency code",
    example: "USD",
  }),
  merchantId: z.string().uuid().nullable().openapi({
    description: "Merchant ID",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
  merchantName: z.string().nullable().openapi({
    description: "Merchant name",
    example: "Acme Corporation",
  }),
  merchant: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().nullable(),
      website: z.string().nullable().optional(),
    })
    .nullable()
    .openapi({
      description: "Merchant details",
    }),
});

export const dealRecurringListResponseSchema = z.object({
  meta: z.object({
    cursor: z.string().nullable().openapi({
      description: "Cursor for next page, null if no more pages",
      example: "25",
    }),
    hasPreviousPage: z.boolean().openapi({
      description: "Whether there is a previous page",
      example: false,
    }),
    hasNextPage: z.boolean().openapi({
      description: "Whether there is a next page",
      example: true,
    }),
  }),
  data: z.array(dealRecurringResponseSchema).openapi({
    description: "List of recurring deal series",
  }),
});

// Deal recurring info for displaying on an deal
export const dealRecurringInfoSchema = z.object({
  recurringId: z.string().uuid().openapi({
    description: "ID of the recurring deal series",
    example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
  }),
  sequence: z.number().nullable().openapi({
    description:
      "Sequence number of this deal in the series (e.g., 3 for 3rd deal)",
    example: 3,
  }),
  totalCount: z.number().nullable().openapi({
    description: "Total count if series has a limit (null if no end)",
    example: 12,
  }),
  frequency: dealRecurringFrequencySchema.openapi({
    description: "Frequency of the series",
    example: "monthly_date",
  }),
  frequencyDay: z.number().nullable().openapi({
    description: "Day parameter for frequency",
    example: 15,
  }),
  frequencyWeek: z.number().nullable().openapi({
    description: "Week parameter for monthly_weekday frequency",
    example: null,
  }),
  nextScheduledAt: z.string().nullable().openapi({
    description: "Next scheduled deal date",
    example: "2026-02-15T00:00:00.000Z",
  }),
  status: dealRecurringStatusSchema.openapi({
    description: "Status of the recurring series",
    example: "active",
  }),
});
