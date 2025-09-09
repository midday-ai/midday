import type { ToolContext } from "@api/ai/context";
import { getExpenses, getSpending } from "@db/queries";
import { logger } from "@midday/logger";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  createCanvasData,
  createCategoryData,
  createChartConfig,
  createDashboardLayout,
  createMetricCard,
  createPeriodInfo,
  createSummary,
  createTimeSeriesPoint,
} from "./canvas-types";
import { toolMetadata } from "./registry";

export const getExpensesTool = ({ db, user, writer }: ToolContext) =>
  tool({
    ...toolMetadata.getExpenses,
    async *execute({ from, to, currency }) {
      try {
        logger.info("Executing getExpensesTool", { from, to, currency });

        // Send canvas with loading state
        writer.write({
          type: "data-canvas",
          data: {
            title: "Expense Analysis",
            loading: true,
          },
        });

        // Log context for debugging
        logger.info("Expenses analysis context", {
          teamId: user.teamId,
          period: `${from} to ${to}`,
          currency: currency || "team default",
          userLocale: user.locale,
        });

        // Use the provided dates (which now have defaults from the schema)
        const fromDate = startOfMonth(new Date(from));
        const toDate = endOfMonth(new Date(to));

        // Validate date range
        if (fromDate >= toDate) {
          throw new Error("Start date must be before end date");
        }

        // Check if date range is reasonable (not more than 5 years)
        const maxRange = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years in milliseconds
        if (toDate.getTime() - fromDate.getTime() > maxRange) {
          logger.warn("Large date range requested", {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            days: Math.ceil(
              (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
          });
        }

        // Get both monthly expenses and category breakdown
        const [expensesData, spendingData] = await Promise.all([
          getExpenses(db, {
            teamId: user.teamId,
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            currency: currency ?? undefined,
          }),
          getSpending(db, {
            teamId: user.teamId,
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            currency: currency ?? undefined,
          }),
        ]);

        const monthlyExpenses = expensesData.result || [];
        const categoryBreakdown = spendingData || [];

        // Calculate totals and analytics
        const totalExpenses = monthlyExpenses.reduce(
          (sum, month) => sum + month.total,
          0,
        );
        const totalRecurring = monthlyExpenses.reduce(
          (sum, month) => sum + month.recurring,
          0,
        );
        const totalOneTime = monthlyExpenses.reduce(
          (sum, month) => sum + month.value,
          0,
        );

        // Determine currency to display
        const resolvedCurrency =
          currency ?? monthlyExpenses[0]?.currency ?? null;

        const fmt = (amount: number) =>
          resolvedCurrency
            ? formatAmount({
                amount,
                currency: resolvedCurrency,
                locale: user.locale ?? undefined,
              })
            : `${amount.toLocaleString()} (base currency)`;

        // Create monthly breakdown table
        const monthlyTable = [
          "| Month | One-time | Recurring | Total |",
          "|-------|----------|-----------|-------|",
          ...monthlyExpenses.map(
            (month) =>
              `| ${format(new Date(month.date), "MMM yyyy")} | ${fmt(month.value)} | ${fmt(month.recurring)} | ${fmt(month.total)} |`,
          ),
        ];

        // Create category breakdown table (top 10 categories)
        const topCategories = categoryBreakdown
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10);

        const categoryTable = [
          "| Category | Amount | % of Total |",
          "|----------|--------|------------|",
          ...topCategories.map(
            (category) =>
              `| ${category.name} | ${fmt(category.amount)} | ${(
                (category.amount / totalExpenses) * 100
              ).toFixed(1)}% |`,
          ),
        ];

        // Calculate analytics
        const values = monthlyExpenses.map((m) => m.total);
        const avgMonthly = totalExpenses / monthlyExpenses.length;
        const maxExpenses = Math.max(...values);
        const minExpenses = Math.min(...values);
        const maxMonth = monthlyExpenses.find((m) => m.total === maxExpenses);
        const minMonth = monthlyExpenses.find((m) => m.total === minExpenses);

        // Calculate expense trend
        const midPoint = Math.floor(monthlyExpenses.length / 2);
        const firstHalf = monthlyExpenses.slice(0, midPoint);
        const secondHalf = monthlyExpenses.slice(midPoint);
        const firstHalfAvg =
          firstHalf.reduce((sum, m) => sum + m.total, 0) / firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((sum, m) => sum + m.total, 0) / secondHalf.length;
        const expenseChange =
          ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        // Calculate variance for stability analysis
        const variance =
          values.reduce((sum, val) => sum + (val - avgMonthly) ** 2, 0) /
          values.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = (stdDev / avgMonthly) * 100;

        // Calculate recurring vs one-time ratios
        const recurringRatio = (totalRecurring / totalExpenses) * 100;
        const oneTimeRatio = (totalOneTime / totalExpenses) * 100;

        // Calculate additional metrics for canvas
        const totalMonths = Math.ceil(
          (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
        );
        const expenseConsistency = monthlyExpenses.length / totalMonths;

        // Create 4-column dashboard cards with most relevant expense metrics
        const cards = [
          createMetricCard(
            "Current Monthly Expenses",
            avgMonthly, // Use average as "current" since it's more stable
            resolvedCurrency || "USD",
            {
              trend: {
                value: expenseChange,
                direction:
                  expenseChange > 0
                    ? "up"
                    : expenseChange < 0
                      ? "down"
                      : "stable",
                description: "vs last period",
              },
              status:
                coefficientOfVariation > 40
                  ? {
                      level: "warning",
                      message: "High expense variability",
                    }
                  : coefficientOfVariation < 20
                    ? {
                        level: "good",
                        message: "Very stable expenses",
                      }
                    : undefined,
              subtitle: `Over last ${monthlyExpenses.length} months`,
            },
          ),
          createMetricCard(
            "Total Expenses",
            totalExpenses,
            resolvedCurrency || "USD",
            {
              subtitle: `From ${format(fromDate, "MMM yyyy")} to ${format(toDate, "MMM yyyy")}`,
              status:
                totalExpenses > avgMonthly * monthlyExpenses.length * 1.2
                  ? {
                      level: "warning",
                      message: "Above expected spending",
                    }
                  : totalExpenses < avgMonthly * monthlyExpenses.length * 0.8
                    ? {
                        level: "good",
                        message: "Below expected spending",
                      }
                    : undefined,
            },
          ),
          createMetricCard(
            "Recurring Expenses",
            totalRecurring,
            resolvedCurrency || "USD",
            {
              subtitle: `${recurringRatio.toFixed(1)}% of total expenses`,
              status:
                recurringRatio > 60
                  ? {
                      level: "good",
                      message: "Good cost predictability",
                    }
                  : recurringRatio < 40
                    ? {
                        level: "warning",
                        message: "High variable spending",
                      }
                    : undefined,
            },
          ),
          createMetricCard(
            "Top Expense Category",
            topCategories[0]?.amount || 0,
            resolvedCurrency || "USD",
            {
              subtitle: `${topCategories[0]?.name || "N/A"} (${topCategories[0] ? ((topCategories[0].amount / totalExpenses) * 100).toFixed(1) : 0}%)`,
              status:
                topCategories[0] &&
                topCategories[0].amount / totalExpenses > 0.4
                  ? {
                      level: "warning",
                      message: "High concentration in one category",
                    }
                  : undefined,
            },
          ),
        ];

        // Create comprehensive summary
        const summary = createSummary(
          "Expense Analysis Summary",
          `Expenses ${expenseChange > 0 ? "increased" : "decreased"} by ${Math.abs(expenseChange).toFixed(1)}% over the period, totaling ${fmt(totalExpenses)} across ${monthlyExpenses.length} months. ${recurringRatio.toFixed(1)}% of spending is recurring, providing ${recurringRatio > 60 ? "good cost predictability" : "high variability in monthly expenses"}. The ${topCategories[0]?.name || "top category"} represents ${topCategories[0] ? ((topCategories[0].amount / totalExpenses) * 100).toFixed(1) : 0}% of total expenses.`,
          [
            `Monthly average: ${fmt(avgMonthly)} with ${coefficientOfVariation < 20 ? "very stable" : coefficientOfVariation < 40 ? "moderately stable" : "highly variable"} spending patterns`,
            `Peak spending: ${maxMonth ? format(new Date(maxMonth.date), "MMM yyyy") : "N/A"} (${fmt(maxExpenses)}) | Lowest: ${minMonth ? format(new Date(minMonth.date), "MMM yyyy") : "N/A"} (${fmt(minExpenses)})`,
            `Expense composition: ${fmt(totalRecurring)} recurring (${recurringRatio.toFixed(1)}%) + ${fmt(totalOneTime)} one-time (${oneTimeRatio.toFixed(1)}%)`,
            `Data completeness: ${(expenseConsistency * 100).toFixed(1)}% of months had expense activity`,
          ],
          [
            coefficientOfVariation > 40
              ? "Implement monthly budget tracking and expense alerts for better cost control"
              : null,
            recurringRatio < 40
              ? "Consider converting variable expenses to recurring for better predictability and budgeting"
              : null,
            topCategories[0] && topCategories[0].amount / totalExpenses > 0.4
              ? `Review ${topCategories[0].name} expenses for potential cost optimization opportunities`
              : null,
            expenseChange > 10
              ? "Monitor expense growth closely and implement cost reduction strategies"
              : null,
            expenseConsistency < 0.8
              ? "Improve expense tracking consistency to get better insights"
              : null,
          ],
        );

        yield {
          content: "Analyzing your expense data...",
        };

        // Create period information
        const periodInfo = createPeriodInfo(
          from,
          to,
          monthlyExpenses.length,
          Math.ceil(
            (toDate.getTime() - fromDate.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
          resolvedCurrency || "USD",
          `${format(fromDate, "MMM yyyy")} - ${format(toDate, "MMM yyyy")}`,
        );

        // Create chart configuration
        const chartConfig = createChartConfig("area", {
          title: "Monthly Expense Trend",
          height: 200,
          showLegend: false,
          showGrid: true,
        });

        // Create dashboard layout with chart
        const dashboard = createDashboardLayout(
          "Expense Analysis",
          cards,
          summary,
          {
            columns: 4,
            chart: {
              config: chartConfig,
              data: monthlyExpenses.map((month) =>
                createTimeSeriesPoint(
                  format(new Date(month.date), "MMM yyyy"),
                  month.total,
                  {
                    label: `Total: ${formatAmount({
                      amount: month.total,
                      currency: resolvedCurrency || "USD",
                    })}`,
                    metadata: {
                      oneTime: month.value,
                      recurring: month.recurring,
                      date: month.date,
                    },
                  },
                ),
              ),
            },
          },
        );

        // Create enhanced canvas data
        const canvasData = createCanvasData(
          "dashboard",
          "Expense Analysis",
          totalExpenses,
          resolvedCurrency || "USD",
          dashboard,
          monthlyExpenses.map((month) =>
            createTimeSeriesPoint(
              format(new Date(month.date), "MMM yyyy"),
              month.total,
              {
                label: `Total: ${formatAmount({
                  amount: month.total,
                  currency: resolvedCurrency || "USD",
                })}`,
                metadata: {
                  oneTime: month.value,
                  recurring: month.recurring,
                  date: month.date,
                },
              },
            ),
          ),
          from,
          to,
          {
            description: `Comprehensive expense analysis showing spending patterns across ${monthlyExpenses.length} months with ${topCategories.length} categories.`,
            average: avgMonthly,
            categories: topCategories.map((cat) =>
              createCategoryData(
                cat.name,
                cat.amount,
                totalExpenses,
                cat.color,
                {
                  metadata: {
                    percentage: (cat.amount / totalExpenses) * 100,
                    color: cat.color,
                  },
                },
              ),
            ),
            period: periodInfo,
            metadata: {
              analysisType: "expenses",
              totalCategories: topCategories.length,
              avgMonthly,
              highestCategory: topCategories[0]?.name,
              lowestCategory: topCategories[topCategories.length - 1]?.name,
            },
          },
        );

        yield {
          content: "Generating expense dashboard...",
        };

        // Send completion with canvas data via writer
        writer.write({
          type: "data-canvas",
          data: {
            title: "Expense Analysis",
            canvasData: canvasData,
            loading: false,
          },
        });

        const period = `${format(fromDate, "MMM yyyy")} - ${format(
          toDate,
          "MMM yyyy",
        )}`;
        const header = `**Expense Analysis (${period})**`;
        const totalLine = `Total Expenses: ${fmt(totalExpenses)}`;

        if (monthlyExpenses.length === 0) {
          return `${header}\n${totalLine}\n\nNo expenses recorded for this period.`;
        }

        // Additional metrics already calculated above
        const expenseDirection =
          expenseChange > 10
            ? "increasing significantly"
            : expenseChange > 0
              ? "trending upward"
              : expenseChange > -10
                ? "relatively stable"
                : "decreasing";
        const stabilityLevel =
          coefficientOfVariation < 20
            ? "very stable"
            : coefficientOfVariation < 40
              ? "moderately stable"
              : "highly variable";

        // Enhanced analytics with structured business insights
        const analyticsSection = [
          "",
          "**Expense Analytics:**",
          `Average Monthly Expenses: ${fmt(avgMonthly)}`,
          `Highest Expense Month: ${format(new Date(maxMonth!.date), "MMM yyyy")} with ${fmt(maxExpenses)}`,
          `Lowest Expense Month: ${format(new Date(minMonth!.date), "MMM yyyy")} with ${fmt(minExpenses)}`,
          `Expense Range: ${fmt(minExpenses)} - ${fmt(maxExpenses)} (${fmt(maxExpenses - minExpenses)} spread)`,
          "",
          "**Expense Composition:**",
          `One-time Expenses: ${fmt(totalOneTime)} (${oneTimeRatio.toFixed(1)}% of total)`,
          `Recurring Expenses: ${fmt(totalRecurring)} (${recurringRatio.toFixed(1)}% of total)`,
          `Recurring vs One-time Ratio: ${recurringRatio.toFixed(1)}% recurring, ${oneTimeRatio.toFixed(1)}% one-time`,
          "",
          "**Expense Trends:**",
          `Expense Change: ${expenseChange > 0 ? "+" : ""}${expenseChange.toFixed(1)}% (first half vs second half)`,
          `Expense Stability: ${coefficientOfVariation.toFixed(1)}% coefficient of variation`,
          `Active Expense Months: ${monthlyExpenses.length} out of ${totalMonths} months (${(expenseConsistency * 100).toFixed(1)}% consistency)`,
          "",
          "**Top Expense Categories:**",
          ...topCategories
            .slice(0, 5)
            .map(
              (cat, index) =>
                `${index + 1}. ${cat.name}: ${fmt(cat.amount)} (${(
                  (cat.amount / totalExpenses) * 100
                ).toFixed(1)}%)`,
            ),
          "",
          "**Business Insights:**",
          `Expenses are ${expenseDirection} with ${stabilityLevel} spending patterns`,
          recurringRatio > 60
            ? "High recurring expense ratio indicates predictable monthly costs - good for budgeting"
            : recurringRatio > 40
              ? "Balanced mix of recurring and one-time expenses - flexible spending pattern"
              : "High one-time expense ratio suggests variable spending - consider expense planning",
          coefficientOfVariation < 20
            ? "Very stable expense pattern indicates good cost control and predictable cash flow"
            : coefficientOfVariation < 40
              ? "Moderate expense variability suggests some seasonal patterns or project-based spending"
              : "High expense variability - consider implementing better expense tracking and budgeting",
          expenseChange > 10
            ? "Expenses are increasing significantly - review spending patterns and consider cost optimization"
            : expenseChange > 0
              ? "Expenses are trending upward - monitor closely for budget impact"
              : expenseChange > -10
                ? "Expenses are relatively stable - good cost control"
                : "Expenses are decreasing - improving operational efficiency",
          "",
          "**Analysis Context:**",
          `Analysis period: ${format(fromDate, "MMM dd, yyyy")} to ${format(toDate, "MMM dd, yyyy")} (${totalMonths} months)`,
          `Currency: ${resolvedCurrency || "Team base currency"}`,
          `Data completeness: ${(expenseConsistency * 100).toFixed(1)}% of months had expense activity`,
          `Categories analyzed: ${categoryBreakdown.length} expense categories`,
        ];

        // Enhanced content with structured analysis
        const detailedContent = [
          header,
          totalLine,
          "",
          "**Monthly Expense Breakdown:**",
          ...monthlyTable,
          "",
          "**Expense Category Breakdown:**",
          ...categoryTable,
          ...analyticsSection,
          "",
          "**Key Takeaways:**",
          `Total expenses of ${fmt(totalExpenses)} over ${monthlyExpenses.length} active months`,
          `${expenseChange > 0 ? "Increasing" : "Decreasing"} expenses with ${Math.abs(expenseChange).toFixed(1)}% ${expenseChange > 0 ? "increase" : "decrease"}`,
          `Expense ${coefficientOfVariation < 30 ? "stability is good" : "shows significant variability"} (${coefficientOfVariation.toFixed(1)}% variance)`,
          `Best cost control month was ${format(new Date(minMonth!.date), "MMM yyyy")} with ${fmt(minExpenses)}`,
          `Expense consistency: ${(expenseConsistency * 100).toFixed(1)}% of months had expense activity`,
          `Top expense category: ${topCategories[0]?.name || "N/A"} (${fmt(topCategories[0]?.amount || 0)})`,
          `Recurring expenses make up ${recurringRatio.toFixed(1)}% of total spending`,
        ];

        yield {
          content: detailedContent.join("\n"),
        };
      } catch (error) {
        logger.error("Error executing getExpensesTool", {
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    },
  });
