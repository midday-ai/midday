import type { MutableAIState } from "@/actions/ai/types";
import { openai } from "@ai-sdk/openai";
import { getMetrics } from "@midday/supabase/cached-queries";
import { generateText } from "ai";
import { startOfMonth } from "date-fns";
import { nanoid } from "nanoid";
import { z } from "zod";
import { ForecastUI } from "./ui/forecast-ui";

type Args = {
  aiState: MutableAIState;
  dateFrom: string;
  dateTo: string;
};

export function getForecastTool({ aiState, dateFrom, dateTo }: Args) {
  return {
    description: "Forecast profit or revenue",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date of the forecast, in ISO-8601 format")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date of the forecast, in ISO-8601 format")
        .default(new Date(dateTo)),
      type: z.enum(["profit", "revenue"]).describe("The type of forecast"),
      currency: z.string().describe("The currency for forecast").optional(),
    }),
    generate: async (args) => {
      const { currency, startDate, endDate, type } = args;

      const data = await getMetrics({
        from: startOfMonth(new Date(startDate)).toISOString(),
        to: new Date(endDate).toISOString(),
        type,
        currency,
      });

      const prev = data?.result?.map((d) => {
        return `${d.current.date}: ${Intl.NumberFormat("en", {
          style: "currency",
          currency: data.meta.currency,
        }).format(d.current.value)}\n`;
      });

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system:
          "You are a financial forecaster and analyst. Your task is to provide simple, clear, and concise content. Return only the result with a short description only with text. Make sure to mention that this is an indication of the forecast and should be verified.",
        prompt: `forecast next month ${type} based on the last 12 months ${type}:\n${prev}
          Current date: ${new Date().toISOString()}
        `,
      });

      const toolCallId = nanoid();

      const props = {
        content: text,
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
                toolName: "getForecast",
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
                toolName: "getForecast",
                toolCallId,
                result: props,
              },
            ],
          },
        ],
      });

      return <ForecastUI {...props} />;
    },
  };
}
