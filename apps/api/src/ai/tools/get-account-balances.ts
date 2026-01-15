import type { AppContext } from "@api/ai/agents/config/shared";
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
      yield {
        text: "Unable to retrieve account balances: Team ID not found in context.",
      };
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

      // Format the combined total balance
      const formattedTotalBalance = formatAmount({
        amount: result.totalBalance,
        currency: targetCurrency,
        locale,
      });

      // Format individual account balances
      const formattedAccounts = result.accountBreakdown.map((account) => {
        const formattedOriginalBalance = formatAmount({
          amount: account.originalBalance,
          currency: account.originalCurrency,
          locale,
        });

        const formattedConvertedBalance = formatAmount({
          amount: account.convertedBalance,
          currency: account.convertedCurrency,
          locale,
        });

        return {
          name: account.name,
          originalBalance: formattedOriginalBalance,
          originalCurrency: account.originalCurrency,
          convertedBalance: formattedConvertedBalance,
          convertedCurrency: account.convertedCurrency,
          type: account.type,
          logoUrl: account.logoUrl,
        };
      });

      // Check if we have accounts with different currencies
      const hasMultipleCurrencies = formattedAccounts.some(
        (account) => account.originalCurrency !== targetCurrency,
      );

      // Build response text with markdown table
      let responseText = `**Cash Balance:** ${formattedTotalBalance}\n\n`;

      if (formattedAccounts.length > 0) {
        responseText += "**Account Breakdown:**\n\n";

        if (hasMultipleCurrencies) {
          // Show both columns when currencies differ
          responseText += `| Account Name | Original Balance | Converted Balance (${targetCurrency}) |\n`;
          responseText +=
            "|--------------|------------------|-----------------------------------|\n";

          for (const account of formattedAccounts) {
            responseText += `| ${account.name} | ${account.originalBalance} | ${account.convertedBalance} |\n`;
          }
        } else {
          // Show only original balance when all currencies match
          responseText += "| Account Name | Balance |\n";
          responseText += "|--------------|---------|\n";

          for (const account of formattedAccounts) {
            responseText += `| ${account.name} | ${account.originalBalance} |\n`;
          }
        }
      } else {
        responseText += "No enabled depository accounts found.";
      }

      yield { text: responseText };

      return {
        totalBalance: formattedTotalBalance,
        currency: targetCurrency,
        accountCount: result.accountCount,
        accounts: formattedAccounts,
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
