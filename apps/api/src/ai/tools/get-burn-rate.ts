import type { ToolContext } from "@api/ai/context";
import { logger } from "@midday/logger";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { BurnRateCanvasTool } from "../canvas/burn-rate-canvas-tool";
import { getBurnRateSchema } from "./schema";

// 1️⃣ Create the tool using the canvas class
export const getBurnRateTool = ({ db, user, writer }: ToolContext) =>
  tool({
    description: `Get burn rate analysis with runway projections and optimization recommendations. 
Shows current burn rate, monthly trends, cash runway, future projections, and actionable insights for financial planning.`,
    inputSchema: getBurnRateSchema,
    execute: async function* ({ from, to, currency, showCanvas }) {
      try {
        logger.info("Executing getBurnRateTool", {
          from,
          to,
          currency,
          showCanvas,
        });

        // 2️⃣ Use the canvas tool for all canvas logic
        const fromDate = startOfMonth(new Date(from));
        const toDate = endOfMonth(new Date(to));
        const teamCurrency = currency || user.baseCurrency || "USD";
        const period = `${format(fromDate, "MMM yyyy")} - ${format(toDate, "MMM yyyy")}`;

        // Create canvas tool instance
        const burnRateCanvas = new BurnRateCanvasTool(
          writer,
          teamCurrency,
          period,
        );

        // Execute canvas rendering (handles all progressive loading + AI summary)
        try {
          yield* burnRateCanvas.execute(db, user, from, to, showCanvas);
        } catch (canvasError) {
          logger.error("Error in burn rate canvas execution", { canvasError });
          throw canvasError;
        }

        // 3️⃣ Generate text response (separate from canvas)
        yield {
          display: "hidden",
          content: `**Burn Rate Analysis Complete**

I've analyzed your burn rate for ${period}. The interactive analysis shows:

• **Current financial health** and monthly burn rate trends
• **Cash runway projections** with confidence intervals  
• **Month-by-month breakdown** of revenue vs expenses
• **6-month forecasts** based on current patterns
• **Optimization recommendations** with potential savings

Key insights and actionable recommendations are displayed in the canvas with AI-generated strategic analysis.

Would you like me to dive deeper into any specific aspect of your burn rate or explore cost optimization strategies?`,
        };
      } catch (error) {
        logger.error("Error in getBurnRateTool", { error });
        throw error;
      }
    },
  });
