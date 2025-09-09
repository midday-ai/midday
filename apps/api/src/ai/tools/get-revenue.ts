import type { ToolContext } from "@api/ai/context";
import { getRevenue } from "@db/queries";
import { logger } from "@midday/logger";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  createCanvasData,
  createChartConfig,
  createDashboardLayout,
  createMetricCard,
  createPeriodInfo,
  createSummary,
  createTimeSeriesPoint,
} from "./canvas-types";
import { toolMetadata } from "./registry";

export const getRevenueTool = ({ db, user, writer }: ToolContext) =>
  tool({
    ...toolMetadata.getRevenue,
    async *execute({ from, to, currency, showCanvas }) {
      try {
        logger.info("Executing getRevenueTool", {
          from,
          to,
          currency,
          showCanvas,
        });

        // Send canvas with loading state only if showCanvas is true
        if (showCanvas) {
          writer.write({
            type: "data-canvas",
            data: {
              title: "Revenue Analysis",
              loading: true,
            },
          });
        }

        // Log context for debugging
        logger.info("Revenue analysis context", {
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

        const rows = await getRevenue(db, {
          teamId: user.teamId,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          currency: currency ?? undefined,
        });

        const total = rows.reduce((sum, r) => sum + Number(r.value || 0), 0);
        const revenueData = rows
          .map((r) => ({
            date: r.date,
            value: Number(r.value || 0),
            currency: r.currency,
          }))
          .filter((r) => r.value > 0);

        // Determine currency to display (explicit param > data currency > base)
        const resolvedCurrency = currency ?? rows[0]?.currency ?? null;

        const fmt = (amount: number) =>
          resolvedCurrency
            ? formatAmount({
                amount,
                currency: resolvedCurrency,
                locale: user.locale ?? undefined,
              })
            : `${amount.toLocaleString()} (base currency)`;

        // Create table format for monthly breakdown
        const monthly = [
          "| Month | Revenue |",
          "|-------|---------|",
          ...revenueData.map(
            (r) =>
              `| ${format(new Date(r.date), "MMM yyyy")} | ${fmt(r.value)} |`,
          ),
        ];

        const period = `${format(fromDate, "MMM yyyy")} - ${format(
          toDate,
          "MMM yyyy",
        )}`;
        const header = `**Revenue Summary (${period})**`;
        const totalLine = `Total Revenue: ${fmt(total)}`;

        if (revenueData.length === 0) {
          return `${header}\n${totalLine}\n\nNo revenue recorded for this period.`;
        }

        // Calculate analytics for AI to use in summary
        const values = revenueData.map((r) => r.value);
        const avgMonthly = total / revenueData.length;
        const maxRevenue = Math.max(...values);
        const minRevenue = Math.min(...values);
        const maxMonth = revenueData.find((r) => r.value === maxRevenue);
        const minMonth = revenueData.find((r) => r.value === minRevenue);

        // Calculate growth trend (first half vs second half)
        const midPoint = Math.floor(revenueData.length / 2);
        const firstHalf = revenueData.slice(0, midPoint);
        const secondHalf = revenueData.slice(midPoint);
        const firstHalfAvg =
          firstHalf.reduce((sum, r) => sum + r.value, 0) / firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((sum, r) => sum + r.value, 0) / secondHalf.length;
        const growthRate =
          ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        // Calculate variance for stability analysis
        const variance =
          values.reduce((sum, val) => sum + (val - avgMonthly) ** 2, 0) /
          values.length;
        const stdDev = Math.sqrt(variance);

        yield {
          content: "Analyzing your revenue data...",
        };

        const coefficientOfVariation = (stdDev / avgMonthly) * 100;

        logger.info("Revenue tool response", {
          header,
          totalLine,
          monthly,
          analytics: {
            avgMonthly,
            maxRevenue,
            minRevenue,
            growthRate,
            coefficientOfVariation,
          },
        });

        // Calculate additional metrics for better analysis
        const totalMonths = Math.ceil(
          (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
        );
        const revenueConsistency = revenueData.length / totalMonths;
        const isSeasonal = maxRevenue > avgMonthly * 1.5;
        const growthDirection =
          growthRate > 5
            ? "strong growth"
            : growthRate > 0
              ? "steady growth"
              : growthRate > -5
                ? "stable"
                : "declining";
        const stabilityLevel =
          coefficientOfVariation < 20
            ? "very stable"
            : coefficientOfVariation < 40
              ? "moderately stable"
              : "highly variable";

        // Enhanced analytics with structured business insights
        const analyticsSection = [
          "",
          "**Revenue Analytics:**",
          `Average Monthly Revenue: ${fmt(avgMonthly)}`,
          `Peak Performance: ${format(new Date(maxMonth!.date), "MMM yyyy")} with ${fmt(maxRevenue)}`,
          `Lowest Month: ${format(new Date(minMonth!.date), "MMM yyyy")} with ${fmt(minRevenue)}`,
          `Revenue Range: ${fmt(minRevenue)} - ${fmt(maxRevenue)} (${fmt(maxRevenue - minRevenue)} spread)`,
          "",
          "**Growth & Trends:**",
          `Growth Rate: ${growthRate > 0 ? "+" : ""}${growthRate.toFixed(1)}% (first half vs second half comparison)`,
          `Revenue Stability: ${coefficientOfVariation.toFixed(1)}% coefficient of variation`,
          `Active Revenue Months: ${revenueData.length} out of ${totalMonths} months (${(revenueConsistency * 100).toFixed(1)}% consistency)`,
          "",
          "**Business Insights:**",
          `Revenue shows ${growthDirection} pattern with ${stabilityLevel} performance`,
          isSeasonal
            ? `Strong seasonal peak in ${format(new Date(maxMonth!.date), "MMM yyyy")} - consider capitalizing on this pattern`
            : "Revenue distribution is relatively even across months",
          coefficientOfVariation < 20
            ? "Very stable revenue pattern indicates predictable cash flow"
            : coefficientOfVariation < 40
              ? "Moderate revenue variability suggests some seasonal patterns"
              : "High revenue variability - consider diversifying income streams for stability",
          "",
          "**Analysis Context:**",
          `Analysis period: ${format(fromDate, "MMM dd, yyyy")} to ${format(toDate, "MMM dd, yyyy")} (${totalMonths} months)`,
          `Currency: ${resolvedCurrency || "Team base currency"}`,
          `Data completeness: ${(revenueConsistency * 100).toFixed(1)}% of months had revenue activity`,
        ];

        // Enhanced content with structured analysis
        const detailedContent = [
          header,
          totalLine,
          "",
          "**Monthly Revenue Breakdown:**",
          ...monthly,
          ...analyticsSection,
          "",
          "**Key Takeaways:**",
          `Total revenue of ${fmt(total)} over ${revenueData.length} active months`,
          `${growthRate > 0 ? "Growing" : "Declining"} business with ${Math.abs(growthRate).toFixed(1)}% ${growthRate > 0 ? "growth" : "decline"} rate`,
          `Revenue ${coefficientOfVariation < 30 ? "stability is good" : "shows significant variability"} (${coefficientOfVariation.toFixed(1)}% variance)`,
          `Best performing month was ${format(new Date(maxMonth!.date), "MMM yyyy")} with ${fmt(maxRevenue)}`,
          `Revenue consistency: ${(revenueConsistency * 100).toFixed(1)}% of months had revenue activity`,
        ];

        // Create metric cards for revenue analysis
        const cards = [
          createMetricCard("Total Revenue", total, currency || "USD", {
            subtitle: `Over ${revenueData.length} active months`,
            status:
              growthRate > 5
                ? {
                    level: "good",
                    message: "Strong growth",
                  }
                : growthRate > 0
                  ? {
                      level: "good",
                      message: "Steady growth",
                    }
                  : {
                      level: "warning",
                      message: "Declining revenue",
                    },
          }),
          createMetricCard(
            "Average Monthly Revenue",
            avgMonthly,
            currency || "USD",
            {
              subtitle: "Current revenue rate",
              trend: {
                value: growthRate,
                direction:
                  growthRate > 5 ? "up" : growthRate < -5 ? "down" : "stable",
                description: "vs first half",
              },
              status:
                coefficientOfVariation < 20
                  ? {
                      level: "good",
                      message: "Very stable revenue",
                    }
                  : coefficientOfVariation < 40
                    ? {
                        level: "warning",
                        message: "Moderate variability",
                      }
                    : {
                        level: "error",
                        message: "High variability",
                      },
            },
          ),
          createMetricCard("Growth Rate", growthRate, "%", {
            format: "percentage",
            subtitle: "First half vs second half",
            status:
              growthRate > 5
                ? {
                    level: "good",
                    message: "Strong growth",
                  }
                : growthRate > 0
                  ? {
                      level: "good",
                      message: "Positive growth",
                    }
                  : {
                      level: "warning",
                      message: "Declining growth",
                    },
          }),
          createMetricCard("Revenue Stability", coefficientOfVariation, "%", {
            format: "percentage",
            subtitle: "Coefficient of variation",
            status:
              coefficientOfVariation < 20
                ? {
                    level: "good",
                    message: "Predictable revenue",
                  }
                : coefficientOfVariation < 40
                  ? {
                      level: "warning",
                      message: "Some variability",
                    }
                  : {
                      level: "error",
                      message: "High variability",
                    },
          }),
        ];

        // Create summary
        const summary = createSummary(
          "Revenue Analysis Summary",
          `Revenue shows ${growthDirection} with ${stabilityLevel} patterns. Total revenue of ${fmt(total)} over ${revenueData.length} active months with ${(revenueConsistency * 100).toFixed(1)}% data consistency.`,
          [
            `Average monthly revenue: ${fmt(avgMonthly)} with ${coefficientOfVariation.toFixed(1)}% variability`,
            `Peak revenue: ${format(new Date(maxMonth!.date), "MMM yyyy")} (${fmt(maxRevenue)}) | Lowest: ${format(new Date(minMonth!.date), "MMM yyyy")} (${fmt(minRevenue)})`,
            `Growth rate: ${growthRate > 0 ? "+" : ""}${growthRate.toFixed(1)}% (first half vs second half)`,
            `Data completeness: ${(revenueConsistency * 100).toFixed(1)}% of months had revenue activity`,
          ],
          [
            growthRate < 0
              ? "Focus on revenue growth strategies - revenue is declining"
              : null,
            coefficientOfVariation > 40
              ? "Implement revenue forecasting for better planning"
              : null,
            revenueConsistency < 0.8
              ? "Improve revenue tracking consistency to get better insights"
              : null,
          ],
        );

        // Create period information
        const periodInfo = createPeriodInfo(
          from,
          to,
          revenueData.length,
          Math.ceil(
            (toDate.getTime() - fromDate.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
          currency || "USD",
          `${format(fromDate, "MMM yyyy")} - ${format(toDate, "MMM yyyy")}`,
        );

        // Create chart configuration
        const chartConfig = createChartConfig("area", {
          title: "Monthly Revenue Trend",
          height: 200,
          showLegend: false,
          showGrid: true,
        });

        // Create dashboard layout with chart
        const dashboard = createDashboardLayout(
          "Revenue Analysis",
          cards,
          summary,
          {
            columns: 4,
            chart: {
              config: chartConfig,
              data: revenueData.map((r) =>
                createTimeSeriesPoint(
                  format(new Date(r.date), "MMM yyyy"),
                  r.value,
                  {
                    label: `Revenue: ${fmt(r.value)}`,
                    metadata: {
                      date: r.date,
                      currency: r.currency,
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
          "Revenue Analysis",
          total,
          currency || "USD",
          dashboard,
          revenueData.map((r) =>
            createTimeSeriesPoint(
              format(new Date(r.date), "MMM yyyy"),
              r.value,
              {
                label: `Revenue: ${fmt(r.value)}`,
                metadata: {
                  date: r.date,
                  currency: r.currency,
                },
              },
            ),
          ),
          from,
          to,
          {
            description: `Comprehensive revenue analysis showing ${growthDirection} patterns with ${stabilityLevel} revenue control.`,
            average: avgMonthly,
            period: periodInfo,
            metadata: {
              analysisType: "revenue",
              growthRate,
              stability: coefficientOfVariation,
              direction: growthDirection,
              consistency: revenueConsistency,
            },
          },
        );

        yield {
          content: "Generating revenue dashboard...",
        };

        // Send completion with canvas data via writer only if showCanvas is true
        if (showCanvas) {
          writer.write({
            type: "data-canvas",
            data: {
              title: "Revenue Analysis",
              canvasData: canvasData,
              loading: false,
            },
          });
        }

        yield {
          content: detailedContent.join("\n"),
        };
      } catch (error) {
        logger.error("Error executing getRevenueTool", {
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    },
  });
