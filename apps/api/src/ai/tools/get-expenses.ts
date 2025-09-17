import type { ToolContext } from "@api/ai/context";
import { logger } from "@midday/logger";
import { tool } from "ai";
import { getExpensesSchema } from "./schema";

export const getExpensesTool = ({ db, user, writer }: ToolContext) =>
  tool({
    description: `Get comprehensive expense analysis with transaction breakdown and spending insights. 
Shows biggest transactions, spending by category, metrics, and provides AI-powered optimization recommendations.`,
    inputSchema: getExpensesSchema,
    execute: async ({ from, to, currency, showCanvas }) => {
      try {
        logger.info("Executing getExpensesTool", {
          from,
          to,
          currency,
          showCanvas,
        });

        return null;
      } catch (error) {
        logger.error("Error in getExpensesTool", { error });
        throw error;
      }
    },
  });
