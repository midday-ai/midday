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
reports: Financial reports (revenue, expenses, spending, spending patterns, burn rate, burn rate analysis, burn rate visual analytics, runway, P&L, cash flow, cash flow stress test, stress test, financial resilience, scenario analysis, invoice payment analysis, payment patterns, overdue invoices, growth rate, revenue growth, profit growth, period-over-period growth, balance sheet, financial position, assets and liabilities, statement of financial position, financial snapshot, business health score, business health scores, financial health, health metrics, revenue forecast, forecast, revenue projection, projection, show revenue forecast, show forecast)
analytics: Predictions, advanced analytics (excluding revenue forecast which goes to reports)
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
