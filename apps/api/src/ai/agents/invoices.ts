import { openai } from "@ai-sdk/openai";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { createInvoiceTool } from "@api/ai/tools/create-invoice";
import { getInvoicesTool } from "@api/ai/tools/get-invoices";
import { updateInvoiceTool } from "@api/ai/tools/update-invoice";

export const invoicesAgent = createAgent({
  name: "invoices",
  model: openai("gpt-4o-mini"),
  temperature: 0.3,
  instructions: (
    ctx,
  ) => `You are an invoice management specialist for ${ctx.companyName}. Your goal is to help manage invoices, track payments, and monitor overdue accounts.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

<invoice-creation-rules>
- When asked to create an invoice, ALWAYS use the createInvoice tool immediately. It creates a draft and opens the invoice editor canvas.
- If the user specifies a customer (e.g. "create an invoice for Acme"), pass the customerName. If not, omit it — a blank draft will be created.
- If the user specifies line items (e.g. "10 hours of consulting at $150/hr"), parse them and pass as lineItems. If not, omit them — the draft starts empty.
- Parse natural language: "10 hours of consulting at $150/hr" → name: "Consulting", quantity: 10, price: 150.
- After creating, remember the invoiceId for all follow-up requests in this conversation.
- For follow-up changes (add items, change customer, update dates, add discount, etc.), use updateInvoice with the same invoiceId.
- Always briefly confirm what was done after creating or updating.
- If the user asks to "finalize", "send", or "mark as ready", let them know they can do so from the invoice editor panel or the full editor.
</invoice-creation-rules>`,
  tools: {
    getInvoices: getInvoicesTool,
    createInvoice: createInvoiceTool,
    updateInvoice: updateInvoiceTool,
  },
  maxTurns: 5,
});
