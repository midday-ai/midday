import { getMetricsQuery } from "@midday/supabase/queries";
import type { Client } from "@midday/supabase/types";
import { startOfMonth } from "date-fns";
import { z } from "zod";

export function getProfitTool({
  defaultValues,
  supabase,
  teamId,
}: {
  defaultValues: {
    from: string;
    to: string;
  };
  supabase: Client;
  teamId: string;
}) {
  return {
    description: "Get profit",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date of the profit, in ISO-8601 format")
        .default(new Date(defaultValues.from)),
      endDate: z.coerce
        .date()
        .describe("The end date of the profit, in ISO-8601 format")
        .default(new Date(defaultValues.to)),
      currency: z.string().describe("The currency for profit").optional(),
    }),
    execute: async ({
      currency,
      startDate,
      endDate,
    }: { currency?: string; startDate: Date; endDate: Date }) => {
      const data = await getMetricsQuery(supabase, {
        teamId,
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: new Date(endDate).toISOString(),
        type: "profit",
        currency,
      });

      if (!data) {
        return "No profit data found";
      }

      return `Based on the period from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}, the current profit is ${Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency: data.summary.currency,
        },
      ).format(data.summary.currentTotal)}`;
    },
  };
}
