import type { MutableAIState } from "@/actions/ai/types";
import type { Client } from "@midday/supabase/types";
import { nanoid } from "ai";
import { z } from "zod";

type Args = {
  aiState: MutableAIState;
  supabase: Client;
  teamId: string;
};

export function getLargestIncomeTool({ teamId, supabase, aiState }: Args) {
  return {
    description: "Get biggest/largest income transaction",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date for the period")
        .default(new Date("2023-01-01")),
      endDate: z.coerce
        .date()
        .describe("The end date for the period")
        .default(new Date("2024-01-01")),
      currency: z.string().default("SEK"),
    }),
    generate: async (args) => {
      const { currency, startDate, endDate } = args;

      const { data } = await supabase
        .from("decrypted_transactions")
        .select(
          "id, name:decrypted_name, amount, currency, date, category_slug"
        )
        .order("amount", {
          ascending: false,
        })
        .eq("team_id", teamId)
        .eq("category_slug", "income")
        .eq("currency", currency)
        .limit(5);

      const toolCallId = nanoid();

      const result = 1000;

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
                toolName: "get_largest_income",
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
                toolName: "get_largest_income",
                toolCallId,
                result,
              },
            ],
          },
        ],
      });
    },
  };
}
