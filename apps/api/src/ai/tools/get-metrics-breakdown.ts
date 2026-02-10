import { openai } from "@ai-sdk/openai";
import { artifact, getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { metricsBreakdownSummaryArtifact } from "@api/ai/artifacts/metrics-breakdown";
import { generateArtifactDescription } from "@api/ai/utils/artifact-title";
import { resolveToolParams } from "@api/ai/utils/period-dates";
import { checkBankAccountsRequired } from "@api/ai/utils/tool-helpers";
import {
  CONTRA_REVENUE_CATEGORIES,
  REVENUE_CATEGORIES,
} from "@midday/categories";
import { db } from "@midday/db/client";
import {
  getReports,
  getSpending,
  getSpendingForPeriod,
  getTransactions,
} from "@midday/db/queries";
import { formatAmount } from "@midday/utils/format";
import { generateText, tool } from "ai";
import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  formatISO,
  isSameMonth,
  parseISO,
  startOfMonth,
} from "date-fns";
import { z } from "zod";
import { createMonthlyArtifactType } from "./metrics-breakdown-constants";

const getMetricsBreakdownSchema = z.object({
  period: z
    .enum(["3-months", "6-months", "this-year", "1-year", "2-years", "5-years"])
    .optional()
    .describe("Historical period"),
  from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
  to: z.string().optional().describe("End date (yyyy-MM-dd)"),
  currency: z.string().nullable().optional().describe("Currency code"),
  chartType: z
    .string()
    .optional()
    .describe("Type of chart that triggered this breakdown"),
  showCanvas: z.boolean().default(true).describe("Show visual analytics"),
});

/**
 * Split a date range into monthly periods
 * Returns an array of { from, to, monthKey } objects for each month in the range
 */
function splitDateRangeByMonth(
  from: string,
  to: string,
): Array<{ from: string; to: string; monthKey: string }> {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  const months = eachMonthOfInterval({ start: fromDate, end: toDate });

  return months.map((month) => ({
    from: formatISO(startOfMonth(month), { representation: "date" }),
    to: formatISO(endOfMonth(month), { representation: "date" }),
    monthKey: format(month, "yyyy-MM"),
  }));
}

/**
 * Check if a date range spans multiple months
 */
function spansMultipleMonths(from: string, to: string): boolean {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  return !isSameMonth(fromDate, toDate);
}

/**
 * Create a monthly breakdown artifact dynamically
 */
function createMonthlyBreakdownArtifact(monthKey: string) {
  const artifactType = createMonthlyArtifactType(monthKey);
  const baseBreakdownSchema = z.object({
    stage: z.enum([
      "loading",
      "chart_ready",
      "metrics_ready",
      "analysis_ready",
    ]),
    currency: z.string(),
    from: z.string().optional().describe("Start date (ISO 8601)"),
    to: z.string().optional().describe("End date (ISO 8601)"),
    displayDate: z
      .string()
      .optional()
      .describe(
        "Date for display purposes (ISO 8601, typically start of month for monthly breakdowns)",
      ),
    description: z
      .string()
      .optional()
      .describe("Generated description based on date range"),
    chartType: z
      .string()
      .optional()
      .describe("Type of chart that triggered this breakdown"),
  });

  const summaryMetricsSchema = z.object({
    revenue: z.number(),
    expenses: z.number(),
    profit: z.number(),
    transactionCount: z.number(),
  });

  const transactionSchema = z.object({
    id: z.string(),
    date: z.string(),
    name: z.string(),
    amount: z.number(),
    formattedAmount: z.string(),
    category: z.string(),
    type: z.enum(["income", "expense"]),
    vendor: z.string(),
    percentage: z.number(),
  });

  const categorySchema = z.object({
    name: z.string(),
    amount: z.number(),
    percentage: z.number(),
    transactionCount: z.number().optional(),
    color: z.string().optional(),
  });

  return artifact(
    artifactType,
    baseBreakdownSchema.extend({
      summary: summaryMetricsSchema.optional(),
      transactions: z.array(transactionSchema).optional(),
      categories: z.array(categorySchema).optional(),
      analysis: z
        .object({
          summary: z.string(),
          recommendations: z.array(z.string()),
        })
        .optional(),
    }),
  );
}

