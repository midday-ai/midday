import type { ToolContext } from "@api/ai/types";
import { getRevenue } from "@db/queries";
import { logger } from "@midday/logger";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { toolMetadata } from "./registry";

export const getRevenueTool = ({ db, user, writer }: ToolContext) =>
  tool({
    ...toolMetadata.getRevenue,
    execute: async ({ from, to, currency }) => {
      // if (writer) {
      //   writer.write({
      //     type: "data-title",
      //     id: "revenue-summary",
      //     data: {
      //       title: "Revenue Summary",
      //       currency: currency ?? undefined,
      //       from: from,
      //       to: to,
      //     },
      //   });
      // }

      try {
        logger.info("Executing getRevenueTool", { from, to, currency });

        // Use the provided dates (which now have defaults from the schema)
        const fromDate = startOfMonth(new Date(from));
        const toDate = endOfMonth(new Date(to));

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

        const monthly = revenueData.map(
          (r) => `${format(new Date(r.date), "MMM yyyy")}: ${fmt(r.value)}`,
        );

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

        // Return structured data that AI can use for analysis
        const analyticsSection = [
          "",
          "**Analytics Data:**",
          `Average Monthly: ${fmt(avgMonthly)}`,
          `Highest Month: ${format(new Date(maxMonth!.date), "MMM yyyy")} (${fmt(maxRevenue)})`,
          `Lowest Month: ${format(new Date(minMonth!.date), "MMM yyyy")} (${fmt(minRevenue)})`,
          `Growth Trend: ${growthRate > 0 ? "+" : ""}${growthRate.toFixed(1)}% (comparing first half to second half)`,
          `Revenue Stability: ${coefficientOfVariation.toFixed(1)}% variance (lower = more stable)`,
          `Total Months with Revenue: ${revenueData.length}`,
        ];

        return {
          display: "hidden", // Hide raw output, show pill + AI analysis instead
          content: [
            header,
            totalLine,
            "",
            "**Monthly Breakdown:**",
            ...monthly,
            ...analyticsSection,
          ].join("\n"),
        };
      } catch (error) {
        logger.error("Error executing getRevenueTool", {
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    },
  });
