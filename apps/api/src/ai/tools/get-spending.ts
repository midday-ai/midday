import { openai } from "@ai-sdk/openai";
import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { spendingArtifact } from "@api/ai/artifacts/spending";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import {
  getSpending,
  getSpendingForPeriod,
  getTransactions,
} from "@midday/db/queries";
import { formatAmount, formatDate } from "@midday/utils/format";
import { generateText, tool } from "ai";
import { endOfMonth, parseISO, startOfMonth } from "date-fns";
import { z } from "zod";

const getSpendingSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
  showCanvas: z.boolean().default(false).describe("Show visual canvas"),
});

export const getSpendingTool = tool({
  description:
    "Analyze spending patterns - totals, top transactions, category breakdown.",
  inputSchema: getSpendingSchema,
  execute: async function* (
    { period, from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve spending data: Team ID not found in context.",
      };
      return {
        totalSpending: 0,
        currency: currency || appContext.baseCurrency || "USD",
        currentMonthSpending: 0,
        averageMonthlySpending: 0,
        topCategory: null,
        transactions: [],
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      // Resolve parameters with proper priority:
      // 1. Forced params from widget click (if this tool was triggered by widget)
      // 2. Explicit AI params (user override)
      // 3. Dashboard metricsFilter (source of truth)
      // 4. Hardcoded defaults
      const resolved = resolveToolParams({
        toolName: "getSpending",
        appContext,
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof spendingArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = spendingArtifact.stream(
          {
            stage: "loading",
            currency: finalCurrency || "USD",
            from: finalFrom,
            to: finalTo,
            description,
          },
          writer,
        );
      }

      const targetCurrency = finalCurrency || "USD";
      const locale = appContext.locale || "en-US";

      // Fetch spending data
      const spendingCategories = await getSpending(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: finalCurrency ?? undefined,
      });

      const periodSummary = await getSpendingForPeriod(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: finalCurrency ?? undefined,
      });

      // Fetch transactions (we'll sort by absolute amount after fetching)
      const transactionsResult = await getTransactions(db, {
        teamId,
        type: "expense",
        start: finalFrom,
        end: finalTo,
        sort: ["amount", "asc"], // Ascending because expenses are negative, so smallest (most negative) = largest expense
        pageSize: 10,
      });

      const totalSpending = periodSummary.totalSpending;
      const topCategory = periodSummary.topCategory;

      // Format transactions, calculate share percentages, and sort by absolute amount descending
      const formattedTransactions = transactionsResult.data
        .map((transaction) => {
          const amount = Math.abs(transaction.amount);
          const share = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;

          return {
            id: transaction.id,
            date: formatDate(transaction.date),
            vendor: transaction.name,
            category: transaction.category?.name || "Uncategorized",
            amount,
            share: Math.round(share * 10) / 10, // Round to 1 decimal place
          };
        })
        .sort((a, b) => b.amount - a.amount) // Sort descending by absolute amount
        .slice(0, 10); // Take top 10

      // Calculate average monthly spending
      const fromDate = parseISO(finalFrom);
      const toDate = parseISO(finalTo);
      const monthsDiff =
        (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
        (toDate.getMonth() - fromDate.getMonth()) +
        1;
      const averageMonthlySpending =
        monthsDiff > 0 ? totalSpending / monthsDiff : totalSpending;

      // Get current month spending
      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());
      const currentMonthSummary = await getSpendingForPeriod(db, {
        teamId,
        from: currentMonthStart.toISOString(),
        to: currentMonthEnd.toISOString(),
        currency: finalCurrency ?? undefined,
      });
      const currentMonthSpending = currentMonthSummary.totalSpending;

      // Update artifact with metrics
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          metrics: {
            totalSpending,
            averageMonthlySpending,
            currentMonthSpending,
            topCategory: topCategory
              ? {
                  name: topCategory.name,
                  amount: topCategory.amount,
                  percentage: topCategory.percentage,
                }
              : undefined,
          },
          transactions: formattedTransactions,
        });
      }

      // Generate AI summary and recommendations
      const categoryBreakdown = spendingCategories
        .slice(0, 5)
        .map(
          (cat) =>
            `${cat.name}: ${formatAmount({
              amount: cat.amount,
              currency: targetCurrency,
              locale,
            })} (${cat.percentage.toFixed(1)}%)`,
        )
        .join(", ");

      const topTransactionsText = formattedTransactions
        .slice(0, 5)
        .map(
          (t) =>
            `${t.vendor} (${t.category}): ${formatAmount({
              amount: t.amount,
              currency: targetCurrency,
              locale,
            })} - ${t.share.toFixed(1)}%`,
        )
        .join("\n");

      const analysisResult = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "user",
            content: `Analyze this spending data for ${appContext.companyName || "the business"}:

Total Spending: ${formatAmount({
              amount: totalSpending,
              currency: targetCurrency,
              locale,
            })}
Current Month Spending: ${formatAmount({
              amount: currentMonthSpending,
              currency: targetCurrency,
              locale,
            })}
Average Monthly Spending: ${formatAmount({
              amount: averageMonthlySpending,
              currency: targetCurrency,
              locale,
            })}
Top Category: ${topCategory?.name || "N/A"} - ${topCategory?.percentage.toFixed(1) || 0}% of total

Top Spending Categories:
${categoryBreakdown}

Top 5 Largest Transactions:
${topTransactionsText}

Provide a concise analysis (2-3 sentences) of the key spending patterns and trends, followed by 2-3 actionable recommendations for cost optimization. Write it as natural, flowing text.`,
          },
        ],
      });

      // Use the AI response as the summary text
      const summaryText =
        analysisResult.text.trim() ||
        `Total spending of ${formatAmount({
          amount: totalSpending,
          currency: targetCurrency,
          locale,
        })} with ${topCategory?.name || "various categories"} representing the largest share.`;

      // Update artifact with analysis
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          metrics: {
            totalSpending,
            averageMonthlySpending,
            currentMonthSpending,
            topCategory: topCategory
              ? {
                  name: topCategory.name,
                  amount: topCategory.amount,
                  percentage: topCategory.percentage,
                }
              : undefined,
          },
          transactions: formattedTransactions,
          analysis: {
            summary: summaryText,
            recommendations: [],
          },
        });
      }

      // Format text response
      const formattedTotalSpending = formatAmount({
        amount: totalSpending,
        currency: targetCurrency,
        locale,
      });

      let responseText_output = `**Total Spending:** ${formattedTotalSpending}\n\n`;

      if (topCategory) {
        responseText_output += `**Top Category:** ${topCategory.name} - ${formatAmount(
          {
            amount: topCategory.amount,
            currency: targetCurrency,
            locale,
          },
        )} (${topCategory.percentage.toFixed(1)}% of total)\n\n`;
      }

      // Only show detailed transaction table, summary, and recommendations if canvas is not shown
      if (!showCanvas) {
        if (formattedTransactions.length > 0) {
          responseText_output += `**Top ${formattedTransactions.length} Largest Transactions:**\n\n`;
          responseText_output +=
            "| Date | Vendor | Category | Amount | Share |\n";
          responseText_output +=
            "|------|--------|----------|--------|------|\n";

          for (const transaction of formattedTransactions) {
            const formattedAmount = formatAmount({
              amount: transaction.amount,
              currency: targetCurrency,
              locale,
            });
            responseText_output += `| ${transaction.date} | ${transaction.vendor} | ${transaction.category} | ${formattedAmount} | ${transaction.share.toFixed(1)}% |\n`;
          }
          responseText_output += "\n";
        }

        responseText_output += `**Summary & Recommendations:**\n\n${summaryText}\n\n`;
      } else {
        // When canvas is shown, just mention that detailed analysis is available
        responseText_output +=
          "\n\nA detailed visual spending analysis with transaction details, charts, and insights is available.";
      }

      yield { text: responseText_output };

      return {
        totalSpending,
        currency: targetCurrency,
        currentMonthSpending,
        averageMonthlySpending,
        topCategory: topCategory
          ? {
              name: topCategory.name,
              amount: topCategory.amount,
              percentage: topCategory.percentage,
            }
          : null,
        transactions: formattedTransactions,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve spending data: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalSpending: 0,
        currency: currency || appContext.baseCurrency || "USD",
        currentMonthSpending: 0,
        averageMonthlySpending: 0,
        topCategory: null,
        transactions: [],
      };
    }
  },
});
