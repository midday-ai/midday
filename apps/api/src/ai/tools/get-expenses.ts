import type { ToolContext } from "@api/ai/context";
import { getExpenses, getSpending, getTransactions } from "@db/queries";
import { logger } from "@midday/logger";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  createCanvasData,
  createDashboardLayout,
  createMetricCard,
  createSummary,
  createTableColumn,
  createTableConfig,
  createTableRow,
} from "./canvas-types";
import { toolMetadata } from "./registry";

export const getExpensesTool = ({ db, user, writer }: ToolContext) =>
  tool({
    ...toolMetadata.getExpenses,
    async *execute({ from, to, currency, showCanvas }) {
      try {
        logger.info("Executing getExpensesTool", {
          from,
          to,
          currency,
          showCanvas,
        });

        // Use provided dates or defaults
        const fromDate = startOfMonth(new Date(from));
        const toDate = endOfMonth(new Date(to));
        const teamCurrency = currency || user.baseCurrency || "USD";
        const period = `${format(fromDate, "MMM yyyy")} - ${format(toDate, "MMM yyyy")}`;
        const title = `Expense Analysis (${period})`;

        // Send canvas with loading state only if showCanvas is true
        if (showCanvas) {
          writer.write({
            type: "data-canvas",
            data: {
              title,
              loading: true,
            },
          });
        }

        yield {
          content:
            "Okay — pulling this month's spending and largest transactions.",
        };

        // Get detailed transaction data for the biggest expenses
        const biggestTransactions = await getTransactions(db, {
          teamId: user.teamId,
          start: from,
          end: to,
          type: "expense",
          pageSize: 10,
          sort: ["amount", "asc"], // ASC because expenses are negative, so most negative = largest expense
        });

        yield {
          content: "Categorizing vendors and computing category shares.",
        };

        // Get expense breakdown by categories
        const spendingData = await getSpending(db, {
          teamId: user.teamId,
          from,
          to,
          currency: teamCurrency,
        });

        // Get monthly expenses data
        const expensesData = await getExpenses(db, {
          teamId: user.teamId,
          from,
          to,
          currency: teamCurrency,
        });

        yield {
          content: "Calculating totals and highlighting biggest drivers.",
        };

        // Calculate total spending
        const totalSpending = spendingData.reduce(
          (sum, item) => sum + item.amount,
          0,
        );

        // Find top category
        const topCategory =
          spendingData.length > 0
            ? spendingData.reduce((max, current) =>
                current.amount > max.amount ? current : max,
              )
            : null;

        yield {
          content:
            "Done. Here are the key numbers and the biggest transactions.",
        };

        // Create metric cards
        const cards = [
          createMetricCard("Total Spending", totalSpending, teamCurrency, {
            id: "total-spending",
            subtitle: `Across ${biggestTransactions.data?.length || 0} high-value transactions`,
          }),
          ...(topCategory
            ? [
                createMetricCard(
                  "Top Category",
                  topCategory.amount,
                  teamCurrency,
                  {
                    id: "top-category",
                    subtitle: `${topCategory.name} — ${formatAmount({ amount: topCategory.amount, currency: teamCurrency })}`,
                  },
                ),
              ]
            : []),
        ];

        // Analyze spending patterns for data-driven insights
        const topCategories = spendingData
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        const largestTransactions = biggestTransactions.data?.slice(0, 6) || [];

        // Calculate category concentration
        const topCategoryPercentage =
          topCategory && totalSpending > 0
            ? (topCategory.amount / totalSpending) * 100
            : 0;

        // Calculate dynamic threshold for high-value vendors (top 10% of average spending)
        const avgTransactionAmount =
          totalSpending / (largestTransactions.length || 1);
        const highValueThreshold = Math.max(
          avgTransactionAmount * 1.5,
          totalSpending * 0.05,
        );
        const highValueVendors = largestTransactions.filter(
          (tx) => Math.abs(tx.amount) > highValueThreshold,
        );

        // Identify recurring vs one-time patterns
        const recurringTransactions = largestTransactions.filter(
          (tx) => tx.recurring,
        );
        const recurringPercentage =
          largestTransactions.length > 0
            ? (recurringTransactions.length / largestTransactions.length) * 100
            : 0;

        // Pass raw data to LLM for analysis - no hardcoded recommendations

        // Create data-driven summary
        const topCategoriesText =
          topCategories.length > 1 && topCategories[0] && topCategories[1]
            ? `${topCategories[0].name} (${formatAmount({ amount: topCategories[0].amount, currency: teamCurrency })}) and ${topCategories[1].name} (${formatAmount({ amount: topCategories[1].amount, currency: teamCurrency })})`
            : topCategory?.name || "various categories";

        const concentrationPercentage =
          topCategories.length > 1 && topCategories[0] && topCategories[1]
            ? (
                ((topCategories[0].amount + topCategories[1].amount) /
                  totalSpending) *
                100
              ).toFixed(0)
            : topCategoryPercentage.toFixed(0);

        const summaryDescription = `Your spending shows a clear concentration in ${topCategoriesText}, representing ${concentrationPercentage}% of total expenses. ${
          highValueVendors.length > 0
            ? `${highValueVendors.length} vendors account for high-value transactions above $500.`
            : "Most expenses are distributed across smaller vendors."
        } ${
          recurringPercentage > 50
            ? "The majority of large expenses are recurring subscriptions."
            : recurringPercentage > 0
              ? `${recurringPercentage.toFixed(0)}% of large expenses are recurring subscriptions.`
              : "Most expenses appear to be one-time transactions."
        }`;

        const summary = createSummary(
          "Summary & Recommendations",
          summaryDescription,
        );

        // Create transaction table configuration
        const tableColumns = [
          createTableColumn("date", "Date", "date", {
            width: "w-20",
            format: { dateFormat: "MMM dd" },
          }),
          createTableColumn("vendor", "Vendor", "text", {
            width: "flex-1",
          }),
          createTableColumn("category", "Category", "text", {
            width: "w-32",
          }),
          createTableColumn("amount", "Amount", "currency", {
            align: "right",
            width: "w-24",
            format: { currency: teamCurrency, decimals: 2 },
          }),
          createTableColumn("share", "Share", "percentage", {
            align: "right",
            width: "w-16",
            format: { decimals: 1 },
          }),
        ];

        const tableRows = largestTransactions.slice(0, 6).map((tx) => {
          const share =
            totalSpending > 0 ? (Math.abs(tx.amount) / totalSpending) * 100 : 0;
          return createTableRow(
            tx.id,
            {
              date: format(new Date(tx.date), "MMM dd"),
              vendor: tx.name || "Unknown",
              category: tx.category?.name || "Uncategorized",
              amount: Math.abs(tx.amount),
              share: Number(share.toFixed(1)),
            },
            {
              recurring: tx.recurring,
              originalAmount: tx.amount,
              categorySlug: tx.category?.slug,
            },
          );
        });

        const transactionTable = createTableConfig(
          "Biggest Transactions",
          tableColumns,
          tableRows,
          {
            id: "expense-transactions-table",
            metadata: {
              totalTransactions: largestTransactions.length,
              period: period,
            },
          },
        );

        // Create dashboard layout with table instead of chart
        const dashboard = createDashboardLayout(title, cards, summary, {
          id: "expense-dashboard",
          columns: 2,
          table: transactionTable,
        });

        // Create the complete canvas data
        const canvasData = createCanvasData(
          "dashboard",
          title,
          totalSpending,
          teamCurrency,
          dashboard,
          [], // No chart data, using table instead
          from,
          to,
          {
            description:
              "Comprehensive expense analysis with transaction breakdown",
            average: totalSpending / (largestTransactions.length || 1),
          },
        );

        // Send completion with canvas data only if showCanvas is true
        if (showCanvas) {
          writer.write({
            type: "data-canvas",
            data: {
              canvasData: canvasData,
              loading: false,
            },
          });
        }

        // Create detailed response for LLM to analyze
        const detailedContent = [
          `**${title}**`,
          "",
          summaryDescription,
          "",
          "**Key Metrics:**",
          `• Total spending: ${formatAmount({ amount: totalSpending, currency: teamCurrency })}`,
          `• Top category: ${topCategory?.name || "N/A"} (${topCategoryPercentage.toFixed(1)}% of spending)`,
          `• High-value transactions: ${highValueVendors.length} above ${formatAmount({ amount: highValueThreshold, currency: teamCurrency })}`,
          `• Recurring transactions: ${recurringPercentage.toFixed(0)}% of analyzed transactions`,
          "",
          "**Top Categories:**",
          ...topCategories.slice(0, 5).map((cat, index) => {
            const percentage = ((cat.amount / totalSpending) * 100).toFixed(1);
            return `${index + 1}. ${cat.name}: ${formatAmount({ amount: cat.amount, currency: teamCurrency })} (${percentage}%)`;
          }),
          "",
          `*Analysis based on ${largestTransactions.length} largest transactions from ${format(fromDate, "MMM yyyy")} to ${format(toDate, "MMM yyyy")}*`,
        ];

        yield {
          content: detailedContent.join("\n"),
        };
      } catch (error) {
        console.error(error);
        logger.error("Error in getExpensesTool", {
          error: error instanceof Error ? error.message : "Unknown error",
          teamId: user.teamId,
          from,
          to,
          currency,
        });

        yield {
          content:
            "I encountered an error while analyzing your expense data. Please try again or contact support if the issue persists.",
        };
      }
    },
  });
