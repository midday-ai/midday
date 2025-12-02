import type { AppContext } from "@api/ai/agents/config/shared";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getTransactions } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getTransactionsSchema = z.object({
  cursor: z.string().nullable().optional().describe("Pagination cursor"),
  sort: z
    .array(z.string())
    .length(2)
    .nullable()
    .optional()
    .describe("Sort order ([field, direction], e.g. ['date', 'desc'])"),
  pageSize: z.number().min(1).max(100).default(10).describe("Page size"),
  q: z.string().nullable().optional().describe("Search query"),
  start: z.string().nullable().optional().describe("Start date (ISO 8601)"),
  end: z.string().nullable().optional().describe("End date (ISO 8601)"),
  statuses: z
    .array(z.enum(["pending", "completed", "archived", "posted", "excluded"]))
    .nullable()
    .optional()
    .describe("Status filter"),
  categories: z
    .array(z.string())
    .nullable()
    .optional()
    .describe("Category slugs"),
  tags: z.array(z.string()).nullable().optional().describe("Tag IDs"),
  accounts: z
    .array(z.string())
    .nullable()
    .optional()
    .describe("Bank account IDs"),
  assignees: z.array(z.string()).nullable().optional().describe("User IDs"),
  type: z
    .enum(["income", "expense"])
    .nullable()
    .optional()
    .describe("Transaction type"),
  recurring: z
    .array(z.enum(["weekly", "monthly", "annually", "irregular", "all"]))
    .nullable()
    .optional()
    .describe("Recurring frequency"),
  amountRange: z
    .array(z.number())
    .length(2)
    .nullable()
    .optional()
    .describe("Amount range ([min, max] as numbers)"),
  amount: z
    .array(z.string())
    .nullable()
    .optional()
    .describe("Specific amounts"),
  currency: z
    .string()
    .nullable()
    .optional()
    .describe("Currency code (ISO 4217, e.g. 'USD')"),
  attachments: z
    .enum(["include", "exclude"])
    .nullable()
    .optional()
    .describe("Attachment filter"),
  manual: z
    .enum(["include", "exclude"])
    .nullable()
    .optional()
    .describe("Manual transaction filter"),
});

export const getTransactionsTool = tool({
  description:
    "Retrieve financial transactions with filtering, search, and sorting.",
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

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
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
        amountRange:
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
