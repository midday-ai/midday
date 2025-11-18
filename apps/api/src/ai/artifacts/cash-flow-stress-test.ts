import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const cashFlowStressTestArtifact = artifact(
  "stress-test-canvas",
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
        projectedCashBalance: z
          .array(
            z.object({
              month: z.number(),
              baseCase: z.number(),
              worstCase: z.number(),
              bestCase: z.number(),
            }),
          )
          .optional(),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        baseCaseRunway: z.number(),
        worstCaseRunway: z.number(),
        bestCaseRunway: z.number(),
        stressTestScore: z.number(),
      })
      .optional(),

    // Analysis data (available at analysis_ready stage)
    analysis: z
      .object({
        summary: z.string(),
      })
      .optional(),
  }),
);
