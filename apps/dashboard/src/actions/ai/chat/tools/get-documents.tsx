import type { MutableAIState } from "@/actions/ai/types";
import { getVaultQuery } from "@absplatform/supabase/queries";
import { createClient } from "@absplatform/supabase/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { DocumentsUI } from "./ui/documents-ui";

type Args = {
  aiState: MutableAIState;
  teamId: string;
};

export function getDocumentsTool({ aiState, teamId }: Args) {
  return {
    description: "Find documents",
    parameters: z.object({
      name: z.string().describe("The name of the document"),
    }),
    generate: async (args) => {
      const { name } = args;
      const supabase = createClient();

      const { data } = await getVaultQuery(supabase, {
        teamId,
        searchQuery: name,
      });

      const formattedData = data?.map((item) => ({
        ...item,
        content_type: item?.metadata?.mimetype,
        display_name: item?.name,
        file_path: item?.path_tokens,
      }));

      const props = {
        data: formattedData,
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
                toolName: "getDocuments",
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
                toolName: "getDocuments",
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
