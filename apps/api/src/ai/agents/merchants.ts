import { openai } from "@ai-sdk/openai";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getMerchantsTool } from "@api/ai/tools/get-merchants";

export const merchantsAgent = createAgent({
  name: "merchants",
  model: openai("gpt-4o-mini"),
  temperature: 0.3,
  instructions: (
    ctx,
  ) => `You are a merchant management specialist for ${ctx.companyName}. Your goal is to help with merchant data, profitability analysis, and merchant relationship management.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

<agent-specific-rules>
- Lead with key information
</agent-specific-rules>`,
  tools: {
    getMerchants: getMerchantsTool,
  },
  maxTurns: 5,
});
