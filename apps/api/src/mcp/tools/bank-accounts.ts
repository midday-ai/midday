import { getBankAccountsSchema } from "@api/schemas/bank-accounts";
import { getBankAccounts } from "@midday/db/queries";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

export const registerBankAccountTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Require bank-accounts.read scope
  if (!hasScope(ctx, "bank-accounts.read")) {
    return;
  }
  server.registerTool(
    "bank_accounts_list",
    {
      title: "List Bank Accounts",
      description:
        "List all bank accounts for the team including balances and connection status",
      inputSchema: getBankAccountsSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getBankAccounts(db, {
        teamId,
        enabled: params.enabled,
        manual: params.manual,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
};
