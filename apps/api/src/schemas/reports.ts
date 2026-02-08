import { z } from "@hono/zod-openapi";

export const getRevenueSchema = z
  .object({
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    revenueType: z.enum(["gross", "net"]).optional().default("net").openapi({
      description: "Type of revenue calculation",
      example: "net",
    }),
  })
  .openapi("GetRevenueSchema");

export const getProfitSchema = z
  .object({
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    revenueType: z.enum(["gross", "net"]).optional().default("net").openapi({
      description: "Type of revenue calculation",
      example: "net",
    }),
  })
  .openapi("GetProfitSchema");

export const getBurnRateSchema = z
  .object({
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
  })
  .openapi("GetBurnRateSchema");

export const getRunwaySchema = z
  .object({
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
  })
  .openapi("GetRunwaySchema");

export const getExpensesSchema = z
  .object({
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
  })
  .openapi("GetExpensesSchema");

export const getSpendingSchema = z
  .object({
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
  })
  .openapi("GetSpendingSchema");

export const getRevenueResponseSchema = z
  .object({
    summary: z
      .object({
        currentTotal: z.number().openapi({
          description: "Total revenue for the current period",
          example: 10000,
        }),
        prevTotal: z.number().openapi({
          description: "Total revenue for the previous period",
          example: 8000,
        }),
        currency: z.string().openapi({
          description: "Currency code (ISO 4217)",
          example: "USD",
        }),
      })
      .openapi("RevenueSummary"),
    meta: z
      .object({
        type: z
          .literal("revenue")
          .openapi({ description: "Type of metric", example: "revenue" }),
        currency: z.string().openapi({
          description: "Currency code (ISO 4217)",
          example: "USD",
        }),
      })
      .openapi("RevenueMeta"),
    result: z
      .array(
        z
          .object({
            date: z.string().openapi({
              description: "Date for the metric (ISO 8601)",
              example: "2023-01-31",
            }),
            percentage: z
              .object({
                value: z.number().openapi({
                  description: "Percentage change compared to previous period",
                  example: 25,
                }),
                status: z.enum(["negative", "positive"]).openapi({
                  description: "Status of the change",
                  example: "positive",
                }),
              })
              .openapi("RevenuePercentage"),
            current: z
              .object({
                date: z.string().openapi({
                  description: "Date for the current value",
                  example: "2023-01-31",
                }),
                value: z.number().openapi({
                  description: "Current value",
                  example: 1000,
                }),
                currency: z.string().openapi({
                  description: "Currency code (ISO 4217)",
                  example: "USD",
                }),
              })
              .openapi("RevenueCurrent"),
            previous: z
              .object({
                date: z.string().openapi({
                  description: "Date for the previous value",
                  example: "2022-01-31",
                }),
                value: z.number().openapi({
                  description: "Previous value",
                  example: 800,
                }),
                currency: z.string().openapi({
                  description: "Currency code (ISO 4217)",
                  example: "USD",
                }),
              })
              .openapi("RevenuePrevious"),
          })
          .openapi("RevenueResultItem"),
      )
      .openapi("RevenueResultArray"),
  })
  .openapi("GetRevenueResponseSchema");

