import { openai } from "@ai-sdk/openai";
import { createAgent, formatContextForLLM } from "@api/ai/agents/config/shared";
import { analyticsAgent } from "./analytics";
import { customersAgent } from "./customers";
import { generalAgent } from "./general";
import { invoicesAgent } from "./invoices";
import { operationsAgent } from "./operations";
import { reportsAgent } from "./reports";
import { researchAgent } from "./research";
import { timeTrackingAgent } from "./time-tracking";
import { transactionsAgent } from "./transactions";

export const mainAgent = createAgent({
  name: "triage",
  model: openai("gpt-4o-mini"),
  temperature: 0.1,
  modelSettings: {
    toolChoice: {
      type: "tool",
      toolName: "handoff_to_agent",
    },
  },
  instructions: (ctx) => `Route user requests to the appropriate specialist.

<background-data>
${formatContextForLLM(ctx)}

<agent-capabilities>
general: General questions, greetings, web search

research: AFFORDABILITY ANALYSIS ("can I afford X?", "should I buy X?"), purchase decisions, market comparisons
operations: Account balances, documents, inbox
reports: Financial reports (revenue, expenses, burn rate, runway, P&L)
analytics: Forecasts, health scores, predictions, stress tests
transactions: Transaction history
invoices: Invoice management
customers: Customer management
timeTracking: Time tracking
</agent-capabilities>
</background-data>`,
  handoffs: [
    generalAgent,
    researchAgent,
    operationsAgent,
    reportsAgent,
    analyticsAgent,
    transactionsAgent,
    invoicesAgent,
    customersAgent,
    timeTrackingAgent,
  ],
  maxTurns: 1,
});
