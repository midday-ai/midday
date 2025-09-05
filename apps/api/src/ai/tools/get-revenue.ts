import type { ToolContext } from "@api/ai/types";
import { getRevenue } from "@db/queries";
import { logger } from "@midday/logger";
import { formatAmount } from "@midday/utils/format";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

export const getRevenueTool = ({ db, teamId, locale }: ToolContext) =>
  tool({
    description:
      "Get revenue for a period, including total and a monthly breakdown. Use when users ask about revenue.",
    inputSchema: z.object({
      from: z
        .string()
        .nullable()
        .describe(
          "The start date when to retrieve data from. If not provided, defaults to the current date. Return ISO-8601 format.",
        ),
      to: z
        .string()
        .nullable()
        .describe(
          "The end date when to retrieve data from. If not provided, defaults to the current date plus 12 months. Return ISO-8601 format.",
        ),
      currency: z
        .string()
        .describe("Optional currency code (e.g., 'USD', 'SEK').")
        .nullable(),
    }),
    execute: async ({ from, to, currency }) => {
      try {
        logger.info("Executing getRevenueTool", { from, to, currency });

        // Resolve dates (default: last 12 months through end of current month)
        const fromDate = startOfMonth(
          from ? new Date(from) : subMonths(new Date(), 12),
        );

        const toDate = endOfMonth(to ? new Date(to) : new Date());

        const rows = await getRevenue(db, {
          teamId,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          currency: currency ?? undefined,
        });

        const total = rows.reduce((sum, r) => sum + Number(r.value || 0), 0);

        // Determine currency to display (explicit param > data currency > base)
        const resolvedCurrency = currency ?? rows[0]?.currency ?? null;

        const fmt = (amount: number) =>
          resolvedCurrency
            ? formatAmount({
                amount,
                currency: resolvedCurrency,
                locale: locale ?? undefined,
              })
            : `${amount.toLocaleString()} (base currency)`;

        const monthly = rows
          .filter((r) => Number(r.value) > 0)
          .map(
            (r) =>
              `${format(new Date(r.date), "MMM yyyy")}: ${fmt(Number(r.value))}`,
          );

        const period = `${format(fromDate, "MMM yyyy")} - ${format(
          toDate,
          "MMM yyyy",
        )}`;
        const header = `**Revenue Summary (${period})**`;
        const totalLine = `Total Revenue: ${fmt(total)}`;

        if (monthly.length === 0) {
          return `${header}\n${totalLine}\n\nNo revenue recorded for this period.`;
        }

        logger.info("Revenue tool response", {
          header,
          totalLine,
          monthly,
        });

        return [
          header,
          totalLine,
          "",
          "**Monthly Breakdown:**",
          ...monthly,
        ].join("\n");
      } catch (error) {
        logger.error("Error executing getRevenueTool", {
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    },
  });
