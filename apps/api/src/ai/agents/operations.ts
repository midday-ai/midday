import { openai } from "@ai-sdk/openai";
// import { listInvoicesTool } from "../tools/invoices";
// import {
//   exportDataTool,
//   getBalancesTool,
//   listDocumentsTool,
//   listInboxItemsTool,
// } from "../tools/operations";
// import { listTransactionsTool } from "../tools/transactions";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";

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
  //   tools: {
  //     listInbox: listInboxItemsTool,
  //     getBalances: getBalancesTool,
  //     listDocuments: listDocumentsTool,
  //     exportData: exportDataTool,
  //     listTransactions: listTransactionsTool,
  //     listInvoices: listInvoicesTool,
  //   },
  maxTurns: 5,
});
