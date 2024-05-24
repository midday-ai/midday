"use server";

import { FormatAmount } from "@/components/format-amount";
import { calculateAvgBurnRate } from "@/utils/format";
import { openai } from "@ai-sdk/openai";
import { client as RedisClient } from "@midday/kv";
import { getBurnRate, getRunway } from "@midday/supabase/cached-queries";
import { Ratelimit } from "@upstash/ratelimit";
import { createAI, getMutableAIState, streamUI } from "ai/rsc";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { z } from "zod";

export interface ServerMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant";
  display: ReactNode;
}

const ratelimit = new Ratelimit({
  limiter: Ratelimit.fixedWindow(10, "30s"),
  redis: RedisClient,
});

export async function continueConversation(
  input: string
): Promise<ClientMessage> {
  "use server";
  const history = getMutableAIState();
  const ip = headers().get("x-forwarded-for");

  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return {
      id: nanoid(),
      role: "assistant",
      display:
        "Not so fast, tiger. You've reached your message limit. Please wait a minute and try again.",
    };
  }

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
      createBudget: {
        description: "Create a flower",
        parameters: z.object({
          category: z.string().describe("The category for the budget"),
          amount: z.number().describe("The spending limit for the budget"),
          period: z.enum(["monthly", "yearly"]),
          currency: z.string().default("SEK"),
        }),
        generate: async ({ category }) => {
          // history.done((messages: ServerMessage[]) => [
          //   ...messages,
          //   {
          //     role: "assistant",
          //     content: "Here is your current burn rate",
          //   },
          // ]);

          return <div>We j {category}</div>;
        },
      },
      showSpending: {
        description: "Get spending from transactions",
        parameters: z.object({
          category: z.string().describe("The category for the spending"),
          currency: z.string().default("SEK"),
        }),
        generate: async ({ category }) => {
          // history.done((messages: ServerMessage[]) => [
          //   ...messages,
          //   {
          //     role: "assistant",
          //     content: "Here is your current burn rate",
          //   },
          // ]);

          return <div>You spent 8044 SEK on {category}</div>;
        },
      },
      showBurnRate: {
        description: "Get burn rate",
        parameters: z.object({
          startDate: z.coerce
            .date()
            .describe("The start date for the burn rate period")
            .default(new Date("2023-01-01")),
          endDate: z.coerce
            .date()
            .describe("The end date for the burn rate period")
            .default(new Date("2024-01-01")),
          currency: z.string().default("SEK"),
        }),
        generate: async ({ currency, startDate, endDate }) => {
          // history.done((messages: ServerMessage[]) => [
          //   ...messages,
          //   {
          //     role: "assistant",
          //     content: "Here is your current burn rate",
          //   },
          // ]);

          const { data } = await getBurnRate({
            currency,
            from: startDate.toString(),
            to: endDate.toString(),
          });

          const avarageBurnRate = calculateAvgBurnRate(data);

          return (
            <div>
              Your avarage burn rate is{" "}
              <FormatAmount amount={avarageBurnRate} currency={currency} />{" "}
              between {format(new Date(startDate), "LLL dd, y")} and{" "}
              {format(new Date(endDate), "LLL dd, y")}
            </div>
          );
        },
      },
      showRunway: {
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
        generate: async ({ currency, startDate, endDate }) => {
          const { data } = await getRunway({
            currency,
            from: startDate.toString(),
            to: endDate.toString(),
          });

          return `${data?.toString()} months`;
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
