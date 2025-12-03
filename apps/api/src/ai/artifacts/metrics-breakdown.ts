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

const invoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  amount: z.number(),
  formattedAmount: z.string(),
  status: z.string(),
  dueDate: z.string().nullable(),
  createdAt: z.string(),
});

const categorySchema = z.object({
  name: z.string(),
  amount: z.number(),
  percentage: z.number(),
  transactionCount: z.number().optional(),
  color: z.string().optional(),
});

const vendorSchema = z.object({
  name: z.string(),
  amount: z.number(),
  transactionCount: z.number(),
});

const customerSchema = z.object({
  name: z.string(),
  revenue: z.number(),
  invoiceCount: z.number(),
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

// Transactions artifact
export const metricsBreakdownTransactionsArtifact = artifact(
  "breakdown-transactions-canvas",
  baseBreakdownSchema.extend({
    transactions: z.array(transactionSchema).optional(),
    summary: summaryMetricsSchema.optional(),
  }),
);

// Invoices artifact
export const metricsBreakdownInvoicesArtifact = artifact(
  "breakdown-invoices-canvas",
  baseBreakdownSchema.extend({
    invoices: z.array(invoiceSchema).optional(),
    summary: summaryMetricsSchema.optional(),
  }),
);

// Categories artifact
export const metricsBreakdownCategoriesArtifact = artifact(
  "breakdown-categories-canvas",
  baseBreakdownSchema.extend({
    categories: z.array(categorySchema).optional(),
    summary: summaryMetricsSchema.optional(),
  }),
);

// Vendors artifact
export const metricsBreakdownVendorsArtifact = artifact(
  "breakdown-vendors-canvas",
  baseBreakdownSchema.extend({
    topVendors: z.array(vendorSchema).optional(),
    summary: summaryMetricsSchema.optional(),
  }),
);

// Customers artifact
export const metricsBreakdownCustomersArtifact = artifact(
  "breakdown-customers-canvas",
  baseBreakdownSchema.extend({
    topCustomers: z.array(customerSchema).optional(),
    summary: summaryMetricsSchema.optional(),
  }),
);
