import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const taxSummaryArtifact = artifact(
  "tax-summary-canvas",
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
        categoryData: z
          .array(
            z.object({
              category: z.string(),
              taxAmount: z.number(),
              percentage: z.number(),
            }),
          )
          .optional(),
        taxTypeData: z
          .array(
            z.object({
              taxType: z.string(),
              taxAmount: z.number(),
              percentage: z.number(),
            }),
          )
          .optional(),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        totalTaxLiability: z.number(),
        totalTaxableIncome: z.number(),
        effectiveTaxRate: z.number(),
        estimatedQuarterlyPayments: z.number().optional(),
        topCategories: z
          .array(
            z.object({
              category: z.string(),
              taxAmount: z.number(),
              percentage: z.number(),
            }),
          )
          .optional(),
        previousPeriod: z
          .object({
            totalTaxLiability: z.number(),
            totalTaxableIncome: z.number(),
            effectiveTaxRate: z.number(),
          })
          .optional(),
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
