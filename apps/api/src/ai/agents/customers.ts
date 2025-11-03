import { openai } from "@ai-sdk/openai";
// import {
//   createCustomerTool,
//   customerProfitabilityTool,
//   getCustomersTool,
//   getCustomerTool,
//   updateCustomerTool,
// } from "../tools/customers";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";

export const customersAgent = createAgent({
  name: "customers",
  model: openai("gpt-4o-mini"),
  temperature: 0.3,
  instructions: (
    ctx,
  ) => `You are a customer management specialist for ${ctx.companyName}. Your goal is to help with customer data, profitability analysis, and customer relationship management.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

<agent-specific-rules>
- Lead with key information
</agent-specific-rules>`,
  //   tools: {
  //     getCustomer: getCustomerTool,
  //     getCustomers: getCustomersTool,
  //     createCustomer: createCustomerTool,
  //     updateCustomer: updateCustomerTool,
  //     profitabilityAnalysis: customerProfitabilityTool,
  //   },
  maxTurns: 5,
});
