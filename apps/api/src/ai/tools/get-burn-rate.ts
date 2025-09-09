import type { ToolContext } from "@api/ai/context";
import { getBurnRate, getRunway } from "@db/queries";
import { logger } from "@midday/logger";
import { createUIMessageStream, tool } from "ai";
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

export const getBurnRateTool = ({ db, user, writer }: ToolContext) =>
  tool({
    ...toolMetadata.getBurnRate,
    async *execute({ from, to, currency, showCanvas }, { toolCallId }) {
      // Send canvas with loading state only if showCanvas is true
      if (showCanvas) {
        console.log(
          "🎨 STEP 1: Sending canvas loading state - CANVAS SHOULD SHOW NOW",
        );
        writer.write({
          type: "data-canvas",
          data: {
            title: "Burn Rate Analysis",
            loading: true,
            // No canvasData = loading state
          },
        });
      }
      console.log("🎨 Canvas loading state sent");

      // Yield initial status
      yield {
        content: "Analyzing your burn rate data...",
      };

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      yield {
        content: "Calculating monthly burn rate and runway projections...",
      };

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create some sample burn rate data
      const cards = [
        createMetricCard("Monthly Burn Rate", 45000, currency || "USD", {
          id: "monthly-burn",
          trend: {
            value: 15,
            direction: "up",
            description: "15% increase from last month",
          },
        }),
        createMetricCard("Runway", 18, "months", {
          id: "runway",
          format: "duration",
          trend: {
            value: -3,
            direction: "down",
            description: "3 months less than last quarter",
          },
        }),
        createMetricCard("Average Daily Burn", 1500, currency || "USD", {
          id: "avg-burn",
        }),
        createMetricCard("Current Cash Balance", 810000, currency || "USD", {
          id: "cash-balance",
        }),
      ];

      const summary = createSummary(
        "Burn Rate Analysis Summary",
        "Your current burn rate indicates a monthly spend of $45,000 with 18 months of runway remaining.",
        [
          "Monthly burn rate has increased by 15%",
          "Runway decreased by 3 months",
        ],
        [
          "Consider cost optimization measures",
          "Review major expense categories",
        ],
      );

      const dashboard = createDashboardLayout(
        "Burn Rate Analysis",
        cards,
        summary,
      );

      const canvasData = createCanvasData(
        "dashboard",
        "Burn Rate Analysis",
        45000,
        currency || "USD",
        dashboard,
        [],
        from,
        to,
      );

      yield {
        content: "Generating burn rate dashboard...",
      };

      // Send completion with canvas data via writer
      // Send completion with canvas data only if showCanvas is true
      if (showCanvas) {
        console.log("🎨 STEP 2: Sending canvas completion data");
        writer.write({
          type: "data-canvas",
          data: {
            title: "Burn Rate Analysis",
            canvasData: canvasData,
            loading: false,
          },
        });
        console.log("🎨 Canvas completion data sent");
      }

      yield {
        content:
          "Based on your current burn rate analysis, you're spending approximately $45,000 per month with an 18-month runway remaining.",
      };
    },
  });
