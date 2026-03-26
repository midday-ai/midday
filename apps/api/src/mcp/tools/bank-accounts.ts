import {
  getBankAccountDetailsSchema,
  getBankAccountsSchema,
} from "@api/schemas/bank-accounts";
import {
  getBankAccountDetails,
  getBankAccounts,
  getBankAccountsBalances,
  getBankAccountsCurrencies,
} from "@midday/db/queries";
import { z } from "zod";
import {
  mcpBankAccountBalanceSchema,
  mcpBankAccountCurrencySchema,
  mcpBankAccountDetailsSchema,
  mcpBankAccountSchema,
  sanitize,
  sanitizeArray,
} from "../schemas";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";
import { withErrorHandling } from "../utils";

export const registerBankAccountTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  if (!hasScope(ctx, "bank-accounts.read")) {
    return;
  }

  server.registerTool(
    "bank_accounts_list",
    {
      title: "List Bank Accounts",
      description:
        "List all connected bank accounts for the team. Returns account name, type, balance, currency, and connection info (institution name and logo). Filter by enabled/manual to narrow results.",
      inputSchema: getBankAccountsSchema.shape,
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async (params) => {
      const result = await getBankAccounts(db, {
        teamId,
        enabled: params.enabled,
        manual: params.manual,
      });

      const clean = sanitizeArray(mcpBankAccountSchema, result ?? []);

      return {
        content: [{ type: "text", text: JSON.stringify(clean) }],
        structuredContent: { data: clean },
      };
    }, "Failed to list bank accounts"),
  );

  server.registerTool(
    "bank_accounts_balances",
    {
      title: "Bank Account Balances",
      description:
        "Get current balances for all bank accounts. Returns each account's balance, currency, and name. Use this for a quick cash position overview.",
      inputSchema: {},
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async () => {
      const result = await getBankAccountsBalances(db, teamId);
      const clean = sanitizeArray(mcpBankAccountBalanceSchema, result ?? []);

      return {
        content: [{ type: "text" as const, text: JSON.stringify(clean) }],
        structuredContent: { data: clean },
      };
    }, "Failed to get bank account balances"),
  );

  server.registerTool(
    "bank_accounts_currencies",
    {
      title: "Bank Account Currencies",
      description:
        "List all unique currencies across connected bank accounts. Useful for multi-currency reporting.",
      inputSchema: {},
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async () => {
      const result = await getBankAccountsCurrencies(db, teamId);
      const clean = sanitizeArray(mcpBankAccountCurrencySchema, result ?? []);

      return {
        content: [{ type: "text" as const, text: JSON.stringify(clean) }],
        structuredContent: { data: clean },
      };
    }, "Failed to get bank account currencies"),
  );

  server.registerTool(
    "bank_accounts_details",
    {
      title: "Bank Account Details",
      description:
        "Get banking details for a specific account including IBAN, account number, routing number, BIC, and sort code. Only available for accounts that have this information on file.",
      inputSchema: getBankAccountDetailsSchema.shape,
      outputSchema: {
        data: z.record(z.string(), z.any()).nullable(),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async ({ id }) => {
      const result = await getBankAccountDetails(db, { accountId: id, teamId });

      if (!result) {
        return {
          content: [
            { type: "text" as const, text: "Bank account details not found" },
          ],
          structuredContent: { data: null },
        };
      }

      const clean = sanitize(mcpBankAccountDetailsSchema, result);

      return {
        content: [{ type: "text" as const, text: JSON.stringify(clean) }],
        structuredContent: { data: clean },
      };
    }, "Failed to get bank account details"),
  );
};
