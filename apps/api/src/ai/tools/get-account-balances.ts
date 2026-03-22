import type { AppContext } from "@api/ai/context";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getCashBalance } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getAccountBalancesSchema = z.object({
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. 'USD')")
    .nullable()
    .optional(),
});

export const getAccountBalancesTool = tool({
  description:
    "Get cash balance from depository accounts (checking/savings) - returns combined total and individual account balances.",
  inputSchema: getAccountBalancesSchema,
  execute: async function* ({ currency }, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield { text: "Unable to retrieve account balances: Team ID not found." };
      return {
        totalBalance: 0,
        currency: currency || appContext.baseCurrency || "USD",
        accountCount: 0,
        accounts: [],
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      const result = await getCashBalance(db, {
        teamId,
        currency: currency ?? undefined,
      });

      const targetCurrency =
        currency || result.currency || appContext.baseCurrency || "USD";
      const locale = appContext.locale || "en-US";

      const accounts = result.accountBreakdown.map((account) => ({
        name: account.name,
        originalBalance: account.originalBalance,
        originalCurrency: account.originalCurrency,
        convertedBalance: account.convertedBalance,
        convertedCurrency: account.convertedCurrency,
        type: account.type,
      }));

      const formattedTotal = formatAmount({
        amount: result.totalBalance,
        currency: targetCurrency,
        locale,
      });

      yield { text: `Cash balance: ${formattedTotal}` };

      return {
        totalBalance: result.totalBalance,
        currency: targetCurrency,
        accountCount: result.accountCount,
        accounts,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve account balances: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalBalance: 0,
        currency: currency || appContext.baseCurrency || "USD",
        accountCount: 0,
        accounts: [],
      };
    }
  },
});
