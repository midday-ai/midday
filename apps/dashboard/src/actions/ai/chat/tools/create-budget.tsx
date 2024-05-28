import type { MutableAIState } from "@/actions/ai/types";
import { nanoid } from "ai";
import { z } from "zod";

type Args = {
  aiState: MutableAIState;
};

export function createBudgetTool({ aiState }: Args) {
  return {
    description: "Create a budget",
    parameters: z.object({
      category: z.string().describe("The category for the budget"),
      amount: z.number().describe("The spending limit for the budget"),
      period: z.enum(["monthly", "yearly"]),
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
                toolName: "create_budget",
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
                toolName: "create_budget",
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
