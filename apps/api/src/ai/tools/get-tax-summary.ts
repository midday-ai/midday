import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { taxSummaryArtifact } from "@api/ai/artifacts/tax-summary";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
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
  showCanvas: z.boolean().default(false).describe("Show visual canvas"),
});

export const getTaxSummaryTool = tool({
  description:
    "Generate tax summary - tax liability, taxable income, and tax rates.",
  inputSchema: getTaxSummarySchema,
  execute: async function* (
    { period, from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve tax summary: Team ID not found in context.",
      };
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
      // Resolve parameters with proper priority:
      // 1. Forced params from widget click (if this tool was triggered by widget)
      // 2. Explicit AI params (user override)
      // 3. Dashboard metricsFilter (source of truth)
      // 4. Hardcoded defaults
      const resolved = resolveToolParams({
        toolName: "getTaxSummary",
        appContext,
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof taxSummaryArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = taxSummaryArtifact.stream(
          {
            stage: "loading",
            currency: finalCurrency || "USD",
            from: finalFrom,
            to: finalTo,
            description,
          },
          writer,
        );
      }

      const targetCurrency = finalCurrency || "USD";
      const locale = appContext.locale || "en-US";

      // Calculate previous period for comparison
      const fromDate = startOfMonth(new UTCDate(parseISO(finalFrom)));
      const toDate = endOfMonth(new UTCDate(parseISO(finalTo)));
      const periodMonths = Math.ceil(
        (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );
      const prevFromDate = subMonths(fromDate, periodMonths);
      const prevToDate = subMonths(toDate, periodMonths);
      const prevFrom = format(prevFromDate, "yyyy-MM-dd");
      const prevTo = format(prevToDate, "yyyy-MM-dd");

      // Fetch paid and collected tax data for current and previous period
      const [
        paidTaxData,
        collectedTaxData,
        prevPaidTaxData,
        prevCollectedTaxData,
      ] = await Promise.all([
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

      // Tax paid on expenses (outgoing)
      const currentPaidTax = paidTaxData.summary.totalTaxAmount;
      // Tax collected from customers (incoming, e.g. VAT/GST on sales)
      const currentCollectedTax = collectedTaxData.summary.totalTaxAmount;
      // Net tax liability: collected minus paid (positive = you owe, negative = credit)
      const currentNetTax = currentCollectedTax - currentPaidTax;

      const currentTotalTax = currentPaidTax;
      const currentTotalTaxableIncome =
        paidTaxData.summary.totalTransactionAmount;

      const prevPaidTax = prevPaidTaxData.summary.totalTaxAmount;
      const prevCollectedTax = prevCollectedTaxData.summary.totalTaxAmount;
      const prevNetTax = prevCollectedTax - prevPaidTax;

      const prevTotalTax = prevPaidTax;
      const prevTotalTaxableIncome =
        prevPaidTaxData.summary.totalTransactionAmount;

      // Calculate effective tax rate
      const effectiveTaxRate =
        currentTotalTaxableIncome > 0
          ? (currentTotalTax / currentTotalTaxableIncome) * 100
          : 0;
      const prevEffectiveTaxRate =
        prevTotalTaxableIncome > 0
          ? (prevTotalTax / prevTotalTaxableIncome) * 100
          : 0;

      // Prepare category breakdown (top categories by tax amount)
      const categoryData = (paidTaxData.result || [])
        .slice(0, 10)
        .map((item) => ({
          category: item.category_name,
          taxAmount: item.total_tax_amount,
          percentage:
            currentTotalTax > 0
              ? (item.total_tax_amount / currentTotalTax) * 100
              : 0,
        }));

      // Prepare tax type breakdown (if multiple tax types exist)
      const taxTypeMap = new Map<string, number>();
      for (const item of paidTaxData.result || []) {
        const taxType = item.tax_type || "Other";
        const current = taxTypeMap.get(taxType) || 0;
        taxTypeMap.set(taxType, current + item.total_tax_amount);
      }
      const taxTypeData = Array.from(taxTypeMap.entries())
        .map(([taxType, taxAmount]) => ({
          taxType,
          taxAmount,
          percentage:
            currentTotalTax > 0 ? (taxAmount / currentTotalTax) * 100 : 0,
        }))
        .sort((a, b) => b.taxAmount - a.taxAmount);

      // Update artifact with chart data if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "chart_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            categoryData: categoryData.length > 0 ? categoryData : undefined,
            taxTypeData: taxTypeData.length > 0 ? taxTypeData : undefined,
          },
        });
      }

      // Update artifact with metrics if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          chart: {
            categoryData: categoryData.length > 0 ? categoryData : undefined,
            taxTypeData: taxTypeData.length > 0 ? taxTypeData : undefined,
          },
          metrics: {
            totalTaxLiability: currentTotalTax,
            totalTaxableIncome: currentTotalTaxableIncome,
            effectiveTaxRate,
            topCategories: categoryData.slice(0, 5),
            previousPeriod:
              prevTotalTax > 0 || prevTotalTaxableIncome > 0
                ? {
                    totalTaxLiability: prevTotalTax,
                    totalTaxableIncome: prevTotalTaxableIncome,
                    effectiveTaxRate: prevEffectiveTaxRate,
                  }
                : undefined,
          },
        });
      }

      // Generate simplified summary text
      const formattedPaidTax = formatAmount({
        amount: currentPaidTax,
        currency: targetCurrency,
        locale,
      });
      const formattedCollectedTax = formatAmount({
        amount: currentCollectedTax,
        currency: targetCurrency,
        locale,
      });
      const formattedNetTax = formatAmount({
        amount: Math.abs(currentNetTax),
        currency: targetCurrency,
        locale,
      });

      let summaryText = `Tax paid: ${formattedPaidTax}. Tax collected: ${formattedCollectedTax}.`;

      if (currentCollectedTax > 0 || currentPaidTax > 0) {
        const netDirection = currentNetTax > 0 ? "owe" : "are owed";
        summaryText += ` Net: you ${netDirection} ${formattedNetTax}.`;
      }

      summaryText += ` Effective tax rate: ${effectiveTaxRate.toFixed(2)}%.`;

      if (prevTotalTax > 0 || prevCollectedTax > 0) {
        const netChange = currentNetTax - prevNetTax;
        const changeDirection = netChange >= 0 ? "increased" : "decreased";
        const formattedChange = formatAmount({
          amount: Math.abs(netChange),
          currency: targetCurrency,
          locale,
        });
        summaryText += ` Compared to the previous period, your net tax liability has ${changeDirection} by ${formattedChange}.`;
      }

      if (categoryData.length > 0 && categoryData[0]) {
        summaryText += ` The largest tax category is ${categoryData[0].category}, representing ${categoryData[0].percentage.toFixed(1)}% of your total tax paid.`;
      }

      // Update artifact with analysis if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          chart: {
            categoryData: categoryData.length > 0 ? categoryData : undefined,
            taxTypeData: taxTypeData.length > 0 ? taxTypeData : undefined,
          },
          metrics: {
            totalTaxLiability: currentTotalTax,
            totalTaxableIncome: currentTotalTaxableIncome,
            effectiveTaxRate,
            topCategories: categoryData.slice(0, 5),
            previousPeriod:
              prevTotalTax > 0 || prevTotalTaxableIncome > 0
                ? {
                    totalTaxLiability: prevTotalTax,
                    totalTaxableIncome: prevTotalTaxableIncome,
                    effectiveTaxRate: prevEffectiveTaxRate,
                  }
                : undefined,
          },
          analysis: {
            summary: summaryText,
          },
        });
      }

      yield { text: summaryText };

      return {
        totalTaxPaid: currentPaidTax,
        totalTaxCollected: currentCollectedTax,
        netTaxLiability: currentNetTax,
        totalTaxableIncome: currentTotalTaxableIncome,
        currency: targetCurrency,
        effectiveTaxRate,
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
