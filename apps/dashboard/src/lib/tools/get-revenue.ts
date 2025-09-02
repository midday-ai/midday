import { getQueryClient, trpc } from "@/trpc/server";
import { tool } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

export type GetRevenueResult = Awaited<ReturnType<typeof getRevenue.execute>>;

export const getRevenue = tool({
  description: "Get revenue",
  parameters: z.object({
    from: z.coerce
      .date()
      .describe("The start date of the revenue, in ISO-8601 format")
      // Default to 12 months ago
      .default(subMonths(new Date(), 12)),
    to: z.coerce
      .date()
      .describe("The end date of the revenue, in ISO-8601 format")
      .default(new Date()),
    currency: z.string().describe("The currency for revenue").optional(),
  }),
  execute: async ({ from, to, currency }) => {
    const queryClient = getQueryClient();

    const data = await queryClient.fetchQuery(
      trpc.reports.revenue.queryOptions({
        from: startOfMonth(new Date(from)).toISOString(),
        to: new Date(to).toISOString(),
        currency,
      }),
    );

    return {
      result: `The revenue is ${data.summary.currentTotal} ${data.summary.currency} for the period ${from.toISOString()} to ${to.toISOString()}`,
      params: {
        from: from.toISOString(),
        to: to.toISOString(),
        currency,
      },
    };
  },
});
