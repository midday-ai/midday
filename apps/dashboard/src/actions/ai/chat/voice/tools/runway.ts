import { getRunway } from "@midday/supabase/cached-queries";
import { addMonths, format, startOfMonth } from "date-fns";
import { z } from "zod";

type Args = {
  currency: string;
  dateFrom: string;
  dateTo: string;
};

export function getRunwayTool({ currency, dateFrom, dateTo }: Args) {
  return {
    description: "What's my runway",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date of the runway, in ISO-8601 format")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date of the runway, in ISO-8601 format")
        .default(new Date(dateTo)),
      currency: z
        .string()
        .default(currency)
        .describe("The currency for the runway"),
    }),
    execute: async (args) => {
      const { currency, startDate, endDate } = args;

      const { data } = await getRunway({
        currency,
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: endDate.toISOString(),
      });

      if (!data) {
        return "We couldn't find any historical data to provide you with a runway.";
      }

      return `Based on your historical data, your expected runway is ${data} months,
      ending in ${format(addMonths(new Date(), data), "PP")}.`;
    },
  };
}
