import { getSpendingQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { tool } from "ai";
import { startOfMonth } from "date-fns";
import { z } from "zod";

type Args = {
  teamId: string;
};

export const getSpending = ({ teamId }: Args) =>
  tool({
    description: "Get spending from category",
    parameters: z.object({
      currency: z.string().describe("The currency for spending").optional(),
      category: z.string().describe("The category for spending"),
      startDate: z.coerce
        .date()
        .describe("The start date of the spending, in ISO-8601 format"),
      // .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date of the spending, in ISO-8601 format"),
      // .default(new Date(dateTo)),
    }),
    execute: async ({ category, startDate, endDate, currency }) => {
      const supabase = await createClient();

      const { data } = await getSpendingQuery(supabase, {
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: new Date(endDate).toISOString(),
        currency,
        teamId,
      });

      const found = data?.find(
        (c) => category.toLowerCase() === c?.name?.toLowerCase(),
      );

      return found;
    },
  });
