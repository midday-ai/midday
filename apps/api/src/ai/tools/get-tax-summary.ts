import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { UTCDate } from "@date-fns/utc";
import { db } from "@midday/db/client";
import { getTaxSummary } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { z } from "zod";

const getTaxSummarySchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
});

export const getTaxSummaryTool = tool({
  description:
    "Generate tax summary - tax liability, taxable income, and tax rates.",
  inputSchema: getTaxSummarySchema,
  execute: async function* (
    { period, from, to, currency },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield { text: "Unable to retrieve tax summary: Team ID not found." };
      return {
        totalTaxPaid: 0,
        totalTaxCollected: 0,
        netTaxLiability: 0,
        totalTaxableIncome: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      const resolved = resolveToolParams({
        appContext,
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;
      const targetCurrency = finalCurrency || "USD";
      const locale = appContext.locale || "en-US";

      const fromDate = startOfMonth(new UTCDate(parseISO(finalFrom)));
      const toDate = endOfMonth(new UTCDate(parseISO(finalTo)));
      const periodMonths = Math.ceil(
        (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );
      const prevFromDate = subMonths(fromDate, periodMonths);
      const prevToDate = subMonths(toDate, periodMonths);
      const prevFrom = format(prevFromDate, "yyyy-MM-dd");
      const prevTo = format(prevToDate, "yyyy-MM-dd");

      const [paidTaxData, collectedTaxData, prevPaidTaxData, prevCollectedTaxData] =
        await Promise.all([
          getTaxSummary(db, {
            teamId,
            type: "paid",
            from: finalFrom,
            to: finalTo,
            currency: targetCurrency,
          }),
          getTaxSummary(db, {
            teamId,
            type: "collected",
            from: finalFrom,
            to: finalTo,
            currency: targetCurrency,
          }),
          getTaxSummary(db, {
            teamId,
            type: "paid",
            from: prevFrom,
            to: prevTo,
            currency: targetCurrency,
          }),
          getTaxSummary(db, {
            teamId,
            type: "collected",
            from: prevFrom,
            to: prevTo,
            currency: targetCurrency,
          }),
        ]);

      const currentPaidTax = paidTaxData.summary.totalTaxAmount;
      const currentCollectedTax = collectedTaxData.summary.totalTaxAmount;
      const currentNetTax = currentCollectedTax - currentPaidTax;
      const currentTotalTaxableIncome =
        paidTaxData.summary.totalTransactionAmount;

      const prevPaidTax = prevPaidTaxData.summary.totalTaxAmount;
      const prevCollectedTax = prevCollectedTaxData.summary.totalTaxAmount;
      const prevNetTax = prevCollectedTax - prevPaidTax;

      const effectiveTaxRate =
        currentTotalTaxableIncome > 0
          ? (currentPaidTax / currentTotalTaxableIncome) * 100
          : 0;

      const categoryData = (paidTaxData.result || [])
        .slice(0, 10)
        .map((item) => ({
          category: item.category_name,
          taxAmount: item.total_tax_amount,
          percentage:
            currentPaidTax > 0
              ? (item.total_tax_amount / currentPaidTax) * 100
              : 0,
        }));

      const formattedNetTax = formatAmount({
        amount: Math.abs(currentNetTax),
        currency: targetCurrency,
        locale,
      });
      const netDirection = currentNetTax > 0 ? "owe" : "credit";

      yield { text: `Net tax: ${formattedNetTax} (${netDirection}), rate: ${effectiveTaxRate.toFixed(1)}%` };

      return {
        totalTaxPaid: currentPaidTax,
        totalTaxCollected: currentCollectedTax,
        netTaxLiability: currentNetTax,
        totalTaxableIncome: currentTotalTaxableIncome,
        currency: targetCurrency,
        effectiveTaxRate,
        prevNetTaxLiability: prevNetTax,
        categoryData,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve tax summary: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalTaxPaid: 0,
        totalTaxCollected: 0,
        netTaxLiability: 0,
        totalTaxableIncome: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
