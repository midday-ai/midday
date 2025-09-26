import { getBurnRate, getRunway, getSpending } from "@db/queries";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { followupQuestionsArtifact } from "../artifacts/followup-questions";
import { getContext } from "../context";
import { generateFollowupQuestions } from "../utils/generate-followup-questions";
import { getBurnRateSchema } from "./schema";

export const getBurnRateTool = tool({
  description:
    "Calculate and analyze monthly cash burn rate, showing how much money the business spends each month. Use this tool when users ask about spending patterns, cash flow analysis, or want to understand their monthly expenses and financial runway.",
  inputSchema: getBurnRateSchema.omit({ showCanvas: true }),
  execute: async function* ({ from, to, currency }) {
    try {
      const context = getContext();

      // Run all database queries in parallel for maximum performance
      const [burnRateData, runway, spendingData] = await Promise.all([
        getBurnRate(context.db, {
          teamId: context.user.teamId,
          from,
          to,
          currency: currency ?? undefined,
        }),
        getRunway(context.db, {
          teamId: context.user.teamId,
          from,
          to,
          currency: currency ?? undefined,
        }),
        getSpending(context.db, {
          teamId: context.user.teamId,
          from,
          to,
          currency: currency ?? undefined,
        }),
      ]);

      // Early return if no data
      if (burnRateData.length === 0) {
        yield { text: "No burn rate data available for the selected period." };

        return {
          currentMonthlyBurn: 0,
          runway: 0,
          topCategory: "No data",
          topCategoryPercentage: 0,
          burnRateChange: 0,
          summary: "No data available",
        };
      }

      // Calculate basic metrics from burn rate data
      const currentMonthlyBurn =
        burnRateData.length > 0
          ? burnRateData[burnRateData.length - 1]?.value || 0
          : 0;

      // Get the highest spending category (first item is highest)
      const highestCategory =
        spendingData.length > 0
          ? spendingData[0]
          : {
              name: "Uncategorized",
              slug: "uncategorized",
              amount: 0,
              percentage: 0,
            };

      const highestCategoryPercentage = highestCategory?.percentage || 0;

      // Calculate burn rate change for metrics
      const burnRateStartValue =
        burnRateData.length > 0 ? burnRateData[0]?.value || 0 : 0;
      const burnRateEndValue = currentMonthlyBurn;
      const burnRateChangePercentage =
        burnRateStartValue > 0
          ? Math.round(
              ((burnRateEndValue - burnRateStartValue) / burnRateStartValue) *
                100,
            )
          : 0;
      const burnRateChangePeriod = `${burnRateData.length} months`;

      // Get the target currency for display
      const targetCurrency = currency ?? context.user.baseCurrency ?? "USD";

      // Format the data for response
      const formattedData = {
        currentMonthlyBurn: formatAmount({
          amount: currentMonthlyBurn,
          currency: targetCurrency,
          locale: context.user.locale ?? undefined,
        }),
        runway: runway,
        topCategory: highestCategory?.name || "Uncategorized",
        topCategoryPercentage: highestCategoryPercentage,
        burnRateChange: burnRateChangePercentage,
        burnRateChangePeriod: burnRateChangePeriod,
        runwayStatus:
          runway >= 12 ? "healthy" : runway >= 6 ? "concerning" : "critical",
      };

      const response = `Here's your burn rate data:
**Monthly Burn Rate:** ${formattedData.currentMonthlyBurn}
**Cash Runway:** ${formattedData.runway} months (${formattedData.runwayStatus})
**Top Category:** ${formattedData.topCategory} (${formattedData.topCategoryPercentage}%)
**Change:** ${formattedData.burnRateChange}% over ${formattedData.burnRateChangePeriod}`;

      // Return the data
      yield { text: response };

      // Generate follow-up questions based on the data output
      const burnRateFollowupQuestions = await generateFollowupQuestions(
        "getBurnRate",
        response,
      );

      // Stream follow-up questions artifact
      const followupStream = followupQuestionsArtifact.stream({
        questions: burnRateFollowupQuestions,
        context: "burn_rate",
      });

      followupStream.complete();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
});
