import { cached } from "@api/ai/cache";
import { tool } from "ai";
import { getBalanceSheetSchema } from "./schema";

export const getBalanceSheetTool = cached(
  tool({
    description: "Get the balance sheet for the user's account",
    inputSchema: getBalanceSheetSchema,
    execute: async function* () {
      yield { text: "Balance sheet" };
    },
  }),
);
