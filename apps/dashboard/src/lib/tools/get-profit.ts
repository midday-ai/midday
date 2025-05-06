import { getQueryClient, trpc } from "@/trpc/server";
import { tool } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

export type GetProfitResult = Awaited<ReturnType<typeof getProfit.execute>>;

export const getProfit = tool({
  description: "Get profit",
  parameters: z.object({
    from: z.coerce
      .date()
      .describe("The start date of the profit, in ISO-8601 format")
      // Default to 12 months ago
      .default(subMonths(new Date(), 12)),
    to: z.coerce
      .date()
      .describe("The end date of the profit, in ISO-8601 format")
      .default(new Date()),
    currency: z.string().describe("The currency for profit").optional(),
  }),
  execute: async ({ from, to, currency }) => {
    const queryClient = getQueryClient();

    const data = await queryClient.fetchQuery(
      trpc.metrics.profit.queryOptions({
        from: startOfMonth(new Date(from)).toISOString(),
        to: new Date(to).toISOString(),
        currency,
      }),
    );

    return {
      result: `The profit is ${data.summary.currentTotal} ${data.summary.currency} for the period ${from.toISOString()} to ${to.toISOString()}`,
      params: {
        from: from.toISOString(),
        to: to.toISOString(),
        currency,
      },
    };
  },
});
