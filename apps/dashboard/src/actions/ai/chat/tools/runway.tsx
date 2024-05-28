import type { MutableAIState } from "@/actions/ai/types";
import { getRunway } from "@midday/supabase/cached-queries";
import { nanoid } from "ai";
import { z } from "zod";
import { RunwayUI } from "./ui/runway-ui";

type Args = {
  aiState: MutableAIState;
};

export function getRunwayTool({ aiState }: Args) {
  return {
    description: "Get runway for your business",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date for the runway period")
        .default(new Date("2023-01-01")),
      endDate: z.coerce
        .date()
        .describe("The end date for the runway period")
        .default(new Date("2024-01-01")),
      currency: z.string().default("SEK"),
    }),
    generate: async function* (args) {
      yield <div />;

      const { currency, startDate, endDate } = args;

      const { data } = await getRunway({
        currency,
        from: startDate.toString(),
        to: endDate.toString(),
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
                toolName: "runway",
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
                toolName: "runway",
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
