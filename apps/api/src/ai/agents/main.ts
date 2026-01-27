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

<routing-rules>
IMPORTANT: For "weekly summary", "monthly summary", "summary for week X", "insights", "business overview" → ALWAYS route to general (NOT reports)

<agent-capabilities>
general: Weekly/monthly/quarterly summaries, insights, business overview, general questions, greetings, web search
research: AFFORDABILITY ANALYSIS ("can I afford X?", "should I buy X?"), purchase decisions, market comparisons
operations: Account balances, documents, inbox
reports: Detailed financial reports (revenue, profit, expenses, spending, burn rate, runway, P&L, cash flow, stress test, invoice payment analysis, growth rate, balance sheet, business health score, forecast, tax summary, metrics breakdown)
analytics: Predictions, advanced analytics (excluding revenue forecast)
transactions: Transaction history
invoices: Invoice management
customers: Customer management
timeTracking: Time tracking
</agent-capabilities>
</routing-rules>
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
