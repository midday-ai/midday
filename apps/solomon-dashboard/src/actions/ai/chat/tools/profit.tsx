import type { MutableAIState } from "@/actions/ai/types";
import { getMetrics } from "@midday/supabase/cached-queries";
import { nanoid } from "ai";
import { startOfMonth } from "date-fns";
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
    generate: async (args) => {
      const { currency, startDate, endDate } = args;

      const data = await getMetrics({
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: new Date(endDate).toISOString(),
        type: "profit",
        currency,
      });

      const toolCallId = nanoid();

      const props = {
        data,
        startDate: startOfMonth(new Date(startDate)).toISOString(),
        endDate: new Date(endDate).toISOString(),
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
                toolName: "getProfit",
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
                toolName: "getProfit",
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
