import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";
import { toastSchema } from "../tools/schema";

export const burnRateArtifact = artifact(
  "burn-rate",
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

    toast: toastSchema,

    // Chart data (available at chart_ready stage)
    chart: z
      .object({
        monthlyData: z.array(
          z.object({
            month: z.string(),
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
        topCategory: z.object({
          name: z.string(),
          percentage: z.number(),
          amount: z.number(),
        }),
      })
      .optional(),

    // Analysis data (available at analysis_ready stage)
    analysis: z
      .object({
        burnRateChange: z.object({
          percentage: z.number(),
          period: z.string(),
          startValue: z.number(),
          endValue: z.number(),
        }),
        summary: z.string(),
        recommendations: z.array(z.string()),
      })
      .optional(),
  }),
);
