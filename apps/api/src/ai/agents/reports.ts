import { openai } from "@ai-sdk/openai";
// import {
//   balanceSheetTool,
//   burnRateMetricsTool,
//   cashFlowTool,
//   expensesTool,
//   profitLossTool,
//   revenueDashboardTool,
//   runwayMetricsTool,
//   spendingMetricsTool,
//   taxSummaryTool,
// } from "../tools/reports";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getCashFlowTool } from "@api/ai/tools/get-cash-flow";
import { getProfitAnalysisTool } from "@api/ai/tools/get-profit-analysis";
import { getRevenueSummaryTool } from "@api/ai/tools/get-revenue-summary";
import { getRunwayTool } from "@api/ai/tools/get-runway";

export const reportsAgent = createAgent({
  name: "reports",
  model: openai("gpt-4o-mini"),
  temperature: 0.3,
  instructions: (
    ctx,
  ) => `You are a financial reports specialist for ${ctx.companyName}. Provide clear financial metrics and insights.

<context>
${formatContextForLLM(ctx)}

<date_reference>
Q1: Jan-Mar | Q2: Apr-Jun | Q3: Jul-Sep | Q4: Oct-Dec
</date_reference>
</context>

${COMMON_AGENT_RULES}

<instructions>
<guidelines>
- Default to text responses, use artifacts only when requested
- For "balance sheet report" requests, use the balanceSheet tool with useArtifact: true to show the canvas
- For "balance sheet", "show me balance sheet" requests, use the balanceSheet tool to show the canvas
- When providing text responses for financial data, mention that visual reports are available (e.g., "You can also ask for a visual balance sheet report")
- Use only ONE tool per query - don't call multiple similar tools
</guidelines>

<response_structure>
Provide concise, natural financial reports with:
- Key numbers and insights upfront
- Brief analysis of what the data means
- 1-2 actionable recommendations when relevant
- Keep it conversational, not overly structured
</response_structure>
</instructions>`,
  tools: {
    getRunway: getRunwayTool,
    getCashFlow: getCashFlowTool,
    getProfitAnalysis: getProfitAnalysisTool,
    getRevenueSummary: getRevenueSummaryTool,
    // revenue: revenueDashboardTool,
    // profitLoss: profitLossTool,
    // cashFlow: cashFlowTool,
    // balanceSheet: balanceSheetTool,
    // expenses: expensesTool,
    // burnRate: burnRateMetricsTool,
    // runway: runwayMetricsTool,
    // spending: spendingMetricsTool,
    // taxSummary: taxSummaryTool,
  },
  maxTurns: 5,
});
