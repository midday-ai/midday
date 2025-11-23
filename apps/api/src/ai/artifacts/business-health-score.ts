import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const businessHealthScoreArtifact = artifact(
  "health-report-canvas",
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
            healthScore: z.number(),
            revenue: z.number(),
            expenses: z.number(),
          }),
        ),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        overallScore: z.number(),
        revenueScore: z.number(),
        expenseScore: z.number(),
        cashFlowScore: z.number(),
        profitabilityScore: z.number(),
      })
      .optional(),

    // Analysis data (available at analysis_ready stage)
    analysis: z
      .object({
        summary: z.string(),
        recommendations: z.array(z.string()),
        strengths: z.array(z.string()).optional(),
        weaknesses: z.array(z.string()).optional(),
      })
      .optional(),
  }),
);
