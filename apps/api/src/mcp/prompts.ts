import { CATEGORIES } from "@midday/categories";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

function getCategorySlugs(): string[] {
  const slugs: string[] = [];
  for (const cat of CATEGORIES) {
    slugs.push(cat.slug);
    if ("children" in cat && Array.isArray(cat.children)) {
      for (const child of cat.children) {
        slugs.push(child.slug);
      }
    }
  }
  return slugs;
}

export function registerPrompts(server: McpServer): void {
  const categorySlugs = getCategorySlugs();

  // ==========================================
  // ANALYSIS PROMPTS
  // ==========================================

  server.registerPrompt(
    "financial_health_check",
    {
      title: "Financial Health Check",
      description:
        "Comprehensive analysis of the team's financial health including revenue, expenses, burn rate, and runway",
      argsSchema: {
        period: completable(
          z
            .enum(["month", "quarter", "year"])
            .optional()
            .describe("Time period to analyze (default: quarter)"),
          (value) =>
            (["month", "quarter", "year"] as const).filter((p) =>
              p.startsWith(value ?? ""),
            ),
        ),
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
7. Get invoice summary using invoices_summary

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
    "invoice_followup",
    {
      title: "Invoice Follow-up",
      description: "Generate a follow-up plan for overdue or unpaid invoices",
    },
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please analyze my invoices and help me follow up on payments:

1. Use invoices_list to get all invoices with status "overdue" or "unpaid"
2. For each overdue invoice, get details using invoices_get
3. Get customer information using customers_get for context

Then create a follow-up action plan:
- List overdue invoices sorted by amount (highest first)
- Include customer contact information
- Suggest follow-up actions based on how overdue each invoice is
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
        category: completable(
          z
            .string()
            .optional()
            .describe(
              "Specific category slug to analyze (optional — leave empty for all categories)",
            ),
          (value) => categorySlugs.filter((s) => s.startsWith(value ?? "")),
        ),
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
    "customer_insights",
    {
      title: "Customer Insights",
      description: "Analyze customer data to identify top customers and trends",
    },
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please analyze my customer base and provide insights:

1. Use customers_list to get all customers
2. Use invoices_list to understand revenue per customer
3. Cross-reference with transactions_list to see payment patterns

Provide analysis including:
- Top customers by revenue
- Customer concentration risk (% of revenue from top customers)
- Payment behavior patterns
- Customers with outstanding balances
- Opportunities for upselling or follow-up`,
            },
          },
        ],
      };
    },
  );

  // ==========================================
  // WORKFLOW PROMPTS
  // ==========================================

  server.registerPrompt(
    "cash_flow_forecast",
    {
      title: "Cash Flow Forecast",
      description:
        "Project future cash position using historical cash flow, revenue forecast, and burn rate data",
      argsSchema: {
        months: completable(
          z
            .enum(["3", "6", "12"])
            .optional()
            .describe("Number of months to forecast (default: 6)"),
          (value) =>
            (["3", "6", "12"] as const).filter((m) =>
              m.startsWith(value ?? ""),
            ),
        ),
      },
    },
    async (args) => {
      const months = args.months || "6";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please create a ${months}-month cash flow forecast:

1. Use team_get to get the base currency
2. Use reports_cash_flow to get historical income vs expenses
3. Use reports_revenue_forecast with forecastMonths=${months} for projected revenue
4. Use reports_burn_rate for spending trend
5. Use reports_runway for current runway estimate
6. Use bank_accounts_list to get current cash position

Then provide:
- Current cash position across all accounts
- Projected monthly cash inflows and outflows
- Expected cash balance at end of each month
- Key risks (e.g., large expected expenses, seasonal dips)
- Recommended actions if cash flow looks tight

Present as a month-by-month table with a summary.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "monthly_close_checklist",
    {
      title: "Monthly Close Checklist",
      description:
        "Guide month-end close: check unreconciled transactions, outstanding invoices, missing receipts, and expense categorization",
    },
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please help me complete the month-end close process:

1. Use transactions_list with statuses such as "in_review", "blank", or "receipt_match" (list filter statuses) to find transactions still in the review pipeline
2. Use invoices_list with status "unpaid" or "overdue" to find outstanding invoices
3. Use inbox_list with status "pending" to find unprocessed receipts
4. Use transactions_list for the month's expenses and identify rows missing a category in the results
5. Use reports_revenue and reports_expenses for the current month to get totals

Then create a checklist:
- [ ] Unreconciled transactions — list count and total amount
- [ ] Uncategorized transactions — list count with suggestions
- [ ] Outstanding invoices — list with amounts and days overdue
- [ ] Unprocessed inbox items — count and recommended action
- [ ] Revenue summary for the month
- [ ] Expense summary for the month
- [ ] Any anomalies or items needing attention

Format as an actionable checklist with specific items to resolve.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "tax_preparation",
    {
      title: "Tax Preparation",
      description:
        "Assemble tax-relevant data: tax summary, deductible expenses, invoice totals by quarter, and missing documentation",
      argsSchema: {
        year: z
          .string()
          .optional()
          .describe(
            "Tax year to prepare for (default: current year, e.g. 2025)",
          ),
      },
    },
    async (args) => {
      const year = args.year || new Date().getFullYear().toString();

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please help me prepare tax data for ${year}:

1. Use team_get to get the base currency and locale
2. Use reports_tax_summary with from="${year}-01-01" and to="${year}-12-31" for tax paid
3. Use reports_tax_summary with type "collected" and the same date range for tax collected
4. Use reports_revenue with from="${year}-01-01" to="${year}-12-31" for annual revenue
5. Use reports_expenses for annual expenses
6. Use reports_spending for category breakdown (to identify deductible expenses)
7. Use invoices_summary for invoice totals
8. Use reports_recurring_expenses to identify regular deductible costs

Then provide:
- Total revenue for the year
- Total expenses (with deductible vs non-deductible breakdown)
- Tax paid and tax collected summaries
- Quarterly revenue and expense breakdown
- List of potentially deductible expense categories with amounts
- Missing documentation or receipts that should be gathered
- Key tax-relevant items to discuss with an accountant`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "project_profitability",
    {
      title: "Project Profitability",
      description:
        "Analyze time tracking vs revenue per project to determine which projects are most profitable",
    },
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please analyze project profitability:

1. Use tracker_projects_list to get all projects with their billable rates and estimates
2. Use tracker_entries_list with a wide date range to get time entries per project
3. Use customers_list and invoices_list to match projects to invoice revenue
4. Use team_members to understand resource allocation

Then provide:
- Per-project breakdown: total hours tracked, billable rate, estimated revenue, actual invoiced revenue
- Effective hourly rate per project (invoiced amount / hours worked)
- Projects exceeding their hour estimates
- Projects with tracked time but no invoiced revenue
- Most and least profitable projects ranked
- Recommendations for improving project profitability (rate adjustments, scope management, etc.)

Present as a table with key metrics per project.`,
            },
          },
        ],
      };
    },
  );
}
