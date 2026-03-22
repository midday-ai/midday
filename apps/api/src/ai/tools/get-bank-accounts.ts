import type { AppContext } from "@api/ai/context";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getBankAccounts } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getBankAccountsSchema = z.object({
  enabled: z.boolean().nullable().optional().describe("Enabled status"),
  manual: z.boolean().nullable().optional().describe("Manual account flag"),
});

export const getBankAccountsTool = tool({
  description:
    "Retrieve bank accounts with filtering by enabled status and manual flag.",
  inputSchema: getBankAccountsSchema,
  execute: async function* ({ enabled, manual }, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve bank accounts: Team ID not found in context.",
      };
      return;
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      const params = {
        teamId,
        enabled: enabled ?? undefined,
        manual: manual ?? undefined,
      };

      const accounts = await getBankAccounts(db, params);

      const locale = appContext.locale ?? "en-US";
      const baseCurrency = appContext.baseCurrency ?? "USD";

      if (accounts.length === 0) {
        yield { text: "No bank accounts found matching your criteria." };
        return { accounts: [], total: 0, currency: baseCurrency };
      }

      const formattedAccounts = accounts.map((account) => {
        const formattedBalance = formatAmount({
          amount: Number(account.balance) || 0,
          currency: account.currency || baseCurrency,
          locale,
        });

        return {
          id: account.id,
          name: account.name || "Unnamed Account",
          type: account.type || "depository",
          currency: account.currency || baseCurrency,
          balance: formattedBalance,
          rawBalance: Number(account.balance) || 0,
          enabled: account.enabled ? "Enabled" : "Disabled",
          manual: account.manual ? "Manual" : "Connected",
        };
      });

      const totalBalance = accounts.reduce(
        (sum, acc) => sum + (Number(acc.balance) || 0),
        0,
      );

      const enabledCount = accounts.filter((acc) => acc.enabled).length;
      const disabledCount = accounts.filter((acc) => !acc.enabled).length;

      yield { text: `${accounts.length} bank accounts found` };

      return {
        accounts: formattedAccounts,
        total: accounts.length,
        totalBalance,
        enabledCount,
        disabledCount,
        currency: baseCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve bank accounts: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
