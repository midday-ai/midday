import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { taxSummaryArtifact } from "@api/ai/artifacts/tax-summary";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { getToolDateDefaults } from "@api/ai/utils/tool-date-defaults";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { UTCDate } from "@date-fns/utc";
import { db } from "@midday/db/client";
import { getTaxSummary } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { parseISO } from "date-fns";
import { z } from "zod";

const getTaxSummarySchema = z.object({
  from: z.string().optional().describe("Start date (ISO 8601)"),
  to: z.string().optional().describe("End date (ISO 8601)"),
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. 'USD')")
    .nullable()
    .optional(),
  showCanvas: z.boolean().default(false).describe("Show visual analytics"),
});

export const getTaxSummaryTool = tool({
  description:
    "Generate tax summary - shows tax liability, taxable income, and tax rates for a given period.",
  inputSchema: getTaxSummarySchema,
  execute: async function* (
    { from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve tax summary: Team ID not found in context.",
      };
      return {
        totalTaxLiability: 0,
        totalTaxableIncome: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      // Use fiscal year-aware defaults if dates not provided
      const defaultDates = getToolDateDefaults(appContext.fiscalYearStartMonth);
      const finalFrom = from ?? defaultDates.from;
      const finalTo = to ?? defaultDates.to;

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof taxSummaryArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = taxSummaryArtifact.stream(
          {
            stage: "loading",
            currency: currency || appContext.baseCurrency || "USD",
            from: finalFrom,
            to: finalTo,
            description,
          },
          writer,
        );
      }

      const targetCurrency = currency || appContext.baseCurrency || "USD";
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

      // Fetch tax data for current period (both paid and collected)
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

      // Combine paid and collected tax (for most businesses, we focus on paid tax)
      const currentTotalTax = paidTaxData.summary.totalTaxAmount;
      const currentTotalTaxableIncome =
        paidTaxData.summary.totalTransactionAmount;
      const prevTotalTax = prevPaidTaxData.summary.totalTaxAmount;
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
      const formattedCurrentTax = formatAmount({
        amount: currentTotalTax,
        currency: targetCurrency,
        locale,
      });

      let summaryText = `Your total tax liability for this period is ${formattedCurrentTax} with an effective tax rate of ${effectiveTaxRate.toFixed(2)}%.`;

      if (prevTotalTax > 0) {
        const taxChange = currentTotalTax - prevTotalTax;
        const taxChangePercent =
          prevTotalTax > 0
            ? ((taxChange / prevTotalTax) * 100).toFixed(1)
            : "0";
        const changeDirection = taxChange >= 0 ? "increased" : "decreased";
        summaryText += ` Compared to the previous period, your tax liability has ${changeDirection} by ${Math.abs(Number.parseFloat(taxChangePercent))}%.`;
      }

      if (categoryData.length > 0 && categoryData[0]) {
        summaryText += ` The largest tax category is ${categoryData[0].category}, representing ${categoryData[0].percentage.toFixed(1)}% of your total tax liability.`;
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
        totalTaxLiability: currentTotalTax,
        totalTaxableIncome: currentTotalTaxableIncome,
        currency: targetCurrency,
        effectiveTaxRate,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve tax summary: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalTaxLiability: 0,
        totalTaxableIncome: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
