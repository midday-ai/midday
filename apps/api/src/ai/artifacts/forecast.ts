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

    // Chart data (available at chart_ready stage)
    chart: z
      .object({
        monthlyData: z.array(
          z.object({
            month: z.string(),
            forecasted: z.number(),
            actual: z.number().optional(),
            confidence: z.number().optional(),
          }),
        ),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        nextMonthForecast: z.number(),
        nextQuarterForecast: z.number(),
        nextYearForecast: z.number(),
        forecastAccuracy: z.number().optional(),
      })
      .optional(),

    // Analysis data (available at analysis_ready stage)
    analysis: z
      .object({
        summary: z.string(),
        recommendations: z.array(z.string()),
        riskFactors: z.array(z.string()).optional(),
      })
      .optional(),
  }),
);
