import type { ToolContext } from "@api/ai/types";
import { getBurnRate, getRunway } from "@db/queries";
import { logger } from "@midday/logger";
import { tool } from "ai";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { toolMetadata } from "./registry";

export const getBurnRateTool = ({ db, user, writer }: ToolContext) =>
  tool({
    ...toolMetadata.getBurnRate,
    execute: async ({ from, to, currency }, { toolCallId }) => {
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
        logger.info("Executing getBurnRateTool", { from, to, currency });

        // Use the provided dates (which now have defaults from the schema)
        const fromDate = startOfMonth(new Date(from));
        const toDate = endOfMonth(new Date(to));

        const [rows, runway] = await Promise.all([
          getBurnRate(db, {
            teamId: user.teamId,
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            currency: currency ?? undefined,
          }),
          getRunway(db, {
            teamId: user.teamId,
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            currency: currency ?? undefined,
          }),
        ]);

        // Determine currency to display (explicit param > data currency > base)
        const resolvedCurrency = currency ?? rows[0]?.currency ?? null;

        const fmt = (amount: number) =>
          resolvedCurrency
            ? new Intl.NumberFormat(user.locale ?? undefined, {
                style: "currency",
                currency: resolvedCurrency,
                maximumFractionDigits: 0,
              }).format(amount)
            : `${amount.toLocaleString()} (base currency)`;

        const burnRateLines = rows.map(
          (row) =>
            `${format(new Date(row.date), "MMM yyyy")}: ${fmt(Number(row.value || 0))}`,
        );

        // Calculate total burn rate for canvas data
        const totalBurnRate = rows.reduce(
          (sum, row) => sum + Number(row.value || 0),
          0,
        );

        // Stream canvas data via writer - these will be automatically added to message parts
        if (writer) {
          // Stream canvas title first
          writer.write({
            type: "data-canvas-title",
            id: toolCallId,
            data: {
              presentation: "canvas",
              type: "canvas-title",
              title: "Burn Rate Analysis",
            },
          });

          // Stream canvas data
          writer.write({
            type: "data-canvas",
            id: toolCallId,
            data: {
              presentation: "canvas",
              type: "chart",
              chartType: "area",
              title: "Burn Rate Analysis",
              data: {
                rate: totalBurnRate,
                currency: resolvedCurrency || "USD",
                breakdown: rows.map((row) => ({
                  month: format(new Date(row.date), "MMM yyyy"),
                  value: Number(row.value || 0),
                })),
                from,
                to,
              },
            },
          });
        }

        return {
          display: "hidden",
          content: [
            "**Burn Rate:**",
            ...burnRateLines,
            "",
            "**Runway:**",
            `${runway} months`,
          ].join("\n"),
        };
      } catch (error) {
        logger.error("Error executing getBurnRateTool", {
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    },
  });
