import type { MutableAIState } from "@/actions/ai/types";
import { getSpending } from "@midday/supabase/cached-queries";
import { nanoid } from "ai";
import { z } from "zod";
import { SpendingUI } from "./ui/spending-ui";

type Args = {
  aiState: MutableAIState;
  currency: string;
  dateFrom: string;
  dateTo: string;
};

export function getSpendingTool({ aiState, currency, dateFrom, dateTo }: Args) {
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
        .describe("The start date for spending")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date for spending")
        .default(new Date(dateTo)),
    }),
    generate: async (args) => {
      const { startDate, endDate, currency, category } = args;
      const toolCallId = nanoid();

      const { data } = await getSpending({
        from: startDate,
        to: endDate,
        currency,
      });

      const found = data.find(
        (c) => category.toLowerCase() === c?.name?.toLowerCase()
      );

      const props = {
        currency,
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
                toolName: "get_spending",
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
                toolName: "get_spending",
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
