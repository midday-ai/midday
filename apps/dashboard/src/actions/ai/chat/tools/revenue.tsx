import type { MutableAIState } from "@/actions/ai/types";
import { getMetrics } from "@midday/supabase/cached-queries";
import { startOfMonth } from "date-fns";
import { nanoid } from "nanoid";
import { z } from "zod";
import { RevenueUI } from "./ui/revenue-ui";

type Args = {
  aiState: MutableAIState;
  dateFrom: string;
  dateTo: string;
};

export function getRevenueTool({ aiState, dateFrom, dateTo }: Args) {
  return {
    description: "Get revenue",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date of the revenue, in ISO-8601 format")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date of the revenue, in ISO-8601 format")
        .default(new Date(dateTo)),
      currency: z.string().describe("The currency for revenue").optional(),
    }),
    generate: async (args) => {
      const { currency, startDate, endDate } = args;

      const data = await getMetrics({
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: new Date(endDate).toISOString(),
        type: "revenue",
        currency,
      });

      const toolCallId = nanoid();

      const props = {
        data,
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
                toolName: "getRevenue",
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
                toolName: "getRevenue",
                toolCallId,
                result: props,
              },
            ],
          },
        ],
      });

      return <RevenueUI {...props} />;
    },
  };
}
