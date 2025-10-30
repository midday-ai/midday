import { openai } from "@ai-sdk/openai";
// import { webSearchTool } from "../tools/search";
// import { analyticsAgent } from "./analytics";
// import { customersAgent } from "./customers";
// import { invoicesAgent } from "./invoices";
// import { operationsAgent } from "./operations";
// import { reportsAgent } from "./reports";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { webSearchTool } from "@api/ai/tools/web-search";
// import { timeTrackingAgent } from "./time-tracking";
// import { transactionsAgent } from "./transactions";

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
- Route to specialists for business-specific data
</capabilities>`,
  tools: {
    webSearch: webSearchTool,
  },
  //   handoffs: [
  //     operationsAgent,
  //     reportsAgent,
  //     analyticsAgent,
  //     transactionsAgent,
  //     customersAgent,
  //     invoicesAgent,
  //     timeTrackingAgent,
  //   ],
  maxTurns: 5,
});
