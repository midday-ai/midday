import { openai } from "@ai-sdk/openai";
import {
  COMMON_AGENT_RULES,
  createAgent,
  formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getBalanceSheetTool } from "@api/ai/tools/get-balance-sheet";
import { getBurnRateTool } from "@api/ai/tools/get-burn-rate";
import { getCashFlowTool } from "@api/ai/tools/get-cash-flow";
import { getExpensesTool } from "@api/ai/tools/get-expenses";
import { getForecastTool } from "@api/ai/tools/get-forecast";
import { getInvoicePaymentAnalysisTool } from "@api/ai/tools/get-invoice-payment-analysis";
import { getProfitAnalysisTool } from "@api/ai/tools/get-profit-analysis";
import { getRevenueSummaryTool } from "@api/ai/tools/get-revenue-summary";
import { getRunwayTool } from "@api/ai/tools/get-runway";
import { getSpendingTool } from "@api/ai/tools/get-spending";
import { getTaxSummaryTool } from "@api/ai/tools/get-tax-summary";

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
- For "spending", "spending patterns", "spending analysis", "show spending" requests, use the getSpending tool
- For "show spending this month" or similar requests with "show", use getSpending with showCanvas: true
- For "burn rate", "burn rate analysis" requests, use the getBurnRate tool
- For "show burn rate", "burn rate visual analytics", "visual burn rate" or similar requests with "show"/"visual", use getBurnRate with showCanvas: true
- For "invoice payment", "payment analysis", "how quickly do customers pay", "average days to pay", "overdue invoices" requests, use the getInvoicePaymentAnalysis tool
- For "show invoice payment analysis" or similar requests with "show"/"visual", use getInvoicePaymentAnalysis with showCanvas: true
- For "forecast", "revenue forecast", "projection", "revenue projection" requests, use the getForecast tool
- For ANY request containing "show" or "show me" (e.g., "show forecast", "show me forecast", "show me my revenue forecast", "show revenue forecast"), ALWAYS use getForecast with showCanvas: true to display the visual canvas
- For "forecast visual", "revenue forecast visual" or similar requests with "visual", use getForecast with showCanvas: true
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
    getSpending: getSpendingTool,
    getBalanceSheet: getBalanceSheetTool,
    getExpenses: getExpensesTool,
    getTaxSummary: getTaxSummaryTool,
    getBurnRate: getBurnRateTool,
    getInvoicePaymentAnalysis: getInvoicePaymentAnalysisTool,
    getForecast: getForecastTool,
  },
  maxTurns: 5,
});
