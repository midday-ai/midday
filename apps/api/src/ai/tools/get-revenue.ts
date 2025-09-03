import type { ToolContext } from "@api/ai/types";
import { getRevenue } from "@db/queries";
import { tool } from "ai";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

export const getRevenueTool = ({ db, teamId }: ToolContext) =>
  tool({
    description:
      "Get revenue data for a specific time period. Shows total revenue and monthly breakdown. Use this when users ask about revenue.",
    parameters: z.object({
      from: z.coerce
        .date()
        .describe("The start date for revenue data (defaults to 12 months ago)")
        .default(subMonths(new Date(), 12)),
      to: z.coerce
        .date()
        .describe("The end date for revenue data (defaults to today)")
        .default(new Date()),
      currency: z
        .string()
        .describe(
          "Optional currency code (e.g., 'USD', 'SEK'). If not specified, uses base currency",
        )
        .optional(),
    }),
    execute: async ({ from, to, currency }) => {
      const data = await getRevenue(db, {
        teamId,
        from: startOfMonth(from).toISOString(),
        to: endOfMonth(to).toISOString(),
        currency,
      });

      const total = data.reduce((acc, curr) => acc + Number(curr.value), 0);
      const currencyDisplay = currency || "base currency";

      // Format the result for better chat display
      const monthlyBreakdown = data
        .filter((item) => Number(item.value) > 0)
        .map(
          (item) =>
            `${item.date}: ${Number(item.value).toLocaleString()} ${currencyDisplay}`,
        )
        .join("\n");

      const content = monthlyBreakdown
        ? `Total revenue: ${total.toLocaleString()} ${currencyDisplay}\n\nMonthly breakdown:\n${monthlyBreakdown}`
        : `Total revenue: ${total.toLocaleString()} ${currencyDisplay} (no revenue recorded for this period)`;

      return content;
    },
  });
