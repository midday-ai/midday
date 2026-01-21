import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const forecastArtifact = artifact(
  "forecast-canvas",
  z.object({
    // Processing stage
    stage: z.enum([
      "loading",
      "chart_ready",
      "metrics_ready",
      "analysis_ready",
    ]),

    // Basic info
    currency: z.string(),
    from: z.string().optional().describe("Start date (ISO 8601)"),
    to: z.string().optional().describe("End date (ISO 8601)"),
    description: z
      .string()
      .optional()
      .describe("Generated description based on date range"),

    // Chart data (available at chart_ready stage)
    chart: z
      .object({
        monthlyData: z.array(
          z.object({
            month: z.string(),
            forecasted: z.number().nullable().optional(),
            actual: z.number().nullable().optional(),
            date: z.string().optional(),
            // Enhanced forecast fields (matching dashboard metrics widget)
            optimistic: z.number().nullable().optional(),
            pessimistic: z.number().nullable().optional(),
            confidence: z.number().nullable().optional(),
            breakdown: z
              .object({
                recurringInvoices: z.number(),
                recurringTransactions: z.number(),
                scheduled: z.number(),
                collections: z.number(),
                billableHours: z.number(),
                newBusiness: z.number(),
              })
              .nullable()
              .optional(),
          }),
        ),
        forecastStartIndex: z.number().optional(),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        peakMonth: z.string(),
        peakMonthValue: z.number(),
        growthRate: z.number(),
        unpaidInvoices: z.number(),
        billableHours: z.number(),
        // Overall confidence score (matching dashboard)
        confidenceScore: z.number().nullable().optional(),
      })
      .optional(),

    // Analysis data (available at analysis_ready stage)
    analysis: z
      .object({
        summary: z.string(),
        recommendations: z.array(z.string()).optional(),
      })
      .optional(),
  }),
);
