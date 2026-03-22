import type { AppContext } from "@api/ai/context";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getBalanceSheet } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { format, parseISO } from "date-fns";
import { z } from "zod";

const getBalanceSheetSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z
    .string()
    .optional()
    .describe("End date (yyyy-MM-dd) - used as 'as of' date"),
  currency: z.string().nullable().optional().describe("Currency code"),
});

export const getBalanceSheetTool = tool({
  description:
    "Generate balance sheet - assets, liabilities, and equity as of a date.",
  inputSchema: getBalanceSheetSchema,
  execute: async function* ({ period, from, to, currency }, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield { text: "Unable to retrieve balance sheet: Team ID not found." };
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
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

      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;
      const locale = appContext.locale || "en-US";
      const asOfDate = format(parseISO(finalTo), "yyyy-MM-dd");

      const data = await getBalanceSheet(db, {
        teamId,
        currency: finalCurrency ?? undefined,
        asOf: asOfDate,
      });

      const totalAssets = data.assets.total;
      const totalLiabilities = data.liabilities.total;
      const totalEquity = data.equity.total;

      const currentAssets = data.assets.current.total;
      const currentLiabilities = data.liabilities.current.total;

      const currentRatio =
        currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
      const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
      const workingCapital = currentAssets - currentLiabilities;
      const equityRatio =
        totalAssets > 0 ? (totalEquity / totalAssets) * 100 : 0;

      const formattedAssets = formatAmount({
        amount: Math.abs(totalAssets),
        currency: data.currency,
        locale,
      });

      yield {
        text: `Balance sheet as of ${asOfDate}: Total assets ${formattedAssets}`,
      };

      return {
        asOf: asOfDate,
        currency: data.currency,
        locale,
        assets: {
          current: [
            {
              label: "Cash and Cash Equivalents",
              amount: data.assets.current.cash,
            },
            {
              label: "Accounts Receivable",
              amount: data.assets.current.accountsReceivable,
            },
            {
              label: data.assets.current.inventoryName || "Inventory",
              amount: data.assets.current.inventory,
            },
            {
              label:
                data.assets.current.prepaidExpensesName || "Prepaid Expenses",
              amount: data.assets.current.prepaidExpenses,
            },
          ],
          nonCurrent: [
            {
              label:
                data.assets.nonCurrent.fixedAssetsName ||
                "Fixed Assets (Equipment)",
              amount: data.assets.nonCurrent.fixedAssets,
            },
            {
              label: "Accumulated Depreciation",
              amount: data.assets.nonCurrent.accumulatedDepreciation,
            },
            {
              label:
                data.assets.nonCurrent.softwareTechnologyName ||
                "Software & Technology",
              amount: data.assets.nonCurrent.softwareTechnology,
            },
            {
              label:
                data.assets.nonCurrent.longTermInvestmentsName ||
                "Long-term Investments",
              amount: data.assets.nonCurrent.longTermInvestments,
            },
            {
              label: "Other Assets",
              amount: data.assets.nonCurrent.otherAssets,
            },
          ],
        },
        liabilities: {
          current: [
            {
              label: "Accounts Payable",
              amount: data.liabilities.current.accountsPayable,
            },
            {
              label:
                data.liabilities.current.accruedExpensesName ||
                "Accrued Expenses",
              amount: data.liabilities.current.accruedExpenses,
            },
            {
              label: "Short-term Debt",
              amount: data.liabilities.current.shortTermDebt,
            },
            {
              label:
                data.liabilities.current.creditCardDebtName ||
                "Credit Card Debt",
              amount: data.liabilities.current.creditCardDebt,
            },
          ],
          nonCurrent: [
            {
              label: "Long-term Debt",
              amount: data.liabilities.nonCurrent.longTermDebt,
            },
            {
              label:
                data.liabilities.nonCurrent.deferredRevenueName ||
                "Deferred Revenue",
              amount: data.liabilities.nonCurrent.deferredRevenue,
            },
            {
              label: data.liabilities.nonCurrent.leasesName || "Leases",
              amount: data.liabilities.nonCurrent.leases,
            },
            {
              label: "Other Liabilities",
              amount: data.liabilities.nonCurrent.otherLiabilities,
            },
          ],
        },
        equity: {
          items: [
            {
              label: data.equity.capitalInvestmentName || "Capital Investment",
              amount: data.equity.capitalInvestment,
            },
            {
              label: data.equity.ownerDrawsName || "Owner Draws",
              amount: data.equity.ownerDraws,
            },
            {
              label: "Retained Earnings",
              amount: data.equity.retainedEarnings,
            },
          ],
        },
        ratios: {
          currentRatio,
          debtToEquity,
          workingCapital,
          equityRatio,
        },
        totalAssets,
        totalLiabilities,
        totalEquity,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve balance sheet: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        currency: currency || appContext.baseCurrency || "USD",
      };
    }
  },
});
