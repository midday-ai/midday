import { getQueryClient, trpc } from "@/trpc/server";
import { tool } from "ai";
import { z } from "zod";

export type GetTransactionsResult = Awaited<
  ReturnType<typeof getTransactions.execute>
>;

export const getTransactions = tool({
  description: "Find transactions, if expense sort by amount descending",
  parameters: z.object({
    sort: z
      .array(
        z.enum([
          "date",
          "amount",
          "status",
          "category",
          "tags",
          "bank_account",
          "assigned",
        ]),
        z.enum(["asc", "desc"]),
      )
      .nullable()
      .optional()
      .describe("The sort order to filter by"),
    pageSize: z
      .number()
      .min(1)
      .max(25)
      .default(5)
      .describe("The number of transactions to return"),
    q: z.string().nullable().optional().describe("The query to search for"),
    categories: z
      .array(z.string())
      .nullable()
      .optional()
      .describe("The categories to filter by"),
    tags: z
      .array(z.string())
      .nullable()
      .optional()
      .describe("The tags to filter by"),
    start: z
      .string()
      .nullable()
      .optional()
      .describe("The start date to filter by"),
    end: z.string().nullable().optional().describe("The end date to filter by"),
    accounts: z
      .array(z.string())
      .nullable()
      .optional()
      .describe("The accounts to filter by"),
    assignees: z
      .array(z.string())
      .nullable()
      .optional()
      .describe("The assignees to filter by"),
    statuses: z
      .array(z.string())
      .nullable()
      .optional()
      .describe("The statuses to filter by"),
    recurring: z
      .array(z.enum(["all", "weekly", "monthly"]))
      .nullable()
      .optional()
      .describe("The recurring transactions to filter by"),
    attachments: z
      .enum(["include", "exclude"])
      .nullable()
      .optional()
      .describe("The attachments to filter by"),
    amount_range: z
      .array(z.number())
      .nullable()
      .optional()
      .describe("The amount range to filter by"),
    amount: z
      .array(z.string())
      .nullable()
      .optional()
      .describe("The amount to filter by"),
    type: z
      .enum(["income", "expense"])
      .nullable()
      .optional()
      .describe("The type of transactions to filter by"),
  }),
  execute: async (params) => {
    const queryClient = getQueryClient();

    const { data, meta } = await queryClient.fetchQuery(
      trpc.transactions.get.queryOptions(params),
    );

    return {
      params,
      result: `Found ${data.length} transactions`,
      meta: {
        hasNextPage: meta.hasNextPage,
      },
    };
  },
});
