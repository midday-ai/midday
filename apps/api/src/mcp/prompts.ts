import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "financial_health_check",
    {
      title: "Financial Health Check",
      description:
        "Comprehensive analysis of the team's financial health including revenue, expenses, burn rate, and runway",
      argsSchema: {
        period: z
          .enum(["month", "quarter", "year"])
          .optional()
          .describe("Time period to analyze (default: quarter)"),
      },
    },
    async (args) => {
      const period = args.period || "quarter";
      const periodText =
        period === "month"
          ? "this month"
          : period === "quarter"
            ? "this quarter"
            : "this year";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please perform a comprehensive financial health check for ${periodText}. Use the following tools to gather data:

1. First, get the team info using team_get to understand the base currency
2. Get revenue data using reports_revenue
3. Get profit data using reports_profit  
4. Get burn rate using reports_burn_rate
5. Get runway using reports_runway
6. Get spending breakdown using reports_spending
7. Get deal summary using deals_summary

Then provide a clear analysis including:
- Revenue trends and growth
- Profitability assessment
- Cash burn analysis
- Runway projection
- Top spending categories
- Actionable recommendations

Format the analysis in a clear, executive-summary style.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "deal_followup",
    {
      title: "Deal Follow-up",
      description: "Generate a follow-up plan for overdue or unpaid deals",
    },
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please analyze my deals and help me follow up on payments:

1. Use deals_list to get all deals with status "overdue" or "unpaid"
2. For each overdue deal, get details using deals_get
3. Get merchant information using merchants_get for context

Then create a follow-up action plan:
- List overdue deals sorted by amount (highest first)
- Include merchant contact information
- Suggest follow-up actions based on how overdue each deal is
- Draft polite but firm reminder messages for each situation`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "expense_analysis",
    {
      title: "Expense Analysis",
      description:
        "Deep dive into expenses to identify cost-saving opportunities",
      argsSchema: {
        category: z
          .string()
          .optional()
          .describe("Specific category to analyze (optional)"),
      },
    },
    async (args) => {
      const categoryFilter = args.category
        ? `Focus specifically on the "${args.category}" category.`
        : "Analyze all expense categories.";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please perform a detailed expense analysis. ${categoryFilter}

1. Use reports_spending to get category breakdown
2. Use reports_expenses to understand recurring vs one-time expenses
3. Use transactions_list filtered by type "expense" to see individual transactions

Provide insights on:
- Top expense categories and their trends
- Recurring expenses that could be optimized
- Unusual or unexpected expenses
- Comparison to typical patterns
- Specific cost-saving recommendations`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "merchant_insights",
    {
      title: "Merchant Insights",
      description: "Analyze merchant data to identify top merchants and trends",
    },
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please analyze my merchant base and provide insights:

1. Use merchants_list to get all merchants
2. Use deals_list to understand revenue per merchant
3. Cross-reference with transactions_list to see payment patterns

Provide analysis including:
- Top merchants by revenue
- Merchant concentration risk (% of revenue from top merchants)
- Payment behavior patterns
- Merchants with outstanding balances
- Opportunities for upselling or follow-up`,
            },
          },
        ],
      };
    },
  );
}
