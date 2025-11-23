import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const burnRateArtifact = artifact(
  "burn-rate-canvas",
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
            amount: z.number(),
            average: z.number(),
            currentBurn: z.number(),
            averageBurn: z.number(),
          }),
        ),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        currentMonthlyBurn: z.number(),
        averageBurnRate: z.number(),
        runway: z.number(),
        runwayStatus: z.string(),
        topCategory: z
          .object({
            name: z.string(),
            percentage: z.number(),
            amount: z.number(),
          })
          .optional(),
      })
      .optional(),

    // Analysis data (available at analysis_ready stage)
    analysis: z
      .object({
        burnRateChange: z
          .object({
            percentage: z.number(),
            period: z.string(),
            startValue: z.number(),
            endValue: z.number(),
          })
          .optional(),
        summary: z.string(),
        recommendations: z.array(z.string()),
      })
      .optional(),
  }),
);
