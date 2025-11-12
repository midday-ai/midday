import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const cashFlowArtifact = artifact(
  "cash-flow-canvas",
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
            netCashFlow: z.number(),
            income: z.number(),
            expenses: z.number(),
          }),
        ),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        netCashFlow: z.number(),
        totalIncome: z.number(),
        totalExpenses: z.number(),
        averageMonthlyCashFlow: z.number(),
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
