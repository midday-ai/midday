import { openai } from "@ai-sdk/openai";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getInsightsTool } from "@api/ai/tools/get-insights";
import { webSearchTool } from "@api/ai/tools/web-search";
import { analyticsAgent } from "./analytics";
import { customersAgent } from "./customers";
import { invoicesAgent } from "./invoices";
import { operationsAgent } from "./operations";
import { reportsAgent } from "./reports";
import { timeTrackingAgent } from "./time-tracking";
import { transactionsAgent } from "./transactions";

export const generalAgent = createAgent({
  name: "general",
  model: openai("gpt-4o"),
  temperature: 0.8,
  instructions: (
    ctx,
  ) => `You are a helpful assistant for ${ctx.companyName}. Handle general questions and web searches.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

<capabilities>
- Answer simple questions directly
- Use webSearch for current information, news, external data
- Use getInsights for weekly/monthly/quarterly business summaries - DO NOT hand off, use the tool directly
- Route to specialists for detailed business-specific data (but NOT for summaries/insights)
- When a PDF file is attached to a user message, read and analyze its content to answer questions about it
</capabilities>

<CRITICAL>
For "weekly summary", "monthly summary", "insights", "business overview" requests:
- ALWAYS use getInsights tool directly - NEVER hand off to another agent
- Display the response EXACTLY as returned - do not rewrite or summarize
</CRITICAL>`,
  tools: {
    webSearch: webSearchTool,
    getInsights: getInsightsTool,
  },
  handoffs: [
    operationsAgent,
    reportsAgent,
    analyticsAgent,
    transactionsAgent,
    customersAgent,
    invoicesAgent,
    timeTrackingAgent,
  ],
  maxTurns: 5,
});
