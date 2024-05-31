import type { MutableAIState } from "@/actions/ai/types";
import { getMetrics } from "@midday/supabase/cached-queries";
import { nanoid } from "ai";
import { z } from "zod";
import { ProfitUI } from "./ui/profit-ui";

type Args = {
  aiState: MutableAIState;
  currency: string;
  dateFrom: string;
  dateTo: string;
};

export function getProfitTool({ aiState, currency, dateFrom, dateTo }: Args) {
  return {
    description: "Get profit",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date for the profit period")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date for the profit period")
        .default(new Date(dateTo)),
      currency: z
        .string()
        .default(currency)
        .describe("The currency for profit"),
    }),
    generate: async function* (args) {
      yield <div />;

      const { currency, startDate, endDate } = args;

      const data = await getMetrics({
        from: startDate,
        to: endDate,
        type: "profit",
        currency,
      });

      const toolCallId = nanoid();

      const props = {
        data,
        startDate,
        endDate,
        currency,
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
                toolName: "profit",
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
                toolName: "profit",
                toolCallId,
                result: props,
              },
            ],
          },
        ],
      });

      return <ProfitUI {...props} />;
    },
  };
}
