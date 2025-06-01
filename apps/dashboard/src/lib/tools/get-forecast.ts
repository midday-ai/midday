import { getQueryClient, trpc } from "@/trpc/server";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { tool } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

export const getForecast = tool({
  description: "Get forecast",
  parameters: z.object({
    name: z.string().describe("The name of the document"),
    startDate: z.coerce
      .date()
      .describe("The start date of the forecast, in ISO-8601 format")
      // Default to 12 months ago
      .default(subMonths(new Date(), 12)),
    endDate: z.coerce
      .date()
      .describe("The end date of the forecast, in ISO-8601 format")
      .default(new Date()),
    currency: z.string().describe("The currency for forecast").optional(),
    type: z.enum(["profit", "revenue"]).describe("The type of forecast"),
  }),
  execute: async ({ startDate, endDate, currency, type }) => {
    const queryClient = getQueryClient();

    let data:
      | RouterOutputs["metrics"]["revenue"]
      | RouterOutputs["metrics"]["profit"]
      | null = null;

    if (type === "revenue") {
      data = await queryClient.fetchQuery(
        trpc.metrics.revenue.queryOptions({
          from: startOfMonth(new Date(startDate)).toISOString(),
          to: new Date(endDate).toISOString(),
          currency,
        }),
      );
    }

    if (type === "profit") {
      data = await queryClient.fetchQuery(
        trpc.metrics.profit.queryOptions({
          from: startOfMonth(new Date(startDate)).toISOString(),
          to: new Date(endDate).toISOString(),
          currency,
        }),
      );
    }

    if (!data) {
      return "No data found";
    }

    const prev = data?.result?.map((d) => {
      return `${d.current.date}: ${Intl.NumberFormat("en", {
        style: "currency",
        currency: data.meta.currency,
      }).format(d.current.value)}\n`;
    });

    return `Based on the following historical ${type} data for the last 12 months:
${prev?.join("")}
Current date is: ${new Date().toISOString().split("T")[0]}

Please calculate and provide the forecasted ${type} for the next month. Only return the forecasted value and its currency.`;
  },
});
