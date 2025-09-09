import type { ToolContext } from "@api/ai/context";
import { logger } from "@midday/logger";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ExpenseCanvasTool } from "../canvas/expense-canvas-tool";
import { getExpensesSchema } from "./schema";

// 1️⃣ Create the tool using the new canvas class
export const getExpensesTool = ({ db, user, writer }: ToolContext) =>
  tool({
    description: `Get comprehensive expense analysis with transaction breakdown and spending insights. 
Shows biggest transactions, spending by category, metrics, and provides AI-powered optimization recommendations.`,
    inputSchema: getExpensesSchema,
    execute: async function* ({ from, to, currency, showCanvas }) {
      try {
        logger.info("Executing getExpensesTool", {
          from,
          to,
          currency,
          showCanvas,
        });

        // 2️⃣ Use the new canvas tool for all canvas logic
        const fromDate = startOfMonth(new Date(from));
        const toDate = endOfMonth(new Date(to));
        const teamCurrency = currency || user.baseCurrency || "USD";
        const period = `${format(fromDate, "MMM yyyy")} - ${format(toDate, "MMM yyyy")}`;

        // Create canvas tool instance
        const expenseCanvas = new ExpenseCanvasTool(
          writer,
          teamCurrency,
          period,
        );

        // Execute canvas rendering (handles all progressive loading + AI summary)
        try {
          yield* expenseCanvas.execute(db, user, from, to, showCanvas);
        } catch (canvasError) {
          logger.error("Error in expense canvas execution", { canvasError });
          throw canvasError;
        }

        // 3️⃣ Generate text response (separate from canvas)
        yield {
          content: `**Expense Analysis Complete**

I've analyzed your expenses for ${period}. The interactive breakdown shows:

• **Transaction analysis** with your biggest expenses and spending patterns
• **Category breakdown** showing where your money is going
• **Key metrics** including average transaction size and spending concentration
• **AI-generated insights** with personalized optimization recommendations

The canvas displays your top transactions, spending distribution, and data-driven recommendations to help optimize your expenses.

Would you like me to dive deeper into any specific category or explore cost-saving opportunities?`,
        };
      } catch (error) {
        logger.error("Error in getExpensesTool", { error });
        throw error;
      }
    },
  });
