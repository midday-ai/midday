import type { MutableAIState } from "@/actions/ai/types";
import { calculateAvgBurnRate } from "@/utils/format";
import { getBurnRate, getRunway } from "@midday/supabase/cached-queries";
import { startOfMonth } from "date-fns";
import { nanoid } from "nanoid";
import { z } from "zod";
import { BurnRateUI } from "./ui/burn-rate-ui";

type Args = {
  aiState: MutableAIState;
  currency: string;
  dateFrom: string;
  dateTo: string;
};

export function getBurnRateTool({ aiState, dateFrom, dateTo }: Args) {
  return {
    description: "Get burn rate",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date of the burn rate, in ISO-8601 format")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date of the burn rate, in ISO-8601 format")
        .default(new Date(dateTo)),
      currency: z
        .string()
        .describe("The currency for the burn rate")
        .optional(),
    }),
    generate: async (args) => {
      const toolCallId = nanoid();

      const { currency, startDate, endDate } = args;

      const [{ data: months }, { data: burnRateData }] = await Promise.all([
        getRunway({
          currency,
          from: startOfMonth(new Date(startDate)).toISOString(),
          to: endDate.toISOString(),
        }),
        getBurnRate({
          from: startDate.toISOString(),
          to: endDate.toISOString(),
          currency,
        }),
      ]);

      const averageBurnRate = calculateAvgBurnRate(burnRateData);

      const props = {
        averageBurnRate,
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
                toolName: "getBurnRate",
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
                toolName: "getBurnRate",
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
