import { getSpendingQuery } from "@midday/supabase/queries";
import type { Client } from "@midday/supabase/types";
import { startOfMonth } from "date-fns";
import { z } from "zod";

export function getSpendingTool({
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
    description: "Get spending from category",
    parameters: z.object({
      currency: z.string().describe("The currency for spending").optional(),
      category: z.string().describe("The category for spending"),
      startDate: z.coerce
        .date()
        .describe("The start date of the spending, in ISO-8601 format")
        .default(new Date(defaultValues.from)),
      endDate: z.coerce
        .date()
        .describe("The end date of the spending, in ISO-8601 format")
        .default(new Date(defaultValues.to)),
    }),
    execute: async ({
      category,
      currency,
      startDate,
      endDate,
    }: {
      currency?: string;
      startDate: Date;
      endDate: Date;
      category: string;
    }) => {
      const { data } = await getSpendingQuery(supabase, {
        currency,
        from: startOfMonth(startDate).toISOString(),
        to: endDate.toISOString(),
        teamId,
      });

      const found = data?.find(
        (c) => category?.toLowerCase() === c?.name?.toLowerCase(),
      );

      if (!found) {
        return "No spending on this category found";
      }

      return `You have spent ${Intl.NumberFormat("en-US", {
        style: "currency",
        currency: found.currency,
      }).format(
        Math.abs(found.amount),
      )} on ${found.name} from ${startDate.toISOString()} to ${endDate.toISOString()}.`;
    },
  };
}
