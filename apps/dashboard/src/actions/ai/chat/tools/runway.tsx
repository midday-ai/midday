import type { MutableAIState } from "@/actions/ai/types";
import { getRunway } from "@midday/supabase/cached-queries";
import { startOfMonth } from "date-fns";
import { nanoid } from "nanoid";
import { z } from "zod";
import { RunwayUI } from "./ui/runway-ui";

type Args = {
  aiState: MutableAIState;
  dateFrom: string;
  dateTo: string;
};

export function getRunwayTool({ aiState, dateFrom, dateTo }: Args) {
  return {
    description: "Get runway",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date of the runway, in ISO-8601 format")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date of the runway, in ISO-8601 format")
        .default(new Date(dateTo)),
      currency: z.string().describe("The currency for the runway").optional(),
    }),
    generate: async (args) => {
      const { currency, startDate, endDate } = args;

      const { data } = await getRunway({
        currency,
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: endDate.toISOString(),
      });

      const toolCallId = nanoid();

      const props = {
        months: data,
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
                toolName: "getRunway",
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
                toolName: "getRunway",
                toolCallId,
                result: props,
              },
            ],
          },
        ],
      });

      return <RunwayUI {...props} />;
    },
  };
}
