import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const expensesArtifact = artifact(
  "category-expenses-canvas",
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
        categoryData: z.array(
          z.object({
            category: z.string(),
            amount: z.number(),
            percentage: z.number(),
            color: z.string().optional(),
          }),
        ),
        monthlyData: z
          .array(
            z.object({
              month: z.string(),
              amount: z.number(),
            }),
          )
          .optional(),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        totalExpenses: z.number(),
        averageMonthlyExpenses: z.number(),
        topCategory: z
          .object({
            name: z.string(),
            amount: z.number(),
            percentage: z.number(),
          })
          .optional(),
        saasSubscriptions: z
          .object({
            name: z.string(),
            amount: z.number(),
            percentage: z.number(),
            changeVsAverage: z.number().optional(),
          })
          .optional(),
        categoryCoverage: z.number().optional(),
        optimizationPotential: z.number().optional(),
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
