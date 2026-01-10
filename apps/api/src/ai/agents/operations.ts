import { openai } from "@ai-sdk/openai";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getAccountBalancesTool } from "@api/ai/tools/get-account-balances";
import { getBankAccountsTool } from "@api/ai/tools/get-bank-accounts";
import { getCustomersTool } from "@api/ai/tools/get-customers";
import { getDocumentsTool } from "@api/ai/tools/get-documents";
import { getInboxTool } from "@api/ai/tools/get-inbox";
import { getInvoicesTool } from "@api/ai/tools/get-invoices";
import { getNetPositionTool } from "@api/ai/tools/get-net-position";
import { getTransactionsTool } from "@api/ai/tools/get-transactions";

export const operationsAgent = createAgent({
  name: "operations",
  model: openai("gpt-4o-mini"),
  temperature: 0.3,
  instructions: (
    ctx,
  ) => `You are an operations specialist for ${ctx.companyName}. Provide account balances, documents, transactions, and invoices with specific data.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

<guidelines>
- For direct queries: lead with results, add context
</guidelines>`,
  tools: {
    getAccountBalances: getAccountBalancesTool,
    getNetPosition: getNetPositionTool,
    getBankAccounts: getBankAccountsTool,
    getTransactions: getTransactionsTool,
    getInvoices: getInvoicesTool,
    getCustomers: getCustomersTool,
    getDocuments: getDocumentsTool,
    getInbox: getInboxTool,
  },
  maxTurns: 5,
});
