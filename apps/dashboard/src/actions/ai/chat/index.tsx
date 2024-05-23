"use server";

import { createOpenAI, openai } from "@ai-sdk/openai";
import { createAI, getMutableAIState, streamUI } from "ai/rsc";
import { nanoid } from "nanoid";
import type { ReactNode } from "react";
import { z } from "zod";
import { getBurnRate } from "./tools/burn-rate";

export interface ServerMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant";
  display: ReactNode;
}

// const groq = createOpenAI({
//   baseURL: "https://api.groq.com/openai/v1",
//   apiKey: process.env.GROQ_API_KEY,
// });

export async function continueConversation(
  input: string
): Promise<ClientMessage> {
  "use server";

  const history = getMutableAIState();

  const result = await streamUI({
    model: openai("gpt-4o"),
    messages: [
      ...history.get(),
      {
        role: "user",
        content: input,
      },
    ],
    text: ({ content, done }) => {
      if (done) {
        history.done((messages: ServerMessage[]) => [
          ...messages,
          { role: "assistant", content },
        ]);
      }

      return content;
    },
    tools: {
      showStockInformation: {
        description:
          "Get stock information for symbol for the last numOfMonths months",
        parameters: z.object({
          symbol: z
            .string()
            .describe("The stock symbol to get information for"),
          numOfMonths: z
            .number()
            .describe("The number of months to get historical information for"),
        }),
        generate: async ({ symbol }) => {
          history.done((messages: ServerMessage[]) => [
            ...messages,
            {
              role: "assistant",
              content: `Showing stock information for ${symbol}`,
            },
          ]);

          return <span className="text-white">Hello</span>;
        },
      },
    },
  });

  return {
    id: nanoid(),
    role: "assistant",
    display: result.value,
  };
}

export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});
