import { getQueryClient, trpc } from "@/trpc/server";
import { tool } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

export const getSpending = tool({
  description: "Get spending from category",
  parameters: z.object({
    currency: z.string().describe("The currency for spending").optional(),
    category: z.string().describe("The category for spending"),
    startDate: z.coerce
      .date()
      .describe("The start date of the spending, in ISO-8601 format")
      // Default to 12 months ago
      .default(subMonths(new Date(), 12)),
    endDate: z.coerce
      .date()
      .describe("The end date of the spending, in ISO-8601 format")
      .default(new Date()),
  }),
  execute: async ({ category, startDate, endDate, currency }) => {
    const queryClient = getQueryClient();

    const data = await queryClient.fetchQuery(
      trpc.metrics.spending.queryOptions({
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: new Date(endDate).toISOString(),
        currency,
      }),
    );

    const found = data?.find(
      (c) => category.toLowerCase() === c?.name?.toLowerCase(),
    );

    return `Found ${found?.amount} ${currency} in ${category} from ${startDate} to ${endDate}`;
  },
});
