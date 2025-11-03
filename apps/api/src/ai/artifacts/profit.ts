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

    // Chart data (available at chart_ready stage)
    chart: z
      .object({
        monthlyData: z.array(
          z.object({
            month: z.string(),
            profit: z.number(),
            lastYearProfit: z.number(),
            average: z.number(),
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
