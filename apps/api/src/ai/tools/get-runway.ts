import { getWriter } from "@ai-sdk-tools/artifacts";
import type { AppContext } from "@api/ai/agents/config/shared";
import { runwayArtifact } from "@api/ai/artifacts/runway";
import { db } from "@midday/db/client";
import { getRunway } from "@midday/db/queries";
import { tool } from "ai";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getRunwaySchema = z.object({
  from: z
    .string()
    .default(() => startOfMonth(subMonths(new Date(), 12)).toISOString())
    .describe("Start date (ISO 8601)"),
  to: z
    .string()
    .default(() => endOfMonth(new Date()).toISOString())
    .describe("End date (ISO 8601)"),
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. 'USD')")
    .nullable()
    .optional(),
  showCanvas: z.boolean().default(false).describe("Show visual analytics"),
});

export const getRunwayTool = tool({
  description:
    "Calculate cash runway in months based on current account balance and average burn rate. Runway represents how many months the business can operate with current cash reserves at the current spending rate. Use this tool when users ask about cash runway, months of runway, financial runway, or how long they can operate with current cash.",
  inputSchema: getRunwaySchema,
  execute: async function* (
    { from, to, currency, showCanvas },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve runway: Team ID not found in context.",
      };
      return {
        runway: 0,
        status: "unknown",
      };
    }

    try {
      // Initialize artifact only if showCanvas is true
      let analysis: ReturnType<typeof runwayArtifact.stream> | undefined;
      if (showCanvas) {
        const writer = getWriter(executionOptions);
        analysis = runwayArtifact.stream(
          {
            stage: "loading",
            currency: currency || appContext.baseCurrency || "USD",
          },
          writer,
        );
      }

      const runway = await getRunway(db, {
        teamId,
        from,
        to,
        currency: currency ?? undefined,
      });

      // Determine status based on runway months
      let status: "healthy" | "concerning" | "critical";
      let statusMessage: string;

      if (runway >= 12) {
        status = "healthy";
        statusMessage = "healthy";
      } else if (runway >= 6) {
        status = "concerning";
        statusMessage = "concerning";
      } else {
        status = "critical";
        statusMessage = "critical";
      }

      // Build response text
      let responseText = `**Cash Runway:** ${runway} months\n\n`;
      responseText += `**Status:** ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}\n\n`;

      if (runway === 0) {
        responseText +=
          "Unable to calculate runway. This may be due to insufficient data or no burn rate detected.";
      } else {
        responseText +=
          "Cash runway represents how many months your business can operate with current cash reserves at the current spending rate. ";
        if (status === "healthy") {
          responseText +=
            "You have a healthy cash position with 12+ months of runway.";
        } else if (status === "concerning") {
          responseText +=
            "Consider monitoring your burn rate and cash flow closely. You may want to focus on increasing revenue or reducing expenses.";
        } else {
          responseText +=
            "Your runway is critical. Immediate action may be needed to extend your runway through cost reduction, revenue increase, or securing additional funding.";
        }
      }

      // Update artifact with dummy data if showCanvas is true
      if (showCanvas && analysis) {
        await analysis.update({
          stage: "analysis_ready",
          currency: currency || appContext.baseCurrency || "USD",
          chart: {
            monthlyData: [],
          },
          metrics: {
            currentRunway: runway,
            cashBalance: 0,
            averageBurnRate: 0,
            status,
          },
          analysis: {
            summary: responseText,
            recommendations: [],
          },
        });
      }

      // Mention canvas if requested
      if (showCanvas) {
        responseText +=
          "\n\nA detailed visual runway analysis with charts and trends is available.";
      }

      yield { text: responseText };

      return {
        runway,
        status,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve runway: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return {
        runway: 0,
        status: "unknown" as const,
      };
    }
  },
});
