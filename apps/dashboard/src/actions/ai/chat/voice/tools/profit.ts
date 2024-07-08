import { formatAmount } from "@/utils/format";
import { getMetrics } from "@midday/supabase/cached-queries";
import { format, startOfMonth } from "date-fns";
import { z } from "zod";

type Args = {
  currency: string;
  dateFrom: string;
  dateTo: string;
};

export function getProfitTool({ currency, dateFrom, dateTo }: Args) {
  return {
    description: "Get profit",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date of the profit, in ISO-8601 format")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date of the profit, in ISO-8601 format")
        .default(new Date(dateTo)),
      currency: z
        .string()
        .default(currency)
        .describe("The currency for profit"),
    }),
    execute: async (args) => {
      const { currency, startDate, endDate } = args;

      const data = await getMetrics({
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: new Date(endDate).toISOString(),
        type: "profit",
        currency,
      });

      return `Based on the period from ${format(
        startOfMonth(new Date(startDate)),
        "PP"
      )} and{" "}
          ${format(new Date(endDate), "PP")} your current profit is{" "}
            ${formatAmount({
              amount: data.summary.currentTotal,
              currency,
            })}
          .
        `;
    },
  };
}
