import type { MutableAIState } from "@/actions/ai/types";
import { getTransactions } from "@midday/supabase/cached-queries";
import { nanoid } from "nanoid";
import { z } from "zod";
import { TransactionsUI } from "./ui/transactions-ui";

type Args = {
  aiState: MutableAIState;
};

export function getTransactionsTool({ aiState }: Args) {
  return {
    description: "Find transactions or show expenses",
    parameters: z.object({
      name: z.string().describe("The name of the transactions").optional(),
      categories: z
        .array(z.string())
        .describe("The categories of the transactions")
        .optional(),
      amount: z.string().describe("The amount of the transactions").optional(),
      expense: z
        .boolean()
        .describe("Filter for expense transactions")
        .optional(),
      recurring: z
        .array(z.enum(["all", "weekly", "monthly", "annually"]))
        .describe("Filter for recurring transactions")
        .optional(),
      attachments: z
        .enum(["include", "exclude"])
        .describe(
          "Filter transactions if they are completed or not, if they have receipts or attachments",
        )
        .optional(),
      limit: z.number().describe("Limit the number of transactions").optional(),
      fromDate: z.coerce
        .date()
        .describe("Filter transactions from this date, in ISO-8601 format")
        .optional(),
      toDate: z.coerce
        .date()
        .describe("Filter transactions to this date, in ISO-8601 format")
        .optional(),
    }),
    generate: async (args) => {
      const {
        name,
        categories,
        amount,
        expense,
        limit = 4,
        fromDate,
        toDate,
        attachments,
        recurring,
      } = args;

      const toolCallId = nanoid();

      const searchQuery = name || amount;

      const filter = {
        start: fromDate,
        end: toDate,
        categories,
        attachments,
        recurring,
      };

      const sort = expense ? ["amount", "asc"] : undefined;

      const { data, meta } = await getTransactions({
        searchQuery,
        from: 0,
        to: limit,
        filter,
        sort,
      });

      const props = {
        data,
        meta,
        q: searchQuery,
        filter,
        sort,
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
                toolName: "getTransactions",
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
                toolName: "getTransactions",
                toolCallId,
                result: props,
              },
            ],
          },
        ],
      });

      return <TransactionsUI {...props} />;
    },
  };
}
