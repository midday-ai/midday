import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import {
  CONTRA_REVENUE_CATEGORIES,
  REVENUE_CATEGORIES,
} from "@midday/categories";
import { db } from "@midday/db/client";
import {
  getReports,
  getSpending,
  getSpendingForPeriod,
  getTransactions,
} from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { format, parseISO } from "date-fns";
import { z } from "zod";

const getMetricsBreakdownSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
  chartType: z
    .string()
    .optional()
    .describe("Type of chart that triggered this breakdown"),
});

export const getMetricsBreakdownTool = tool({
  description:
    "Get a comprehensive breakdown of financial metrics for a specific period. Use this tool when the user requests a 'breakdown', 'break down', 'show me a breakdown', 'breakdown of', 'detailed breakdown', or 'comprehensive breakdown' of any financial metric (revenue, expenses, profit, burn rate, etc.). Provides revenue, expenses, profit, transactions, category breakdowns, and analysis. ALWAYS use this tool (not getBurnRate, getRevenueSummary, etc.) when 'breakdown' is mentioned in the request. " +
    "IMPORTANT: Use the 'period' parameter for standard time ranges.",
  inputSchema: getMetricsBreakdownSchema,
  execute: async function* (
    { period, from, to, currency, chartType },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve metrics breakdown: Team ID not found.",
      };
      return {
        summary: { revenue: 0, expenses: 0, profit: 0, transactionCount: 0 },
        transactions: [],
        categories: [],
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

      const [revenueResult, spendingCategories, periodSummary, profitResult] =
        await Promise.all([
          getReports(db, {
            teamId,
            from: finalFrom,
            to: finalTo,
            currency: finalCurrency ?? undefined,
            type: "revenue",
            revenueType: "net",
          }),
          getSpending(db, {
            teamId,
            from: finalFrom,
            to: finalTo,
            currency: finalCurrency ?? undefined,
          }),
          getSpendingForPeriod(db, {
            teamId,
            from: finalFrom,
            to: finalTo,
            currency: finalCurrency ?? undefined,
          }),
          getReports(db, {
            teamId,
            from: finalFrom,
            to: finalTo,
            currency: finalCurrency ?? undefined,
            type: "profit",
            revenueType: "net",
          }),
        ]);

      const revenue = revenueResult.summary.currentTotal;
      const expenses = Math.abs(periodSummary.totalSpending);
      const profit = profitResult.summary.currentTotal;

      let allTransactions: any[] = [];
      let cursor: string | null = null;
      let hasMore = true;

      while (hasMore) {
        const transactionsResult = await getTransactions(db, {
          teamId,
          start: finalFrom,
          end: finalTo,
          sort: ["date", "desc"],
          pageSize: 10000,
          cursor: cursor ?? null,
        });

        allTransactions = allTransactions.concat(transactionsResult.data);
        cursor = transactionsResult.meta.cursor ?? null;
        hasMore = transactionsResult.meta.hasNextPage ?? false;
      }

      const filteredTransactions = allTransactions.filter((tx) => {
        if (tx.internal) return false;
        if (tx.amount > 0) {
          if (!tx.categorySlug || !REVENUE_CATEGORIES.includes(tx.categorySlug))
            return false;
          if (CONTRA_REVENUE_CATEGORIES.includes(tx.categorySlug)) return false;
        }
        return true;
      });

      const transactionCount = filteredTransactions.length;

      const transactionAmounts = filteredTransactions.map((tx) =>
        tx.baseCurrency === targetCurrency && tx.baseAmount != null
          ? tx.baseAmount
          : tx.amount,
      );

      const totalExpenses = Math.abs(
        transactionAmounts.filter((a) => a < 0).reduce((sum, a) => sum + a, 0),
      );
      const totalRevenue = transactionAmounts
        .filter((a) => a > 0)
        .reduce((sum, a) => sum + a, 0);

      const relevantTransactions = filteredTransactions
        .map((tx, index) => {
          const txAmount = transactionAmounts[index]!;
          const totalForPct = txAmount < 0 ? totalExpenses : totalRevenue;
          const percentage =
            totalForPct > 0 ? (Math.abs(txAmount) / totalForPct) * 100 : 0;

          return {
            id: tx.id,
            date: format(parseISO(tx.date), "MMM d, yyyy"),
            name: tx.name,
            amount: txAmount,
            formattedAmount: formatAmount({
              amount: Math.abs(txAmount),
              currency: tx.baseCurrency || tx.currency || targetCurrency,
              locale,
            }),
            category: tx.category?.name || "Uncategorized",
            type: (txAmount >= 0 ? "income" : "expense") as
              | "income"
              | "expense",
            percentage,
          };
        })
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10);

      const categories = spendingCategories.map((cat) => ({
        name: cat.name,
        value: cat.amount,
        percentage: cat.percentage,
      }));

      const formattedProfit = formatAmount({
        amount: profit,
        currency: targetCurrency,
        locale,
      });

      yield {
        text: `Breakdown: ${formattedProfit} profit from ${transactionCount} transactions`,
      };

      return {
        summary: { revenue, expenses, profit, transactionCount },
        transactions: relevantTransactions,
        categories,
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve metrics breakdown: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      throw error;
    }
  },
});
