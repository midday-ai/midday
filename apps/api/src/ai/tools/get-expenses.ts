import { openai } from "@ai-sdk/openai";
import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { expensesArtifact } from "@api/ai/artifacts/expenses";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import { db } from "@midday/db/client";
import { getSpending, getSpendingForPeriod } from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { generateText, tool } from "ai";
import { parseISO } from "date-fns";
import { z } from "zod";

const getExpensesSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
  showCanvas: z.boolean().default(false).describe("Show visual canvas"),
});

export const getExpensesTool = tool({
  description:
    "Analyze expenses by category - totals grouped by category with trends.",
  inputSchema: getExpensesSchema,
  execute: async function* (
    { period, from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve expenses: Team ID not found in context.",
      };
      return {
        totalExpenses: 0,
        currency: currency || appContext.baseCurrency || "USD",
        categoryData: [],
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
        toolName: "getExpenses",
        appContext,
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;

      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof expensesArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = expensesArtifact.stream(
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

      // Fetch category spending data
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

      const totalExpenses = periodSummary.totalSpending;
      const topCategory = periodSummary.topCategory;

      // Transform category data to match artifact schema
      const categoryData = spendingCategories.map((cat) => ({
        category: cat.name,
        amount: cat.amount,
        percentage: cat.percentage,
        color: cat.color || undefined,
      }));

      // Calculate average monthly expenses
      const fromDate = parseISO(finalFrom);
      const toDate = parseISO(finalTo);
      const monthsDiff =
        (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
        (toDate.getMonth() - fromDate.getMonth()) +
        1;
      const averageMonthlyExpenses =
        monthsDiff > 0 ? totalExpenses / monthsDiff : totalExpenses;

      // Update artifact with chart data
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "chart_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          description,
          chart: {
            categoryData,
          },
        });

        // Update artifact with metrics
        await analysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          chart: {
            categoryData,
          },
          metrics: {
            totalExpenses,
            averageMonthlyExpenses,
            topCategory: topCategory
              ? {
                  name: topCategory.name,
                  amount: topCategory.amount,
                  percentage: topCategory.percentage,
                }
              : undefined,
          },
        });
      }

      // Generate AI summary focused on category breakdown
      const categoryBreakdown = spendingCategories
        .slice(0, 10)
        .map(
          (cat) =>
            `${cat.name}: ${formatAmount({
              amount: cat.amount,
              currency: targetCurrency,
              locale,
            })} (${cat.percentage.toFixed(1)}%)`,
        )
        .join("\n");

      const analysisResult = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "user",
            content: `Analyze this expense breakdown by category for ${appContext.companyName || "the business"}:

Total Expenses: ${formatAmount({
              amount: totalExpenses,
              currency: targetCurrency,
              locale,
            })}
Average Monthly Expenses: ${formatAmount({
              amount: averageMonthlyExpenses,
              currency: targetCurrency,
              locale,
            })}
Top Category: ${topCategory?.name || "N/A"} - ${topCategory?.percentage.toFixed(1) || 0}% of total

Expense Categories (sorted by amount):
${categoryBreakdown}

Provide a concise analysis (2-3 sentences) of the key expense patterns by category, highlighting which categories dominate spending and any notable trends. Write it as natural, flowing text.`,
          },
        ],
      });

      // Use the AI response as the summary text
      const summaryText =
        analysisResult.text.trim() ||
        `Total expenses of ${formatAmount({
          amount: totalExpenses,
          currency: targetCurrency,
          locale,
        })} with ${topCategory?.name || "various categories"} representing the largest share.`;

      // Update artifact with analysis
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: targetCurrency,
          chart: {
            categoryData,
          },
          metrics: {
            totalExpenses,
            averageMonthlyExpenses,
            topCategory: topCategory
              ? {
                  name: topCategory.name,
                  amount: topCategory.amount,
                  percentage: topCategory.percentage,
                }
              : undefined,
          },
          analysis: {
            summary: summaryText,
            recommendations: [],
          },
        });
      }

      // Format text response
      const formattedTotalExpenses = formatAmount({
        amount: totalExpenses,
        currency: targetCurrency,
        locale,
      });

      let responseText_output = `**Total Expenses:** ${formattedTotalExpenses}\n\n`;

      if (topCategory) {
        responseText_output += `**Top Category:** ${topCategory.name} - ${formatAmount(
          {
            amount: topCategory.amount,
            currency: targetCurrency,
            locale,
          },
        )} (${topCategory.percentage.toFixed(1)}% of total)\n\n`;
      }

      if (categoryData.length > 0) {
        responseText_output += "**Top Expense Categories:**\n\n";
        for (const cat of categoryData.slice(0, 5)) {
          responseText_output += `- ${cat.category}: ${formatAmount({
            amount: cat.amount,
            currency: targetCurrency,
            locale,
          })} (${cat.percentage.toFixed(1)}%)\n`;
        }
        responseText_output += "\n";
      }

      // Only show summary if canvas is not shown
      if (!showCanvas) {
        responseText_output += `**Summary:**\n\n${summaryText}\n\n`;
      } else {
        // When canvas is shown, just mention that detailed analysis is available
        responseText_output +=
          "\n\nA detailed visual expense breakdown by category with charts and insights is available.";
      }

      yield { text: responseText_output };

      return {
        totalExpenses,
        currency: targetCurrency,
        categoryData: categoryData.map((cat) => ({
          category: cat.category,
          amount: cat.amount,
          percentage: cat.percentage,
        })),
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve expenses: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        totalExpenses: 0,
        currency: currency || appContext.baseCurrency || "USD",
        categoryData: [],
      };
    }
  },
});
