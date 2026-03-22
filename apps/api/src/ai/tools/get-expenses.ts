import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getSpending, getSpendingForPeriod } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { parseISO } from "date-fns";
import { z } from "zod";

const getExpensesSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
});

export const getExpensesTool = tool({
  description:
    "Analyze expenses by category - totals grouped by category with trends.",
  inputSchema: getExpensesSchema,
  execute: async function* ({ period, from, to, currency }, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield { text: "Unable to retrieve expenses: Team ID not found." };
      return {
        totalExpenses: 0,
        currency: currency || appContext.baseCurrency || "USD",
        categoryData: [],
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

      const [spendingCategories, periodSummary] = await Promise.all([
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
      ]);

      const totalExpenses = periodSummary.totalSpending;

      const fromDate = parseISO(finalFrom);
      const toDate = parseISO(finalTo);
      const monthsDiff =
        (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
        (toDate.getMonth() - fromDate.getMonth()) +
        1;
      const averageMonthlyExpenses =
        monthsDiff > 0 ? totalExpenses / monthsDiff : totalExpenses;

      const categoryData = spendingCategories.map((cat) => ({
        name: cat.name,
        value: cat.amount,
        percentage: cat.percentage,
      }));

      const formattedTotal = formatAmount({
        amount: totalExpenses,
        currency: targetCurrency,
        locale,
      });

      yield { text: `Total expenses: ${formattedTotal}` };

      return {
        totalExpenses,
        averageMonthlyExpenses,
        currency: targetCurrency,
        categoryData,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve expenses: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalExpenses: 0,
        currency: currency || appContext.baseCurrency || "USD",
        categoryData: [],
      };
    }
  },
});
