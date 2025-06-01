import { getQueryClient, trpc } from "@/trpc/server";
import { tool } from "ai";
import { z } from "zod";

export type GetDocumentResult = Awaited<
  ReturnType<typeof getDocuments.execute>
>;

export const getDocuments = tool({
  description: "Find documents",
  parameters: z.object({
    name: z.string().describe("The name of the document"),
  }),
  execute: async ({ name }) => {
    const queryClient = getQueryClient();

    const { data } = await queryClient.fetchQuery(
      trpc.documents.get.queryOptions({
        q: name,
      }),
    );

    return {
      params: {
        name,
      },
      result: `Found ${data.length} documents`,
    };
  },
});
