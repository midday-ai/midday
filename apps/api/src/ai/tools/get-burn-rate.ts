import type { ToolContext } from "@api/ai/context";
import { getBurnRate, getRunway, getSpending } from "@db/queries";
import { logger } from "@midday/logger";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  createCanvasData,
  createChartConfig,
  createDashboardLayout,
  createMetricCard,
  createSummary,
  createTimeSeriesPoint,
} from "./canvas-types";
import { toolMetadata } from "./registry";

export const getBurnRateTool = ({ db, user, writer }: ToolContext) =>
  tool({
    ...toolMetadata.getBurnRate,
    async *execute({ from, to, currency, showCanvas }) {
      try {
        logger.info("Executing getBurnRateTool", {
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

        const title = `Burn Rate Analysis (${period})`;

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

        // Get actual burn rate data from database
        const burnRateData = await getBurnRate(db, {
          teamId: user.teamId,
          from,
          to,
          currency: teamCurrency,
        });

        // Get expense breakdown by categories
        const spendingData = await getSpending(db, {
          teamId: user.teamId,
          from,
          to,
          currency: teamCurrency,
        });

        // Get runway calculation
        const runway = await getRunway(db, {
          teamId: user.teamId,
          from,
          to,
          currency: teamCurrency,
        });

        // Process burn rate data for chart
        const monthlyBurnData = burnRateData.map((item) => {
          const monthLabel = format(new Date(item.date), "MMM");
          const value = Math.abs(item.value); // Burn rate should be positive
          const formattedValue = formatAmount({
            amount: value,
            currency: teamCurrency,
            minimumFractionDigits: 0,
          });

          return createTimeSeriesPoint(monthLabel, value, {
            label: formattedValue,
            metadata: { date: item.date },
          });
        });

        // Calculate metrics from real data
        const currentBurnRate =
          burnRateData.length > 0
            ? Math.abs(burnRateData[burnRateData.length - 1]?.value || 0)
            : 0;

        const previousBurnRate =
          burnRateData.length > 1
            ? Math.abs(burnRateData[burnRateData.length - 2]?.value || 0)
            : currentBurnRate;

        // Calculate trend
        const trendValue =
          previousBurnRate > 0
            ? ((currentBurnRate - previousBurnRate) / previousBurnRate) * 100
            : 0;

        const trendDirection = trendValue > 0 ? "up" : "down";

        // Calculate average burn rate
        const avgBurnRate =
          burnRateData.length > 0
            ? burnRateData.reduce(
                (sum, item) => sum + Math.abs(item.value),
                0,
              ) / burnRateData.length
            : 0;

        // Find personnel costs from spending data
        const personnelCategories = [
          "salaries",
          "payroll",
          "personnel",
          "salary",
          "wages",
          "benefits",
        ];
        const personnelSpending = spendingData.filter((item) =>
          personnelCategories.some(
            (category) =>
              item.slug?.toLowerCase().includes(category) ||
              item.name?.toLowerCase().includes(category),
          ),
        );

        const totalPersonnelCosts = personnelSpending.reduce(
          (sum, item) => sum + item.amount,
          0,
        );
        const personnelPercentage =
          currentBurnRate > 0
            ? (totalPersonnelCosts / currentBurnRate) * 100
            : 0;

        // Create metric cards with real data
        const cards = [
          createMetricCard(
            "Current Monthly Burn",
            currentBurnRate,
            teamCurrency,
            {
              id: "current-burn",
              subtitle: `${trendValue >= 0 ? "+" : ""}${trendValue.toFixed(1)}% vs last month`,
              trend: {
                value: Math.abs(trendValue),
                direction: trendDirection as "up" | "down",
                description: `${trendValue >= 0 ? "+" : ""}${trendValue.toFixed(1)}% vs last month`,
              },
            },
          ),
          createMetricCard("Runway Remaining", runway, "months", {
            id: "runway",
            format: "duration" as const,
            subtitle:
              runway < 12 ? "Below recommended 12+ months" : "Healthy runway",
            status: {
              level: runway < 12 ? ("warning" as const) : ("good" as const),
              message:
                runway < 12 ? "Below recommended 12+ months" : "Healthy runway",
            },
          }),
          createMetricCard("Average Burn Rate", avgBurnRate, teamCurrency, {
            id: "avg-burn",
            subtitle: `Over last ${burnRateData.length} months`,
          }),
          createMetricCard("Personnel Costs", personnelPercentage, "%", {
            id: "personnel",
            format: "percentage" as const,
            subtitle: `${formatAmount({ amount: totalPersonnelCosts, currency: teamCurrency })} of monthly burn`,
          }),
        ];

        // Generate insights based on real data
        const oldestBurnRate =
          burnRateData.length > 0 ? Math.abs(burnRateData[0]?.value || 0) : 0;
        const burnRateGrowth =
          oldestBurnRate > 0
            ? ((currentBurnRate - oldestBurnRate) / oldestBurnRate) * 100
            : 0;

        const insights = [
          `Monthly burn rate is currently ${formatAmount({ amount: currentBurnRate, currency: teamCurrency })}`,
          personnelPercentage > 0
            ? `Personnel costs represent ${personnelPercentage.toFixed(1)}% of total monthly expenses (${formatAmount({ amount: totalPersonnelCosts, currency: teamCurrency })})`
            : "Personnel cost breakdown not available from current data",
          `Current runway projection shows ${runway.toFixed(1)} months remaining`,
          burnRateData.length > 1
            ? `Burn rate has ${burnRateGrowth >= 0 ? "increased" : "decreased"} by ${Math.abs(burnRateGrowth).toFixed(1)}% over the analysis period`
            : "Insufficient historical data for trend analysis",
        ];

        const recommendations = [
          runway < 12
            ? "Consider extending runway through cost reduction or additional funding"
            : "Maintain current financial trajectory",
          personnelPercentage > 60
            ? "Review personnel costs for optimization opportunities"
            : "Personnel costs are within reasonable range",
          "Monitor burn rate trajectory monthly for early warning signs",
          "Establish target burn rate aligned with growth objectives",
        ];

        // Create comprehensive summary in concise format
        const burnRateChange =
          burnRateGrowth !== 0
            ? `Burn rate ${burnRateGrowth > 0 ? "increased" : "decreased"} ${Math.abs(burnRateGrowth).toFixed(0)}% over ${burnRateData.length} months (${formatAmount({ amount: oldestBurnRate, currency: teamCurrency })} to ${formatAmount({ amount: currentBurnRate, currency: teamCurrency })})`
            : `Current burn rate is ${formatAmount({ amount: currentBurnRate, currency: teamCurrency })}`;

        const personnelText =
          personnelPercentage > 0
            ? `, driven by personnel costs (${personnelPercentage.toFixed(0)}% of expenses)`
            : "";

        const runwayText =
          runway < 12
            ? `Current runway of ${runway.toFixed(1)} months is below the recommended 12+ months, requiring cost optimization or additional funding.`
            : `Current runway of ${runway.toFixed(1)} months provides healthy financial stability.`;

        const summaryDescription = `${burnRateChange}${personnelText}. ${runwayText}`;

        const summary = createSummary("Summary", summaryDescription);

        // Create chart configuration for the monthly burn rate trend
        const chartConfig = createChartConfig("area", {
          height: 320,
        });

        // Create dashboard layout with period in title
        const dashboard = createDashboardLayout(title, cards, summary, {
          id: "burn-rate-dashboard",
          columns: 2, // 2 columns for the metric cards
          chart: {
            config: chartConfig,
            data: monthlyBurnData,
          },
        });

        // Create the complete canvas data
        const canvasData = createCanvasData(
          "dashboard",
          title,
          currentBurnRate, // Current monthly burn from real data
          teamCurrency,
          dashboard,
          monthlyBurnData,
          from,
          to,
          {
            description:
              "Comprehensive burn rate analysis with runway projections",
            average: avgBurnRate, // Average burn rate from real data
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

        // Create a detailed response based on real data
        const detailedContent = [
          `**${title}**`,
          "",
          `Your current monthly burn rate is **${formatAmount({ amount: currentBurnRate, currency: teamCurrency })}**${
            burnRateGrowth !== 0
              ? `, representing a ${Math.abs(burnRateGrowth).toFixed(1)}% ${burnRateGrowth > 0 ? "increase" : "decrease"} over the analysis period.`
              : "."
          } Here's what the analysis reveals:`,
          "",
          "**Key Findings:**",
          ...insights.map((insight) => `• ${insight}`),
          "",
          "**Recommendations:**",
          ...recommendations.map((rec) => `• ${rec}`),
          "",
          runway < 12
            ? `Your runway of ${runway.toFixed(1)} months is below the recommended 12+ months, which suggests you should consider cost optimization or additional funding to maintain healthy cash flow.`
            : `Your runway of ${runway.toFixed(1)} months provides a healthy buffer for your business operations.`,
        ];

        yield {
          content: detailedContent.join("\n"),
        };
      } catch (error) {
        logger.error("Error in getBurnRateTool", {
          error: error instanceof Error ? error.message : String(error),
          userId: user.userId,
          teamId: user.teamId,
        });

        yield {
          content:
            "I encountered an error while analyzing your burn rate data. Please try again or contact support if the issue persists.",
        };
      }
    },
  });
