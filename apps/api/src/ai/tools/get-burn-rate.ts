import type { ToolContext } from "@api/ai/context";
import { logger } from "@midday/logger";
import { tool } from "ai";
import { getBurnRateSchema } from "./schema";

// 1️⃣ Create the tool using the canvas class
export const getBurnRateTool = ({ db, user, writer }: ToolContext) =>
  tool({
    description: `Get burn rate analysis with runway projections and optimization recommendations. 
Shows current burn rate, monthly trends, cash runway, future projections, and actionable insights for financial planning.`,
    inputSchema: getBurnRateSchema,
    execute: async ({ from, to, currency, showCanvas }) => {
      try {
        logger.info("Executing getBurnRateTool", {
          from,
          to,
          currency,
          showCanvas,
        });

        return null;
      } catch (error) {
        logger.error("Error in getBurnRateTool", { error });
        throw error;
      }
    },
  });
