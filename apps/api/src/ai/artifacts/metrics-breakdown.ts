import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

const baseBreakdownSchema = z.object({
  stage: z.enum(["loading", "chart_ready", "metrics_ready", "analysis_ready"]),
  currency: z.string(),
  from: z.string().optional().describe("Start date (ISO 8601)"),
  to: z.string().optional().describe("End date (ISO 8601)"),
  displayDate: z
    .string()
    .optional()
    .describe(
      "Date for display purposes (ISO 8601, typically start of month for monthly breakdowns)",
    ),
  description: z
    .string()
    .optional()
    .describe("Generated description based on date range"),
  chartType: z
    .string()
    .optional()
    .describe("Type of chart that triggered this breakdown"),
});

const summaryMetricsSchema = z.object({
  revenue: z.number(),
  expenses: z.number(),
  profit: z.number(),
  transactionCount: z.number(),
});

const transactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  name: z.string(),
  amount: z.number(),
  formattedAmount: z.string(),
  category: z.string(),
  type: z.enum(["income", "expense"]),
  vendor: z.string(),
  percentage: z
    .number()
    .describe(
      "Percentage impact relative to total expenses (for expenses) or revenue (for income)",
    ),
});

const categorySchema = z.object({
  name: z.string(),
  amount: z.number(),
  percentage: z.number(),
  transactionCount: z.number().optional(),
  color: z.string().optional(),
});

// Summary artifact (includes metrics, transactions, categories, and analysis)
export const metricsBreakdownSummaryArtifact = artifact(
  "breakdown-summary-canvas",
  baseBreakdownSchema.extend({
    summary: summaryMetricsSchema.optional(),
    transactions: z.array(transactionSchema).optional(),
    categories: z.array(categorySchema).optional(),
    analysis: z
      .object({
        summary: z.string(),
        recommendations: z.array(z.string()),
      })
      .optional(),
  }),
);
