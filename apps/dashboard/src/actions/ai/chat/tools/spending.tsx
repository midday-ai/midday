import type { MutableAIState } from "@/actions/ai/types";
import { nanoid } from "ai";
import { z } from "zod";

type Args = {
  aiState: MutableAIState;
};

export function getSpendingTool({ aiState }: Args) {
  return {
    description: "Get spending from transactions",
    parameters: z.object({
      category: z.string().describe("The category for the spending"),
      currency: z.string().default("SEK"),
    }),
    generate: async (args) => {
      const { category } = args;
      const toolCallId = nanoid();

      const result = <div>{category}</div>;

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
                result,
              },
            ],
          },
        ],
      });

      return result;
    },
  };
}
