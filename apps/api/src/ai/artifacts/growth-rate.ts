import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const growthRateArtifact = artifact(
  "growth-rate-canvas",
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
    type: z.enum(["revenue", "profit"]),
    revenueType: z.enum(["gross", "net"]),
    period: z.enum(["monthly", "quarterly", "yearly"]),

    // Chart data (available at chart_ready stage)
    chart: z
      .object({
        periodData: z.array(
          z.object({
            period: z.string(),
            currentTotal: z.number(),
            previousTotal: z.number(),
            growthRate: z.number(),
          }),
        ),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        currentGrowthRate: z.number(),
        currentTotal: z.number(),
        previousTotal: z.number(),
        changeAmount: z.number(),
        trend: z.enum(["positive", "negative", "neutral"]),
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
