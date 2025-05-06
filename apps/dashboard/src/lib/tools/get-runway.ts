import { getQueryClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import { tool } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

export const getRunway = tool({
  description: "Get runway",
  parameters: z.object({
    startDate: z.coerce
      .date()
      .describe("The start date of the runway, in ISO-8601 format")
      // Default to 12 months ago
      .default(subMonths(new Date(), 12)),
    endDate: z.coerce
      .date()
      .describe("The end date of the runway, in ISO-8601 format")
      .default(new Date()),
    currency: z.string().describe("The currency for the runway").optional(),
  }),
  execute: async ({ startDate, endDate, currency }) => {
    const queryClient = getQueryClient();

    const months = await queryClient.fetchQuery(
      trpc.metrics.runway.queryOptions({
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: new Date(endDate).toISOString(),
        currency,
      }),
    );

    return `The runway is ${months} months`;
  },
});
