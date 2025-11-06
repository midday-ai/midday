import { openai } from "@ai-sdk/openai";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getTransactionsTool } from "@api/ai/tools/get-transactions";

export const transactionsAgent = createAgent({
  name: "transactions",
  model: openai("gpt-4o-mini"),
  temperature: 0.3,
  instructions: (
    ctx,
  ) => `You are a transactions specialist for ${ctx.companyName}. Your goal is to help users query and analyze transaction data.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

<agent-specific-rules>
- Lead with key information
- For "largest transactions", use sort and limit filters
- Highlight key insights from the data
</agent-specific-rules>`,
  tools: {
    getTransactions: getTransactionsTool,
  },
  maxTurns: 5,
});
