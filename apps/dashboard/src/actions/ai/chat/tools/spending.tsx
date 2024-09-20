import type { MutableAIState } from "@/actions/ai/types";
import { getSpending } from "@midday/supabase/cached-queries";
import { startOfMonth } from "date-fns";
import { nanoid } from "nanoid";
import { z } from "zod";
import { SpendingUI } from "./ui/spending-ui";

type Args = {
  aiState: MutableAIState;
  dateFrom: string;
  dateTo: string;
};

export function getSpendingTool({ aiState, dateFrom, dateTo }: Args) {
  return {
    description: "Get spending from category",
    parameters: z.object({
      currency: z.string().describe("The currency for spending").optional(),
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
    generate: async (args) => {
      const { startDate, endDate, currency, category } = args;
      const toolCallId = nanoid();

      const { data } = await getSpending({
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: new Date(endDate).toISOString(),
        currency,
      });

      const found = data.find(
        (c) => category.toLowerCase() === c?.name?.toLowerCase(),
      );

      const props = {
        currency: found?.currency,
        category,
        amount: found?.amount,
        name: found?.name,
        startDate,
        endDate,
      };

      aiState.done({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: nanoid(),
            role: "assistant",
            content: [
              {
                type: "tool-call",
                toolName: "getSpending",
                toolCallId,
                args,
              },
            ],
          },
          {
            id: nanoid(),
            role: "tool",
            content: [
              {
                type: "tool-result",
                toolName: "getSpending",
                toolCallId,
                result: props,
              },
            ],
          },
        ],
      });

      return <SpendingUI {...props} />;
    },
  };
}