export const getProfitResponseSchema = z
  .object({
    summary: z
      .object({
        currentTotal: z.number().openapi({
          description: "Total profit for the current period",
          example: 10000,
        }),
        prevTotal: z.number().openapi({
          description: "Total profit for the previous period",
          example: 8000,
        }),
        currency: z.string().openapi({
          description: "Currency code (ISO 4217)",
          example: "USD",
        }),
      })
      .openapi("ProfitSummary"),
    meta: z
      .object({
        type: z
          .literal("profit")
          .openapi({ description: "Type of metric", example: "profit" }),
        currency: z.string().openapi({
          description: "Currency code (ISO 4217)",
          example: "USD",
        }),
      })
      .openapi("ProfitMeta"),
    result: z
      .array(
        z
          .object({
            date: z.string().openapi({
              description: "Date for the metric (ISO 8601)",
              example: "2023-01-31",
            }),
            percentage: z
              .object({
                value: z.number().openapi({
                  description: "Percentage change compared to previous period",
                  example: 25,
                }),
                status: z.enum(["negative", "positive"]).openapi({
                  description: "Status of the change",
                  example: "positive",
                }),
              })
              .openapi("ProfitPercentage"),
            current: z
              .object({
                date: z.string().openapi({
                  description: "Date for the current value",
                  example: "2023-01-31",
                }),
                value: z.number().openapi({
                  description: "Current value",
                  example: 1000,
                }),
                currency: z.string().openapi({
                  description: "Currency code (ISO 4217)",
                  example: "USD",
                }),
              })
              .openapi("ProfitCurrent"),
            previous: z
              .object({
                date: z.string().openapi({
                  description: "Date for the previous value",
                  example: "2022-01-31",
                }),
                value: z.number().openapi({
                  description: "Previous value",
                  example: 800,
                }),
                currency: z.string().openapi({
                  description: "Currency code (ISO 4217)",
                  example: "USD",
                }),
              })
              .openapi("ProfitPrevious"),
          })
          .openapi("ProfitResultItem"),
      )
      .openapi("ProfitResultArray"),
  })
  .openapi("GetProfitResponseSchema");

export const getBurnRateResponseSchema = z
  .array(
    z
      .object({
        date: z.string().openapi({
          description: "Date for the burn rate value",
          example: "2024-01-01",
        }),
        value: z.number().openapi({
          description: "Burn rate value for the given date",
          example: 647366.44,
        }),
        currency: z.string().openapi({
          description: "Currency code (ISO 4217)",
          example: "SEK",
        }),
      })
      .openapi("GetBurnRateResponseSchema"),
  )
  .openapi("GetBurnRateResponseSchema");

export const getRunwayResponseSchema = z.number().openapi({
  title: "GetRunwayResponseSchema",
  description:
    "Number of months of runway remaining, based on current burn rate and available cash.",
  example: 12,
});

export const getExpensesResponseSchema = z
  .object({
    summary: z.object({
      averageExpense: z.number().openapi({
        description: "Average expense over the period",
        example: 121054.86,
      }),
      currency: z.string().openapi({
        description: "Currency code (ISO 4217)",
        example: "SEK",
      }),
    }),
    meta: z.object({
      type: z.string().openapi({
        description: "Type of metric",
        example: "expense",
      }),
      currency: z.string().openapi({
        description: "Currency code (ISO 4217)",
        example: "SEK",
      }),
    }),
    result: z
      .array(
        z.object({
          date: z.string().openapi({
            description: "Date for the expense value",
            example: "2024-01-01 00:00:00",
          }),
          value: z.number().openapi({
            description: "Expense value for the given date",
            example: 637898.68,
          }),
          currency: z.string().openapi({
            description: "Currency code (ISO 4217)",
            example: "SEK",
          }),
          recurring: z.number().openapi({
            description: "Recurring expense value for the given date",
            example: 9467.76,
          }),
          total: z.number().openapi({
            description: "Total expense for the given date",
            example: 647366.44,
          }),
        }),
      )
      .openapi("ExpensesResultArray"),
  })
  .openapi("GetExpensesResponseSchema");

export const getSpendingResponseSchema = z
  .array(
    z.object({
      name: z.string().openapi({
        description: "Spending category name",
        example: "Taxes",
      }),
      slug: z.string().openapi({
        description: "Spending category slug",
        example: "taxes",
      }),
      amount: z.number().openapi({
        description: "Amount spent in this category",
        example: -1256445,
      }),
      currency: z.string().openapi({
        description: "Currency code (ISO 4217)",
        example: "SEK",
      }),
      color: z.string().openapi({
        description: "Color code for the category",
        example: "#8492A6",
      }),
      percentage: z.number().openapi({
        description: "Percentage of total spending for this category",
        example: 44,
      }),
    }),
  )
  .openapi("SpendingResultArray");

export const getTaxSummarySchema = z
  .object({
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    type: z.enum(["paid", "collected"]).openapi({
      description: "Type of tax",
      example: "paid",
    }),
    categorySlug: z.string().optional().openapi({
      description: "Category slug",
      example: "taxes",
    }),
    taxType: z.string().optional().openapi({
      description: "Tax type",
      example: "vat",
    }),
  })
  .openapi("GetTaxSummarySchema");

