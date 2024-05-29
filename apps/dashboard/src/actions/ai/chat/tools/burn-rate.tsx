import type { MutableAIState } from "@/actions/ai/types";
import { calculateAvgBurnRate } from "@/utils/format";
import { getBurnRate, getRunway } from "@midday/supabase/cached-queries";
import { nanoid } from "ai";
import { z } from "zod";
import { BurnRateUI } from "./ui/burn-rate-ui";

type Args = {
  aiState: MutableAIState;
};

export function getBurnRateTool({ aiState }: Args) {
  return {
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
    generate: async (args) => {
      const toolCallId = nanoid();

      const { currency, startDate, endDate } = args;

      const [{ data: months }, { data: burnRateData }] = await Promise.all([
        getRunway({
          currency,
          from: startDate.toString(),
          to: endDate.toString(),
        }),
        getBurnRate({
          currency,
          from: startDate.toString(),
          to: endDate.toString(),
        }),
      ]);

      const avarageBurnRate = calculateAvgBurnRate(burnRateData);

      const props = {
        avarageBurnRate,
        currency,
        startDate,
        endDate,
        months,
        data: burnRateData,
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
                toolName: "burn_rate",
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
                toolName: "burn_rate",
                toolCallId,
                result: props,
              },
            ],
          },
        ],
      });

      return <BurnRateUI {...props} />;
    },
  };
}
