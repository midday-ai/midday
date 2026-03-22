import type { AppContext } from "@api/ai/context";
import { db } from "@midday/db/client";
import { getInvoicePaymentAnalysis } from "@midday/db/queries";
import { tool } from "ai";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getInvoicePaymentAnalysisSchema = z.object({
  from: z
    .string()
    .default(() => startOfMonth(subMonths(new Date(), 12)).toISOString())
    .describe("Start date (ISO 8601)"),
  to: z
    .string()
    .default(() => endOfMonth(new Date()).toISOString())
    .describe("End date (ISO 8601)"),
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. 'USD')")
    .nullable()
    .optional(),
});

export const getInvoicePaymentAnalysisTool = tool({
  description:
    "Analyze invoice payment patterns - shows average days to pay, payment trends, overdue invoice summary, and payment score.",
  inputSchema: getInvoicePaymentAnalysisSchema,
  execute: async function* (
    { from, to, currency },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;
    const targetCurrency = currency || appContext.baseCurrency || "USD";

    if (!teamId) {
      yield { text: "Unable to retrieve invoice payment analysis: Team ID not found." };
      return {
        averageDaysToPay: 0,
        paymentRate: 0,
        overdueRate: 0,
        paymentScore: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        unpaidInvoices: 0,
        overdueInvoices: 0,
        overdueAmount: 0,
        currency: targetCurrency,
        paymentTrends: [],
      };
    }

    try {
      const paymentData = await getInvoicePaymentAnalysis(db, {
        teamId,
        from,
        to,
        currency: currency || undefined,
      });

      if (paymentData.metrics.totalInvoices === 0) {
        yield { text: "No invoices found for payment analysis." };
        return {
          averageDaysToPay: 0,
          paymentRate: 0,
          overdueRate: 0,
          paymentScore: 0,
          totalInvoices: 0,
          paidInvoices: 0,
          unpaidInvoices: 0,
          overdueInvoices: 0,
          overdueAmount: 0,
          currency: targetCurrency,
          paymentTrends: [],
        };
      }

      yield {
        text: `Payment score: ${paymentData.metrics.paymentScore}/100 (${paymentData.metrics.paymentRate}% paid)`,
      };

      return {
        averageDaysToPay: paymentData.metrics.averageDaysToPay,
        paymentRate: paymentData.metrics.paymentRate,
        overdueRate: paymentData.metrics.overdueRate,
        paymentScore: paymentData.metrics.paymentScore,
        totalInvoices: paymentData.metrics.totalInvoices,
        paidInvoices: paymentData.metrics.paidInvoices,
        unpaidInvoices: paymentData.metrics.unpaidInvoices,
        overdueInvoices: paymentData.metrics.overdueInvoices,
        overdueAmount: paymentData.metrics.overdueAmount,
        overdueOldestDays: paymentData.overdueSummary.oldestDays,
        currency: targetCurrency,
        paymentTrends: paymentData.paymentTrends.map((t) => ({
          month: t.month,
          averageDaysToPay: t.averageDaysToPay,
          paymentRate: t.paymentRate,
        })),
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve invoice payment analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        averageDaysToPay: 0,
        paymentRate: 0,
        overdueRate: 0,
        paymentScore: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        unpaidInvoices: 0,
        overdueInvoices: 0,
        overdueAmount: 0,
        currency: targetCurrency,
        paymentTrends: [],
      };
    }
  },
});
