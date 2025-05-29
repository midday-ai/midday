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
            precentage: z
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
            precentage: z
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
