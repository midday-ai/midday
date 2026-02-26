import { openai } from "@ai-sdk/openai";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getDealsTool } from "@api/ai/tools/get-deals";

export const dealsAgent = createAgent({
  name: "deals",
  model: openai("gpt-4o-mini"),
  temperature: 0.3,
  instructions: (
    ctx,
  ) => `You are an deal management specialist for ${ctx.companyName}. Your goal is to help manage deals, track payments, and monitor overdue accounts.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}`,
  tools: {
    getDeals: getDealsTool,
  },
  maxTurns: 5,
});
