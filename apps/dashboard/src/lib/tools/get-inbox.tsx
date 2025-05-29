import { getQueryClient, trpc } from "@/trpc/server";
import { tool } from "ai";
import { z } from "zod";

export type GetInboxResult = Awaited<ReturnType<typeof getInbox.execute>>;

export const getInbox = tool({
  description: "Find receipt or invoice from the user's inbox",
  parameters: z.object({
    name: z.string().describe("The name of the invoice or receipt"),
    amount: z
      .number()
      .optional()
      .describe("The amount of the invoice or receipt"),
  }),
  execute: async ({ name, amount }) => {
    const queryClient = getQueryClient();

    const { data } = await queryClient.fetchQuery(
      trpc.inbox.get.queryOptions({
        q: amount ? amount.toString() : name,
      }),
    );

    return {
      result: `Found ${data.length} invoices or receipts`,
      params: {
        name,
        amount,
      },
    };
  },
});
