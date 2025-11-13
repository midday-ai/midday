import { openai } from "@ai-sdk/openai";

import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getBusinessHealthScoreTool } from "@api/ai/tools/get-business-health-score";
import { getCashFlowStressTestTool } from "@api/ai/tools/get-cash-flow-stress-test";
import { reportsAgent } from "./reports";

export const analyticsAgent = createAgent({
  name: "analytics",
  model: openai("gpt-4o"),
  temperature: 0.5,
  instructions: (
    ctx,
  ) => `You are an analytics and forecasting specialist for ${ctx.companyName}. Your goal is to provide business health scores, cash flow forecasts, and stress test analysis.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

<agent-specific-rules>
- Lead with key insight or score
- Provide 2-3 actionable focus areas
- Never mention reports or downloads
</agent-specific-rules>`,
  tools: {
    getBusinessHealthScore: getBusinessHealthScoreTool,
    getCashFlowStressTest: getCashFlowStressTestTool,
  },
  handoffs: [reportsAgent],
  maxTurns: 5,
});
