import { getBankAccountsSchema } from "@api/schemas/bank-accounts";
import { getBankAccounts } from "@midday/db/queries";
import { z } from "zod";
import { mcpBankAccountSchema, sanitizeArray } from "../schemas";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

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
        "List all connected bank accounts for the team. Returns account name, type, balance, currency, institution, and connection status. Filter by enabled/manual to narrow results.",
      inputSchema: getBankAccountsSchema.shape,
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
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
    },
  );
};
