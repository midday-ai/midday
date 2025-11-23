import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const invoicePaymentAnalysisArtifact = artifact(
  "invoice-payment-canvas",
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
            averageDaysToPay: z.number(),
            paymentRate: z.number(),
            invoiceCount: z.number(),
          }),
        ),
      })
      .optional(),

    // Core metrics (available at metrics_ready stage)
    metrics: z
      .object({
        averageDaysToPay: z.number(),
        paymentRate: z.number(),
        overdueRate: z.number(),
        paymentScore: z.number(),
        totalInvoices: z.number(),
        paidInvoices: z.number(),
        unpaidInvoices: z.number(),
        overdueInvoices: z.number(),
        overdueAmount: z.number(),
      })
      .optional(),

    // Overdue summary (available at metrics_ready stage)
    overdueSummary: z
      .object({
        count: z.number(),
        totalAmount: z.number(),
        oldestDays: z.number(),
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
