import { tool } from "ai";
import { getExpensesBreakdownSchema } from "./schema";

export const getExpensesBreakdownTool = tool({
  description: "Get the expenses breakdown",
  inputSchema: getExpensesBreakdownSchema,
  execute: async function* () {
    console.log("Expenses breakdown");
    yield { text: "Expenses breakdown" };
  },
});
