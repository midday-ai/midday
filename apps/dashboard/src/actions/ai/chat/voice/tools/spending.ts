import { formatAmount } from "@/utils/format";
import { getSpending } from "@midday/supabase/cached-queries";
import { startOfMonth } from "date-fns";
import { format } from "date-fns";
import { z } from "zod";

type Args = {
  currency: string;
  dateFrom: string;
  dateTo: string;
};

export function getSpendingTool({ currency, dateFrom, dateTo }: Args) {
  return {
    description: "Get spending from transactions",
    parameters: z.object({
      currency: z
        .string()
        .default(currency)
        .describe("The currency for spending"),
      category: z.string().describe("The category for spending"),
      startDate: z.coerce
        .date()
        .describe("The start date of the spending, in ISO-8601 format")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date of the spending, in ISO-8601 format")
        .default(new Date(dateTo)),
    }),
    execute: async (args) => {
      const { startDate, endDate, currency, category } = args;

      const { data } = await getSpending({
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: new Date(endDate).toISOString(),
        currency,
      });

      const found = data.find(
        (c) => category.toLowerCase() === c?.name?.toLowerCase()
      );

      const formattedAmount = formatAmount({
        amount: Math.abs(found.amount),
        currency,
      });

      return `Your spending on ${
        found?.name
      } is ${formattedAmount} between ${format(
        new Date(startDate),
        "MM/dd/yyyy"
      )} and ${format(new Date(endDate), "MM/dd/yyyy")}`;
    },
  };
}
