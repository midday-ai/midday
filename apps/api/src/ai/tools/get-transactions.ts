import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getTransactions } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getTransactionsSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Pagination cursor from the previous page. Use the cursor value returned from a previous request to get the next page. Leave empty for first page.",
    ),
  sort: z
    .array(z.string())
    .length(2)
    .nullable()
    .optional()
    .describe(
      "Sort order as [field, direction]. Field can be 'date', 'amount', 'name', 'category', 'status', 'counterparty', 'assigned', 'bank_account', 'tags', or 'attachment'. Direction is 'asc' or 'desc'. Examples: ['date', 'desc'], ['amount', 'asc']",
    ),
  pageSize: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe(
      "Number of transactions to return per page. Minimum 1, maximum 100. Default is 10. Use smaller values (10-25) for quick overviews, larger (50-100) for comprehensive lists.",
    ),
  q: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Search query string. Searches across transaction names, descriptions, and amounts. Can search by amount if numeric. Example: 'office supplies' or '150.50'",
    ),
  start: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Start date for date range filter (inclusive). Use ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'. Example: '2024-01-01' or '2024-01-01T00:00:00.000Z'",
    ),
  end: z
    .string()
    .nullable()
    .optional()
    .describe(
      "End date for date range filter (inclusive). Use ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'. Example: '2024-12-31' or '2024-12-31T23:59:59.999Z'",
    ),
  statuses: z
    .array(z.enum(["pending", "completed", "archived", "posted", "excluded"]))
    .nullable()
    .optional()
    .describe(
      "Filter transactions by status. Use 'pending' for unprocessed, 'completed' for fulfilled, 'archived' for archived, 'posted' for confirmed, 'excluded' for excluded. Example: ['pending', 'posted']",
    ),
  categories: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by category slugs. Use category slugs like 'office-supplies', 'travel', 'income'. Example: ['office-supplies', 'travel']",
    ),
  tags: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by tag IDs. Provide array of tag UUIDs. Example: ['tag-uuid-1', 'tag-uuid-2']",
    ),
  accounts: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by bank account IDs. Provide array of account UUIDs. Example: ['account-uuid-1']",
    ),
  assignees: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by assigned user IDs. Provide array of user UUIDs. Example: ['user-uuid-1']",
    ),
  type: z
    .enum(["income", "expense"])
    .nullable()
    .optional()
    .describe(
      "Filter by transaction type. Use 'income' for money received, 'expense' for money spent.",
    ),
  recurring: z
    .array(z.enum(["weekly", "monthly", "annually", "irregular", "all"]))
    .nullable()
    .optional()
    .describe(
      "Filter by recurring frequency. Use 'weekly', 'monthly', 'annually', 'irregular', or 'all' for any recurring. Example: ['monthly']",
    ),
  amountRange: z
    .array(z.number())
    .length(2)
    .nullable()
    .optional()
    .describe(
      "Filter by amount range as [min, max]. Both values are numbers. Example: [100, 1000] filters transactions between $100 and $1000.",
    ),
  amount: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by specific amounts. Provide array of amount strings. Example: ['150.75', '299.99']",
    ),
  currency: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by currency code. Use ISO 4217 currency codes like 'USD', 'EUR', 'SEK'. Example: 'USD'",
    ),
  attachments: z
    .enum(["include", "exclude"])
    .nullable()
    .optional()
    .describe(
      "Filter by attachment presence. Use 'include' to show only transactions with attachments/receipts, 'exclude' to show only transactions without attachments.",
    ),
  manual: z
    .enum(["include", "exclude"])
    .nullable()
    .optional()
    .describe(
      "Filter by manual transactions. Use 'include' to show only manually created transactions, 'exclude' to show only bank-imported transactions.",
    ),
});

export const getTransactionsTool = tool({
  description:
    "Retrieve and analyze financial transactions with advanced filtering, search, and sorting capabilities. Use this tool when users ask about specific transactions, want to see recent activity, search for particular payments, or need transaction data for analysis.",
  inputSchema: getTransactionsSchema,
  execute: async function* (
    {
      cursor,
      sort,
      pageSize = 10,
      q,
      start,
      end,
      statuses,
      attachments,
      categories,
      tags,
      accounts,
      assignees,
      type,
      recurring,
      amountRange,
      amount,
      currency,
      manual,
    },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve transactions: Team ID not found in context.",
      };
      return;
    }

    try {
      const params = {
        teamId,
        cursor: cursor ?? null,
        sort: sort ?? null,
        pageSize,
        q: q ?? null,
        start: start ?? null,
        end: end ?? null,
        statuses: statuses ?? null,
        attachments: attachments ?? null,
        categories: categories ?? null,
        tags: tags ?? null,
        accounts: accounts ?? null,
        assignees: assignees ?? null,
        type: type ?? null,
        recurring: recurring ?? null,
        amount_range:
          amountRange?.filter((val): val is number => val !== null) ?? null,
        amount: amount ?? null,
        currency: currency ?? null,
        manual: manual ?? null,
      };

      const result = await getTransactions(db, params);

      if (result.data.length === 0) {
        yield { text: "No transactions found matching your criteria." };
        return;
      }

      const targetCurrency = currency ?? appContext.baseCurrency ?? "USD";
      const locale = appContext.locale ?? "en-US";

      const formattedTransactions = result.data.map((transaction) => {
        const formattedAmount = formatAmount({
          amount: transaction.amount,
          currency: transaction.currency || targetCurrency,
          locale,
        });

        return {
          id: transaction.id,
          name: transaction.name,
          amount: formattedAmount,
          date: formatDate(transaction.date),
          category: transaction.category?.name || "Uncategorized",
        };
      });

      const totalAmount = result.data.reduce((sum, t) => sum + t.amount, 0);
      const incomeAmount = result.data
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      const expenseAmount = Math.abs(
        result.data
          .filter((t) => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0),
      );

      const formattedTotalAmount = formatAmount({
        amount: totalAmount,
        currency: targetCurrency,
        locale,
      });

      const formattedIncomeAmount = formatAmount({
        amount: incomeAmount,
        currency: targetCurrency,
        locale,
      });

      const formattedExpenseAmount = formatAmount({
        amount: expenseAmount,
        currency: targetCurrency,
        locale,
      });

      const response = `| Date | Name | Amount | Category |\n|------|------|--------|----------|\n${formattedTransactions.map((tx) => `| ${tx.date} | ${tx.name} | ${tx.amount} | ${tx.category} |`).join("\n")}\n\n**${result.data.length} transactions** | Net: ${formattedTotalAmount} | Income: ${formattedIncomeAmount} | Expenses: ${formattedExpenseAmount}`;

      yield {
        text: response,
        link: {
          text: "View all transactions",
          url: `${getAppUrl()}/transactions`,
        },
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