export const getRevenueForecastSchema = z
  .object({
    from: z.string().openapi({
      description: "Start date for historical data (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date for historical data (ISO 8601 format)",
      example: "2023-12-31",
    }),
    forecastMonths: z.number().min(1).max(24).default(6).openapi({
      description: "Number of months to forecast into the future",
      example: 6,
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    revenueType: z.enum(["gross", "net"]).default("net").openapi({
      description: "Type of revenue calculation",
      example: "net",
    }),
  })
  .openapi("GetRevenueForecastSchema");

// Forecast breakdown showing contribution from each revenue source
const forecastBreakdownSchema = z
  .object({
    recurringInvoices: z.number().openapi({
      description: "Revenue from recurring invoices (high confidence)",
      example: 5000,
    }),
    recurringTransactions: z.number().openapi({
      description: "Revenue from recurring bank transactions (high confidence)",
      example: 2000,
    }),
    scheduled: z.number().openapi({
      description: "Revenue from scheduled invoices (high confidence)",
      example: 1000,
    }),
    collections: z.number().openapi({
      description:
        "Expected collections from outstanding invoices (medium confidence)",
      example: 3000,
    }),
    billableHours: z.number().openapi({
      description: "Value of unbilled tracked hours (medium confidence)",
      example: 1500,
    }),
    newBusiness: z.number().openapi({
      description: "Projected new business revenue (low confidence)",
      example: 2500,
    }),
  })
  .openapi("ForecastBreakdown");

// Enhanced forecast data point with confidence and breakdown
const enhancedForecastPointSchema = z
  .object({
    date: z.string().openapi({
      description: "Forecast date (ISO 8601)",
      example: "2024-02-29",
    }),
    value: z.number().openapi({
      description: "Base forecast value (most likely scenario)",
      example: 15000,
    }),
    currency: z.string().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    optimistic: z.number().openapi({
      description: "Optimistic forecast (80th percentile)",
      example: 18000,
    }),
    pessimistic: z.number().openapi({
      description: "Pessimistic forecast (20th percentile)",
      example: 10000,
    }),
    confidence: z.number().openapi({
      description: "Confidence score for this month (0-100%)",
      example: 75,
    }),
    breakdown: forecastBreakdownSchema.openapi({
      description: "Breakdown of revenue sources contributing to forecast",
    }),
  })
  .openapi("EnhancedForecastPoint");

export const getRevenueForecastResponseSchema = z
  .object({
    summary: z
      .object({
        nextMonthProjection: z.number().openapi({
          description: "Projected revenue for next month",
          example: 15000,
        }),
        avgMonthlyGrowthRate: z.number().openapi({
          description: "Implied monthly growth rate (%)",
          example: 5.2,
        }),
        totalProjectedRevenue: z.number().openapi({
          description: "Total projected revenue across forecast period",
          example: 90000,
        }),
        peakMonth: z
          .object({
            date: z.string(),
            value: z.number(),
          })
          .openapi({ description: "Month with highest projected revenue" }),
        currency: z.string(),
        revenueType: z.enum(["gross", "net"]),
        forecastStartDate: z.string().optional(),
        unpaidInvoices: z.object({
          count: z.number(),
          totalAmount: z.number(),
          currency: z.string(),
        }),
        billableHours: z.object({
          totalHours: z.number(),
          totalAmount: z.number(),
          currency: z.string(),
        }),
      })
      .openapi("ForecastSummary"),
    historical: z.array(
      z.object({
        date: z.string(),
        value: z.number(),
        currency: z.string(),
      }),
    ),
    forecast: z.array(enhancedForecastPointSchema).openapi({
      description: "Forecast data with confidence bounds and source breakdown",
    }),
    combined: z.array(
      z.object({
        date: z.string(),
        value: z.number(),
        currency: z.string(),
        type: z.enum(["actual", "forecast"]),
      }),
    ),
    meta: z
      .object({
        historicalMonths: z.number(),
        forecastMonths: z.number(),
        avgGrowthRate: z.number(),
        basedOnMonths: z.number(),
        currency: z.string(),
        includesUnpaidInvoices: z.boolean(),
        includesBillableHours: z.boolean(),
        forecastMethod: z.literal("bottom_up").openapi({
          description: "Forecast methodology used",
          example: "bottom_up",
        }),
        confidenceScore: z.number().openapi({
          description: "Average confidence across all forecast months",
          example: 72,
        }),
        warnings: z.array(z.string()).openapi({
          description:
            "Warnings about potential issues (e.g., double-counting)",
          example: [],
        }),
        recurringRevenueTotal: z.number().openapi({
          description: "Total recurring revenue in first forecast month",
          example: 7000,
        }),
        recurringInvoicesCount: z.number(),
        recurringTransactionsCount: z.number(),
        expectedCollections: z.number(),
        collectionRate: z.number().openapi({
          description: "Team's historical on-time payment rate (%)",
          example: 78.5,
        }),
        scheduledInvoicesTotal: z.number(),
        scheduledInvoicesCount: z.number(),
        newBusinessBaseline: z.number().openapi({
          description: "Baseline for projected new business revenue",
          example: 2500,
        }),
        teamCollectionMetrics: z.object({
          onTimeRate: z.number(),
          avgDaysToPay: z.number(),
          sampleSize: z.number(),
        }),
      })
      .openapi("ForecastMeta"),
  })
  .openapi("GetRevenueForecastResponse");

export const reportTypeSchema = z.enum([
  "profit",
  "revenue",
  "burn_rate",
  "expense",
  "monthly_revenue",
  "revenue_forecast",
  "runway",
  "category_expenses",
]);

export const createReportSchema = z
  .object({
    type: reportTypeSchema.openapi({
      description: "Type of report/chart to share",
      example: "burn_rate",
    }),
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    expireAt: z.string().optional().openapi({
      description: "Expiration date for the shared link (ISO 8601 format)",
      example: "2024-12-31",
    }),
  })
  .openapi("CreateReportSchema");

export const getReportByLinkIdSchema = z
  .object({
    linkId: z.string().openapi({
      description: "Unique link identifier for the shared report",
      example: "abc12345",
    }),
  })
  .openapi("GetReportByLinkIdSchema");

export const getChartDataByLinkIdSchema = z
  .object({
    linkId: z.string().openapi({
      description: "Unique link identifier for the shared report",
      example: "abc12345",
    }),
  })
  .openapi("GetChartDataByLinkIdSchema");

export const getGrowthRateSchema = z
  .object({
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    type: z.enum(["revenue", "profit"]).optional().default("revenue").openapi({
      description: "Type of growth to calculate",
      example: "revenue",
    }),
    revenueType: z.enum(["gross", "net"]).optional().default("net").openapi({
      description: "Type of revenue calculation",
      example: "net",
    }),
    period: z
      .enum(["monthly", "quarterly", "yearly"])
      .optional()
      .default("quarterly")
      .openapi({
        description: "Period for growth comparison",
        example: "quarterly",
      }),
  })
  .openapi("GetGrowthRateSchema");

export const getProfitMarginSchema = z
  .object({
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    revenueType: z.enum(["gross", "net"]).optional().default("net").openapi({
      description: "Type of revenue calculation (gross or net profit margin)",
      example: "net",
    }),
  })
  .openapi("GetProfitMarginSchema");

export const getCashFlowSchema = z
  .object({
    from: z.string().openapi({
      description: "Start date (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().openapi({
      description: "End date (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
    period: z
      .enum(["monthly", "quarterly"])
      .optional()
      .default("monthly")
      .openapi({
        description: "Aggregation period for cash flow data",
        example: "monthly",
      }),
  })
  .openapi("GetCashFlowSchema");

export const getRecurringExpensesSchema = z
  .object({
    from: z.string().optional().openapi({
      description: "Start date filter (ISO 8601 format)",
      example: "2023-01-01",
    }),
    to: z.string().optional().openapi({
      description: "End date filter (ISO 8601 format)",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
  })
  .openapi("GetRecurringExpensesSchema");

export const getBalanceSheetSchema = z
  .object({
    asOf: z.string().optional().openapi({
      description:
        "Balance sheet as of date (ISO 8601 format), defaults to today",
      example: "2023-12-31",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "USD",
    }),
  })
  .openapi("GetBalanceSheetSchema");
