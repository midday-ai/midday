import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import {
  getSpending,
  getSpendingForPeriod,
  getTransactions,
} from "@midday/db/queries";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { endOfMonth, parseISO, startOfMonth } from "date-fns";
import { z } from "zod";

const getSpendingSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
});

export const getSpendingTool = tool({
  description:
    "Analyze spending patterns - totals, top transactions, category breakdown.",
  inputSchema: getSpendingSchema,
  execute: async function* (
    { period, from, to, currency },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield { text: "Unable to retrieve spending data: Team ID not found." };
      return {
        totalSpending: 0,
        currency: currency || appContext.baseCurrency || "USD",
        currentMonthSpending: 0,
        averageMonthlySpending: 0,
        topCategory: null,
        categoryData: [],
        transactions: [],
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

      const [spendingCategories, periodSummary, transactionsResult] =
        await Promise.all([
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
          getTransactions(db, {
            teamId,
            type: "expense",
            start: finalFrom,
            end: finalTo,
            sort: ["amount", "asc"],
            pageSize: 10,
          }),
        ]);

      const totalSpending = periodSummary.totalSpending;
      const topCategory = periodSummary.topCategory;

      const transactions = transactionsResult.data
        .map((tx) => ({
          id: tx.id,
          date: formatDate(tx.date),
          vendor: tx.name,
          category: tx.category?.name || "Uncategorized",
          amount: Math.abs(tx.amount),
          share:
            totalSpending > 0
              ? Math.round((Math.abs(tx.amount) / totalSpending) * 1000) / 10
              : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      const categoryData = spendingCategories.map((cat) => ({
        name: cat.name,
        value: cat.amount,
        percentage: cat.percentage,
      }));

      const fromDate = parseISO(finalFrom);
      const toDate = parseISO(finalTo);
      const monthsDiff =
        (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
        (toDate.getMonth() - fromDate.getMonth()) +
        1;
      const averageMonthlySpending =
        monthsDiff > 0 ? totalSpending / monthsDiff : totalSpending;

      const currentMonthSummary = await getSpendingForPeriod(db, {
        teamId,
        from: startOfMonth(new Date()).toISOString(),
        to: endOfMonth(new Date()).toISOString(),
        currency: finalCurrency ?? undefined,
      });

      const formattedTotal = formatAmount({
        amount: totalSpending,
        currency: targetCurrency,
        locale,
      });

      yield { text: `Total spending: ${formattedTotal}` };

      return {
        totalSpending,
        currency: targetCurrency,
        currentMonthSpending: currentMonthSummary.totalSpending,
        averageMonthlySpending,
        topCategory: topCategory
          ? {
              name: topCategory.name,
              amount: topCategory.amount,
              percentage: topCategory.percentage,
            }
          : null,
        categoryData,
        transactions,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve spending data: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalSpending: 0,
        currency: currency || appContext.baseCurrency || "USD",
        currentMonthSpending: 0,
        averageMonthlySpending: 0,
        topCategory: null,
        categoryData: [],
        transactions: [],
      };
    }
  },
});
