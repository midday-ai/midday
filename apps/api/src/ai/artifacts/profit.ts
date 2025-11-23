import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const profitArtifact = artifact(
  "profit-analysis-canvas",
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
            profit: z.number(),
            lastYearProfit: z.number(),
            average: z.number(),
            revenue: z.number().optional(),
            expenses: z.number().optional(),
            lastYearRevenue: z.number().optional(),
            lastYearExpenses: z.number().optional(),
          }),
        ),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        currentMonthlyProfit: z.number(),
        profitMargin: z.number(),
        averageMonthlyProfit: z.number(),
        revenueGrowth: z.number(),
        currentMonthlyProfitChange: z
          .object({
            percentage: z.number(),
            period: z.string(),
          })
          .optional(),
        // Period comparison
        currentPeriod: z
          .object({
            revenue: z.number(),
            expenses: z.number(),
            profit: z.number(),
          })
          .optional(),
        previousPeriod: z
          .object({
            revenue: z.number(),
            expenses: z.number(),
            profit: z.number(),
          })
          .optional(),
        // Totals
        totalRevenue: z.number().optional(),
        totalExpenses: z.number().optional(),
      })
      .optional(),

    // Analysis data (available at analysis_ready stage)
    analysis: z
      .object({
        summary: z.string(),
        recommendations: z.array(z.string()),
      })
      .optional(),
  }),
);
