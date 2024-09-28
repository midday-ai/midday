import { getRunwayQuery } from "@midday/supabase/queries";
import type { Client } from "@midday/supabase/types";
import { startOfMonth } from "date-fns";
import { z } from "zod";

export function getRunwayTool({
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
    description: "Get the runway",
    parameters: z.object({
      currency: z.string().describe("The currency for the runway").optional(),
      startDate: z.coerce
        .date()
        .describe("The start date of the runway, in ISO-8601 format")
        .default(new Date(defaultValues.from)),
      endDate: z.coerce
        .date()
        .describe("The end date of the runway, in ISO-8601 format")
        .default(new Date(defaultValues.to)),
    }),
    execute: async ({
      currency,
      startDate,
      endDate,
    }: { currency?: string; startDate: Date; endDate: Date }) => {
      const { data } = await getRunwayQuery(supabase, {
        currency,
        from: startOfMonth(startDate).toISOString(),
        to: endDate.toISOString(),
        teamId,
      });

      if (!data) {
        return "No runway found";
      }

      return `Runway with currency ${currency} is ${data} months. Based on the data from ${startDate.toISOString()} to ${endDate.toISOString()}.`;
    },
  };
}
