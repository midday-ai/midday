import { getTransactions } from "@db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatAmount, formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { getContext } from "../context";
import { getTransactionsSchema } from "./schema";

export const getTransactionsTool = tool({
  description:
    "Retrieve and analyze financial transactions with advanced filtering, search, and sorting capabilities. Use this tool when users ask about specific transactions, want to see recent activity, search for particular payments, or need transaction data for analysis.",
  inputSchema: getTransactionsSchema,
  execute: async function* ({
    cursor,
    sort,
    pageSize = 10,
    q,
    statuses,
    attachments,
    categories,
    tags,
    accounts,
    assignees,
    type,
    start,
    end,
    recurring,
    amountRange,
    amount,
    currency,
  }) {
    try {
      const context = getContext();

      // Prepare parameters for the database query
      const params = {
        teamId: context.user.teamId,
        cursor: cursor ?? null,
        sort: sort ?? null,
        pageSize,
        q: q ?? null,
        statuses: statuses ?? null,
        attachments: attachments ?? null,
        categories: categories ?? null,
        tags: tags ?? null,
        accounts: accounts ?? null,
        assignees: assignees ?? null,
        type: type ?? null,
        start: start ?? null,
        end: end ?? null,
        recurring: recurring ?? null,
        amount_range:
          amountRange?.filter((val): val is number => val !== null) ?? null,
        amount: amount ?? null,
      };

      // Get transactions from database
      const result = await getTransactions(context.db, params);

      // Early return if no data
      if (result.data.length === 0) {
        yield { text: "No transactions found matching your criteria." };
      }

      // Get the target currency for display
      const targetCurrency = currency ?? context.user.baseCurrency ?? "USD";

      // Format transactions for markdown display
      const formattedTransactions = result.data.map((transaction) => {
        const formattedAmount = formatAmount({
          amount: transaction.amount,
          currency: transaction.currency || targetCurrency,
          locale: context.user.locale ?? undefined,
        });

        return {
          id: transaction.id,
          name: transaction.name,
          amount: formattedAmount,
          date: formatDate(transaction.date),
          category: transaction.category?.name || "Uncategorized",
        };
      });

      // Calculate summary statistics
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
        locale: context.user.locale ?? undefined,
      });

      const formattedIncomeAmount = formatAmount({
        amount: incomeAmount,
        currency: targetCurrency,
        locale: context.user.locale ?? undefined,
      });

      const formattedExpenseAmount = formatAmount({
        amount: expenseAmount,
        currency: targetCurrency,
        locale: context.user.locale ?? undefined,
      });

      // Table format
      const response = `**${result.data.length} transactions** | Net: ${formattedTotalAmount} | Income: ${formattedIncomeAmount} | Expenses: ${formattedExpenseAmount}

| Date | Name | Amount | Category |
|------|------|--------|--------|
${formattedTransactions
  .map((tx) => `| ${tx.date} | ${tx.name} | ${tx.amount} | ${tx.category} |`)
  .join("\n")}`;

      // Return the data with link
      yield {
        text: response,
        link: {
          text: "View all transactions",
          url: `${getAppUrl()}/transactions}`,
        },
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
});
