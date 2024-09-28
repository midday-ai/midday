import { getBurnRateQuery } from "@midday/supabase/queries";
import type { Client } from "@midday/supabase/types";
import { startOfMonth } from "date-fns";
import { z } from "zod";

export function getBurnRateTool({
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
    description: "Get burn rate",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date of the burn rate, in ISO-8601 format")
        .default(new Date(defaultValues.from)),
      endDate: z.coerce
        .date()
        .describe("The end date of the burn rate, in ISO-8601 format")
        .default(new Date(defaultValues.to)),
      currency: z
        .string()
        .describe("The currency for the burn rate")
        .optional(),
    }),
    execute: async ({
      currency,
      startDate,
      endDate,
    }: { currency?: string; startDate: Date; endDate: Date }) => {
      const { data } = await getBurnRateQuery(supabase, {
        currency,
        from: startOfMonth(startDate).toISOString(),
        to: endDate.toISOString(),
        teamId,
      });

      if (!data) {
        return "No burn rate found";
      }

      const averageBurnRate =
        data?.reduce((acc, curr) => acc + curr.value, 0) / data?.length;

      return `Based on your historical data, your average burn rate is ${Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency: data.at(0)?.currency,
        },
      ).format(averageBurnRate)} per month.`;
    },
  };
}
