import type { MutableAIState } from "@/actions/ai/types";
import { getInboxSearchQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { DocumentsUI } from "./ui/documents-ui";

type Args = {
  aiState: MutableAIState;
  teamId: string;
};

export function getInvoicesTool({ aiState, teamId }: Args) {
  return {
    description: "Find receipt or invoice",
    parameters: z.object({
      name: z.string().describe("The name of the invoice or receipt"),
    }),
    generate: async (args) => {
      const { name, amount } = args;
      const supabase = createClient();

      const searchQuery = name || amount;

      const data = await getInboxSearchQuery(supabase, {
        teamId,
        q: searchQuery,
      });

      const props = {
        data,
      };

      const toolCallId = nanoid();

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
                toolName: "getInvoices",
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
                toolName: "getInvoices",
                toolCallId,
                result: props,
              },
            ],
          },
        ],
      });

      return <DocumentsUI {...props} />;
    },
  };
}