export const getMetricsBreakdownTool = tool({
  description:
    "Get a comprehensive breakdown of financial metrics for a specific period. Use this tool when the user requests a 'breakdown', 'break down', 'show me a breakdown', 'breakdown of', 'detailed breakdown', or 'comprehensive breakdown' of any financial metric (revenue, expenses, profit, burn rate, etc.). Provides revenue, expenses, profit, transactions, category breakdowns, and analysis. ALWAYS use this tool (not getBurnRate, getRevenueSummary, etc.) when 'breakdown' is mentioned in the request. " +
    "IMPORTANT: Use the 'period' parameter for standard time ranges.",
  inputSchema: getMetricsBreakdownSchema,
  execute: async function* (
    { period, from, to, currency, chartType, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve metrics breakdown: Team ID not found in context.",
      };
      return {
        summary: {
          revenue: 0,
          expenses: 0,
          profit: 0,
          transactionCount: 0,
        },
        transactions: [],
        categories: [],
        currency: currency || appContext.baseCurrency || "USD",
      };
    }

    const { shouldYield } = checkBankAccountsRequired(appContext);
    if (shouldYield) {
      throw new Error("BANK_ACCOUNT_REQUIRED");
    }

    try {
      const resolved = resolveToolParams({
        toolName: "getMetricsBreakdown",
        appContext,
        aiParams: { period, from, to, currency },
      });

      const finalFrom = resolved.from;
      const finalTo = resolved.to;
      const finalCurrency = resolved.currency;

      const targetCurrency = finalCurrency || "USD";
      const locale = appContext.locale || "en-US";

      // Check if period spans multiple months
      const shouldSplitByMonth =
        showCanvas && spansMultipleMonths(finalFrom, finalTo);

      if (shouldSplitByMonth) {
        // Split into monthly periods and create artifacts for each month
        const monthlyPeriods = splitDateRangeByMonth(finalFrom, finalTo);
        const writer = getWriter(executionOptions);
        const monthlyArtifacts: Array<{
          artifact: ReturnType<
            ReturnType<typeof createMonthlyBreakdownArtifact>["stream"]
          >;
          monthKey: string;
          from: string;
          to: string;
        }> = [];

        // Initialize artifacts for each month
        for (const period of monthlyPeriods) {
          const monthlyArtifactDef = createMonthlyBreakdownArtifact(
            period.monthKey,
          );
          const monthDescription = generateArtifactDescription(
            period.from,
            period.to,
          );
          const artifactStream = monthlyArtifactDef.stream(
            {
              stage: "loading" as const,
              currency: targetCurrency,
              from: period.from,
              to: period.to,
              displayDate: period.from, // Use start of month for display
              description: monthDescription,
              chartType: chartType || undefined,
            },
            writer,
          );
          monthlyArtifacts.push({
            artifact: artifactStream,
            monthKey: period.monthKey,
            from: period.from,
            to: period.to,
          });
        }

        // Track aggregated data across all months
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalProfit = 0;
        let totalTransactionCount = 0;
        const allMonthlyData: Array<{
          monthKey: string;
          monthLabel: string;
          revenue: number;
          expenses: number;
          profit: number;
          transactionCount: number;
          topCategories: Array<{
            name: string;
            amount: number;
            percentage: number;
          }>;
          topTransactions: Array<{
            name: string;
            amount: number;
            formattedAmount: string;
            category: string;
            percentage: number;
          }>;
        }> = [];

        // Process each month's data
        for (const {
          artifact: artifactStream,
          monthKey,
          from: monthFrom,
          to: monthTo,
        } of monthlyArtifacts) {
          // Fetch revenue data for this month
          const revenueResult = await getReports(db, {
            teamId,
            from: monthFrom,
            to: monthTo,
            currency: finalCurrency ?? undefined,
            type: "revenue",
            revenueType: "net",
          });

          // Fetch expenses data for this month
          const spendingCategories = await getSpending(db, {
            teamId,
            from: monthFrom,
            to: monthTo,
            currency: finalCurrency ?? undefined,
          });

          const periodSummary = await getSpendingForPeriod(db, {
            teamId,
            from: monthFrom,
            to: monthTo,
            currency: finalCurrency ?? undefined,
          });

          // Fetch profit data for this month
          const profitResult = await getReports(db, {
            teamId,
            from: monthFrom,
            to: monthTo,
            currency: finalCurrency ?? undefined,
            type: "profit",
            revenueType: "net",
          });

          // Calculate summary metrics
          const revenue = revenueResult.summary.currentTotal;
          const expenses = Math.abs(periodSummary.totalSpending);
          const profit = profitResult.summary.currentTotal;

          // Fetch all transactions for this month
          let allTransactions: any[] = [];
          let cursor: string | null = null;
          let hasMore = true;

          while (hasMore) {
            const transactionsResult = await getTransactions(db, {
              teamId,
              start: monthFrom,
              end: monthTo,
              sort: ["date", "desc"],
              pageSize: 10000,
              cursor: cursor ?? null,
              statuses: ["posted", "completed"],
            });

            allTransactions = allTransactions.concat(transactionsResult.data);
            cursor = transactionsResult.meta.cursor ?? null;
            hasMore = transactionsResult.meta.hasNextPage ?? false;
          }

          // Filter transactions
          const filteredTransactions = allTransactions.filter((tx) => {
            if (tx.internal) return false;
            if (tx.amount > 0) {
              if (
                !tx.categorySlug ||
                !REVENUE_CATEGORIES.includes(tx.categorySlug)
              ) {
                return false;
              }
              if (CONTRA_REVENUE_CATEGORIES.includes(tx.categorySlug)) {
                return false;
              }
            }
            return true;
          });

          const transactionCount = filteredTransactions.length;

          // Format transactions and calculate totals from filtered transactions
          // This ensures percentages are calculated against the same transaction set that's displayed
          // First pass: calculate amounts and totals
          const transactionAmounts = filteredTransactions.map((tx) => {
            const txAmount =
              tx.baseCurrency === targetCurrency && tx.baseAmount != null
                ? tx.baseAmount
                : tx.amount;
            return txAmount;
          });

          // Calculate totals from filtered transactions for accurate percentage calculations
          const monthTotalExpenses = Math.abs(
            transactionAmounts
              .filter((amount) => amount < 0)
              .reduce((sum, amount) => sum + amount, 0),
          );
          const monthTotalRevenue = transactionAmounts
            .filter((amount) => amount > 0)
            .reduce((sum, amount) => sum + amount, 0);

          // Second pass: format transactions with percentage calculations using the calculated totals
          const formattedTransactionsWithPercentages = filteredTransactions.map(
            (tx, index) => {
              const txAmount = transactionAmounts[index]!;

              const formatted = formatAmount({
                amount: Math.abs(txAmount),
                currency: tx.baseCurrency || tx.currency || targetCurrency,
                locale,
              });

              // Calculate percentage impact using calculated totals from filtered transactions
              const totalForPercentage =
                txAmount < 0 ? monthTotalExpenses : monthTotalRevenue;
              const percentage =
                totalForPercentage > 0
                  ? (Math.abs(txAmount) / totalForPercentage) * 100
                  : 0;

              return {
                id: tx.id,
                date: format(parseISO(tx.date), "MMM d, yyyy"),
                name: tx.name,
                amount: txAmount,
                formattedAmount:
                  formatted ||
                  `${targetCurrency}${Math.abs(txAmount).toLocaleString()}`,
                category: tx.category?.name || "Uncategorized",
                type: (txAmount >= 0 ? "income" : "expense") as
                  | "income"
                  | "expense",
                vendor: tx.name,
                percentage,
              };
            },
          );

          const relevantTransactions = formattedTransactionsWithPercentages
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 10);

          const formattedCategories: Array<{
            name: string;
            amount: number;
            percentage: number;
            transactionCount?: number;
            color?: string;
          }> = spendingCategories.map((cat) => ({
            name: cat.name,
            amount: cat.amount,
            percentage: cat.percentage,
            ...(cat.color && { color: cat.color }),
          }));

          // Aggregate totals
          totalRevenue += revenue;
          totalExpenses += expenses;
          totalProfit += profit;
          totalTransactionCount += transactionCount;

          // Store monthly data for comparison
          const monthLabel = format(parseISO(monthFrom), "MMM yyyy");
          allMonthlyData.push({
            monthKey,
            monthLabel,
            revenue,
            expenses,
            profit,
            transactionCount,
            topCategories: formattedCategories.slice(0, 5).map((cat) => ({
              name: cat.name,
              amount: cat.amount,
              percentage: cat.percentage,
            })),
            topTransactions: relevantTransactions.slice(0, 5).map((tx) => ({
              name: tx.name,
              amount: tx.amount,
              formattedAmount: tx.formattedAmount,
              category: tx.category,
              percentage: tx.percentage,
            })),
          });

          const summaryData = {
            revenue,
            expenses,
            profit,
            transactionCount,
          };

          const monthDescription = generateArtifactDescription(
            monthFrom,
            monthTo,
          );

          // Update artifact with metrics
          await artifactStream.update({
            stage: "metrics_ready",
            currency: targetCurrency,
            from: monthFrom,
            to: monthTo,
            displayDate: monthFrom, // Use start of month for display
            description: monthDescription,
            chartType: chartType || undefined,
            summary: summaryData,
            transactions: relevantTransactions,
            categories: formattedCategories as any,
          });

          // Generate AI summary for this month
          const analysisResult = await generateText({
            model: openai("gpt-4o-mini"),
            messages: [
              {
                role: "user",
                content: `Analyze this financial breakdown for ${appContext.companyName || "the business"} for ${monthDescription}:

Revenue: ${formatAmount({ amount: revenue, currency: targetCurrency, locale })}
Expenses: ${formatAmount({ amount: expenses, currency: targetCurrency, locale })}
Profit: ${formatAmount({ amount: profit, currency: targetCurrency, locale })}
Transactions: ${transactionCount}

Top Categories:
${formattedCategories
  .slice(0, 5)
  .map(
    (cat) =>
      `- ${cat.name}: ${formatAmount({ amount: cat.amount, currency: targetCurrency, locale })} (${cat.percentage.toFixed(1)}%)`,
  )
  .join("\n")}

Top Transactions:
${relevantTransactions
  .slice(0, 5)
  .map((tx) => `- ${tx.name}: ${tx.formattedAmount} (${tx.category})`)
  .join("\n")}

Provide a concise analysis (3-4 sentences) highlighting key insights, trends, and notable patterns. Focus on spending patterns, category distribution, and significant transactions. Write it as natural, flowing text.`,
              },
            ],
          });

          const summaryText =
            analysisResult.text.trim() ||
            `Financial breakdown showing ${formatAmount({ amount: revenue, currency: targetCurrency, locale })} in revenue, ${formatAmount({ amount: expenses, currency: targetCurrency, locale })} in expenses, resulting in ${formatAmount({ amount: profit, currency: targetCurrency, locale })} profit.`;

          // Update artifact with analysis
          await artifactStream.update({
            stage: "analysis_ready",
            displayDate: monthFrom, // Ensure displayDate is set
            analysis: {
              summary: summaryText,
              recommendations: [],
            },
          });
        }

        // Aggregate top categories across all months
        const categoryMap = new Map<
          string,
          { name: string; amount: number; percentage: number }
        >();
        for (const monthData of allMonthlyData) {
          for (const cat of monthData.topCategories) {
            const existing = categoryMap.get(cat.name);
            if (existing) {
              categoryMap.set(cat.name, {
                name: cat.name,
                amount: existing.amount + cat.amount,
                percentage: 0, // Will recalculate
              });
            } else {
              categoryMap.set(cat.name, { ...cat });
            }
          }
        }
        // Recalculate percentages based on total expenses
        const aggregatedCategories = Array.from(categoryMap.values())
          .map((cat) => ({
            ...cat,
            percentage:
              totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        // Aggregate top transactions across all months (by amount)
        const transactionMap = new Map<
          string,
          {
            name: string;
            amount: number;
            formattedAmount: string;
            category: string;
            percentage: number;
          }
        >();
        for (const monthData of allMonthlyData) {
          for (const tx of monthData.topTransactions) {
            const key = `${tx.name}-${tx.category}`;
            const existing = transactionMap.get(key);
            if (existing) {
              transactionMap.set(key, {
                ...existing,
                amount: existing.amount + tx.amount,
                percentage: 0, // Will recalculate
              });
            } else {
              transactionMap.set(key, { ...tx });
            }
          }
        }
        // Recalculate percentages and formattedAmount, then sort
        const aggregatedTransactions = Array.from(transactionMap.values())
          .map((tx) => {
            const totalForPercentage =
              tx.amount < 0 ? totalExpenses : totalRevenue;
            // Always recalculate formattedAmount from the aggregated amount
            const recalculatedFormattedAmount = formatAmount({
              amount: tx.amount,
              currency: targetCurrency,
              locale,
            });
            return {
              name: tx.name,
              category: tx.category,
              amount: tx.amount,
              formattedAmount: recalculatedFormattedAmount,
              percentage:
                totalForPercentage > 0
                  ? (Math.abs(tx.amount) / totalForPercentage) * 100
                  : 0,
            };
          })
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5);

        // Generate AI summary comparing months
        const monthlyComparison = allMonthlyData
          .map(
            (m) =>
              `${m.monthLabel}: Revenue ${formatAmount({
                amount: m.revenue,
                currency: targetCurrency,
                locale,
              })}, Expenses ${formatAmount({
                amount: m.expenses,
                currency: targetCurrency,
                locale,
              })}, Profit ${formatAmount({
                amount: m.profit,
                currency: targetCurrency,
                locale,
              })}`,
          )
          .join("\n");

        const analysisResult = await generateText({
          model: openai("gpt-4o-mini"),
          messages: [
            {
              role: "user",
              content: `Analyze this multi-month financial breakdown for ${appContext.companyName || "the business"} from ${format(parseISO(finalFrom), "MMM d, yyyy")} to ${format(parseISO(finalTo), "MMM d, yyyy")}:

Total Period Summary:
- Revenue: ${formatAmount({ amount: totalRevenue, currency: targetCurrency, locale })}
- Expenses: ${formatAmount({ amount: totalExpenses, currency: targetCurrency, locale })}
- Profit: ${formatAmount({ amount: totalProfit, currency: targetCurrency, locale })}
- Transactions: ${totalTransactionCount}

Monthly Breakdown:
${monthlyComparison}

Top Categories (aggregated):
${aggregatedCategories
  .map(
    (cat) =>
      `- ${cat.name}: ${formatAmount({ amount: cat.amount, currency: targetCurrency, locale })} (${cat.percentage.toFixed(1)}%)`,
  )
  .join("\n")}

Top Transactions (aggregated):
${aggregatedTransactions
  .map((tx) => `- ${tx.name}: ${tx.formattedAmount} (${tx.category})`)
  .join("\n")}

Provide a concise analysis (3-4 sentences) highlighting:
1. Overall financial performance across the period
2. Key trends or differences between months
3. Notable spending patterns or significant transactions
Write it as natural, flowing text.`,
            },
          ],
        });

        const summaryText =
          analysisResult.text.trim() ||
          `Financial breakdown showing ${formatAmount({ amount: totalRevenue, currency: targetCurrency, locale })} in total revenue, ${formatAmount({ amount: totalExpenses, currency: targetCurrency, locale })} in total expenses, resulting in ${formatAmount({ amount: totalProfit, currency: targetCurrency, locale })} profit across ${monthlyPeriods.length} month${monthlyPeriods.length > 1 ? "s" : ""}.`;

        // Generate improved text response
        const formattedRevenue = formatAmount({
          amount: totalRevenue,
          currency: targetCurrency,
          locale,
        });
        const formattedExpenses = formatAmount({
          amount: totalExpenses,
          currency: targetCurrency,
          locale,
        });
        const formattedProfit = formatAmount({
          amount: totalProfit,
          currency: targetCurrency,
          locale,
        });

        let responseText = `Financial breakdown for ${format(parseISO(finalFrom), "MMM d, yyyy")} to ${format(parseISO(finalTo), "MMM d, yyyy")}: ${formattedRevenue} in revenue, ${formattedExpenses} in expenses, resulting in ${formattedProfit} profit across ${monthlyPeriods.length} month${monthlyPeriods.length > 1 ? "s" : ""}.\n\n`;
        responseText += `${summaryText}\n\n`;
        responseText +=
          "Detailed monthly breakdowns are available for each month.";

        yield {
          text: responseText,
        };

        // Format aggregated transactions to match expected structure
        const formattedAggregatedTransactions = aggregatedTransactions.map(
          (tx) => ({
            id: `aggregated-${tx.name}-${tx.category}`, // Synthetic ID for aggregated transactions
            date: `${format(parseISO(finalFrom), "MMM d")} - ${format(parseISO(finalTo), "MMM d, yyyy")}`, // Date range
            name: tx.name,
            amount: tx.amount,
            formattedAmount: tx.formattedAmount,
            category: tx.category,
            type: (tx.amount >= 0 ? "income" : "expense") as
              | "income"
              | "expense",
            vendor: tx.name,
            percentage: tx.percentage,
          }),
        );

        return {
          summary: {
            revenue: totalRevenue,
            expenses: totalExpenses,
            profit: totalProfit,
            transactionCount: totalTransactionCount,
          },
          transactions: formattedAggregatedTransactions,
          categories: aggregatedCategories,
          currency: targetCurrency,
        };
      }

      // Single month or no canvas - use existing logic
      // Generate description based on date range
      const description = generateArtifactDescription(finalFrom, finalTo);

      // Initialize artifact if showCanvas is true
      let summaryAnalysis:
        | ReturnType<typeof metricsBreakdownSummaryArtifact.stream>
        | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        const baseData = {
          stage: "loading" as const,
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          displayDate: finalFrom, // Use start date for display
          description,
          chartType: chartType || undefined,
        };

        summaryAnalysis = metricsBreakdownSummaryArtifact.stream(
          baseData,
          writer,
        );
      }

      // Fetch revenue data
      const revenueResult = await getReports(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: finalCurrency ?? undefined,
        type: "revenue",
        revenueType: "net",
      });

      // Fetch expenses data
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

      // Fetch profit data
      const profitResult = await getReports(db, {
        teamId,
        from: finalFrom,
        to: finalTo,
        currency: finalCurrency ?? undefined,
        type: "profit",
        revenueType: "net",
      });

      // Calculate summary metrics
      const revenue = revenueResult.summary.currentTotal;
      const expenses = Math.abs(periodSummary.totalSpending);
      const profit = profitResult.summary.currentTotal;

      // Fetch all transactions for the period (paginate to get all)
      let allTransactions: any[] = [];
      let cursor: string | null = null;
      let hasMore = true;

      while (hasMore) {
        const transactionsResult = await getTransactions(db, {
          teamId,
          start: finalFrom,
          end: finalTo,
          sort: ["date", "desc"],
          pageSize: 10000,
          cursor: cursor ?? null,
          // Filter out excluded status at database level
          statuses: ["posted", "completed"],
        });

        allTransactions = allTransactions.concat(transactionsResult.data);
        cursor = transactionsResult.meta.cursor ?? null;
        hasMore = transactionsResult.meta.hasNextPage ?? false;
      }

      // Filter transactions to match summary metrics logic
      // For income: only revenue categories, exclude contra-revenue
      // For expenses: exclude internal transactions
      const filteredTransactions = allTransactions.filter((tx) => {
        // Always exclude internal transactions
        if (tx.internal) return false;

        // For income transactions (amount > 0), apply revenue category filters
        if (tx.amount > 0) {
          // Must be in revenue categories
          if (
            !tx.categorySlug ||
            !REVENUE_CATEGORIES.includes(tx.categorySlug)
          ) {
            return false;
          }
          // Must not be in contra-revenue categories
          if (CONTRA_REVENUE_CATEGORIES.includes(tx.categorySlug)) {
            return false;
          }
        }

        return true;
      });

      const transactionCount = filteredTransactions.length;

      // Format transactions and calculate totals from filtered transactions
      // This ensures percentages are calculated against the same transaction set that's displayed
      // First pass: calculate amounts and totals
      const transactionAmounts = filteredTransactions.map((tx) => {
        // Use same currency conversion logic as summary queries
        // If baseCurrency matches targetCurrency AND baseAmount is not NULL, use baseAmount
        // Otherwise, use amount
        const txAmount =
          tx.baseCurrency === targetCurrency && tx.baseAmount != null
            ? tx.baseAmount
            : tx.amount;
        return txAmount;
      });

      // Calculate totals from filtered transactions for accurate percentage calculations
      const totalExpenses = Math.abs(
        transactionAmounts
          .filter((amount) => amount < 0)
          .reduce((sum, amount) => sum + amount, 0),
      );
      const totalRevenue = transactionAmounts
        .filter((amount) => amount > 0)
        .reduce((sum, amount) => sum + amount, 0);

      // Second pass: format transactions with percentage calculations using the calculated totals
      const formattedTransactionsWithPercentages = filteredTransactions.map(
        (tx, index) => {
          const txAmount = transactionAmounts[index]!;

          const formatted = formatAmount({
            amount: Math.abs(txAmount),
            currency: tx.baseCurrency || tx.currency || targetCurrency,
            locale,
          });

          // Calculate percentage impact using calculated totals from filtered transactions
          // For expenses: percentage of total expenses from filtered transactions
          // For income: percentage of total revenue from filtered transactions
          const totalForPercentage =
            txAmount < 0 ? totalExpenses : totalRevenue;
          const percentage =
            totalForPercentage > 0
              ? (Math.abs(txAmount) / totalForPercentage) * 100
              : 0;

          return {
            id: tx.id,
            date: format(parseISO(tx.date), "MMM d, yyyy"),
            name: tx.name,
            amount: txAmount,
            formattedAmount:
              formatted ||
              `${targetCurrency}${Math.abs(txAmount).toLocaleString()}`,
            category: tx.category?.name || "Uncategorized",
            type: (txAmount >= 0 ? "income" : "expense") as
              | "income"
              | "expense",
            vendor: tx.name,
            percentage,
          };
        },
      );

      // Sort by percentage impact (descending) - most impactful first
      // Limit to top 10 transactions
      const relevantTransactions = formattedTransactionsWithPercentages
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10);

      // Format categories (simplified - transactionCount and color optional)
      const formattedCategories: Array<{
        name: string;
        amount: number;
        percentage: number;
        transactionCount?: number;
        color?: string;
      }> = spendingCategories.map((cat) => ({
        name: cat.name,
        amount: cat.amount,
        percentage: cat.percentage,
        ...(cat.color && { color: cat.color }),
      }));

      // Update summary data
      const summaryData = {
        revenue,
        expenses,
        profit,
        transactionCount,
      };

      if (showCanvas && summaryAnalysis) {
        // Update summary artifact with all data at once
        await summaryAnalysis.update({
          stage: "metrics_ready",
          currency: targetCurrency,
          from: finalFrom,
          to: finalTo,
          displayDate: finalFrom, // Use start date for display
          description,
          chartType: chartType || undefined,
          summary: summaryData,
          transactions: relevantTransactions,
          categories: formattedCategories as any,
        });
      }

      // Generate AI summary
      const analysisResult = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "user",
            content: `Analyze this financial breakdown for ${appContext.companyName || "the business"} from ${format(parseISO(finalFrom), "MMM d, yyyy")} to ${format(parseISO(finalTo), "MMM d, yyyy")}:

Revenue: ${formatAmount({ amount: revenue, currency: targetCurrency, locale })}
Expenses: ${formatAmount({ amount: expenses, currency: targetCurrency, locale })}
Profit: ${formatAmount({ amount: profit, currency: targetCurrency, locale })}
Transactions: ${transactionCount}

Top Categories:
${formattedCategories
  .slice(0, 5)
  .map(
    (cat) =>
      `- ${cat.name}: ${formatAmount({ amount: cat.amount, currency: targetCurrency, locale })} (${cat.percentage.toFixed(1)}%)`,
  )
  .join("\n")}

Top Transactions:
${relevantTransactions
  .slice(0, 5)
  .map((tx) => `- ${tx.name}: ${tx.formattedAmount} (${tx.category})`)
  .join("\n")}

Provide a concise analysis (3-4 sentences) highlighting key insights, trends, and notable patterns. Focus on spending patterns, category distribution, and significant transactions. Write it as natural, flowing text.`,
          },
        ],
      });

      const summaryText =
        analysisResult.text.trim() ||
        `Financial breakdown showing ${formatAmount({ amount: revenue, currency: targetCurrency, locale })} in revenue, ${formatAmount({ amount: expenses, currency: targetCurrency, locale })} in expenses, resulting in ${formatAmount({ amount: profit, currency: targetCurrency, locale })} profit.`;

      // Update summary artifact with analysis (only summary gets the analysis)
      if (showCanvas && summaryAnalysis) {
        await summaryAnalysis.update({
          stage: "analysis_ready",
          displayDate: finalFrom, // Ensure displayDate is set
          analysis: {
            summary: summaryText,
            recommendations: [],
          },
        });
      }

      // Format text response
      const formattedRevenue = formatAmount({
        amount: revenue,
        currency: targetCurrency,
        locale,
      });
      const formattedExpenses = formatAmount({
        amount: expenses,
        currency: targetCurrency,
        locale,
      });
      const formattedProfit = formatAmount({
        amount: profit,
        currency: targetCurrency,
        locale,
      });

      let responseText: string;

      if (showCanvas) {
        // Simplified text-focused response when canvas is shown
        responseText = `Financial breakdown for ${format(parseISO(finalFrom), "MMM d, yyyy")} to ${format(parseISO(finalTo), "MMM d, yyyy")}: ${formattedRevenue} in revenue, ${formattedExpenses} in expenses, resulting in ${formattedProfit} profit.`;
        responseText +=
          "\n\nA detailed visual breakdown with transactions, categories, and analysis is available.";
      } else {
        // Full detailed breakdown when canvas is not shown
        responseText = "**Financial Breakdown**\n\n";
        responseText += "**Summary:**\n";
        responseText += `- Revenue: ${formattedRevenue}\n`;
        responseText += `- Expenses: ${formattedExpenses}\n`;
        responseText += `- Profit: ${formattedProfit}\n`;
        responseText += `- Transactions: ${transactionCount}\n\n`;

        if (formattedCategories.length > 0) {
          responseText += "**Top Categories:**\n";
          for (const cat of formattedCategories.slice(0, 5)) {
            responseText += `- ${cat.name}: ${formatAmount({
              amount: cat.amount,
              currency: targetCurrency,
              locale,
            })} (${cat.percentage.toFixed(1)}%)\n`;
          }
          responseText += "\n";
        }

        if (relevantTransactions.length > 0) {
          responseText += "**Top Transactions:**\n";
          for (const tx of relevantTransactions.slice(0, 5)) {
            responseText += `- ${tx.name}: ${tx.formattedAmount} (${tx.category})\n`;
          }
        }
      }

      yield {
        text: responseText,
      };

      return {
        summary: {
          revenue,
          expenses,
          profit,
          transactionCount,
        },
        transactions: relevantTransactions,
        categories: formattedCategories,
        currency: targetCurrency,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve metrics breakdown: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      throw error;
    }
  },
});
