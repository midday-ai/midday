"use server";

import { openai } from "@ai-sdk/openai";
import { getBankAccountsCurrencies } from "@midday/supabase/cached-queries";
import { generateText } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import { getProfitTool } from "./tools/profit";
import { getRunwayTool } from "./tools/runway";
import { getSpendingTool } from "./tools/spending";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function voiceMessageAction(history: Message[]) {
  "use server";

  const defaultValues = {
    from: subMonths(startOfMonth(new Date()), 12).toISOString(),
    to: new Date().toISOString(),
    currency:
      (await getBankAccountsCurrencies())?.data?.at(0)?.currency ?? "USD",
  };

  const { text, toolResults } = await generateText({
    model: openai("gpt-4o"),
    system: `\
    - You are a helpful assistant in Midday who can help users ask questions about their transactions, revenue, spending find invoices and more.
    - Respond briefly to the user's request, and do not provide unnecessary information.
    - Do not use markdown, emojis, or other formatting in your responses. Respond in a way easily spoken by text-to-speech software.
    - If the user wants to see spending, call \`getSpending\` function.
    - If the user just wants the burn rate, call \`getBurnRate\` function.
    - If the user just wants the runway, call \`getRunway\` function.
    - If the user just wants the profit, call \`getProfit\` function.
    - If the user just wants to find transactions, call \`getTransactions\` function.
    - If the user just wants to find documents, invoices or receipts, call \`getDocuments\` function.
    - Always try to call the functions with default values, otherwise ask the user to respond with parameters.
    - If you can't find the function call please ask what the user wants to do.
    
    `,
    messages: history,
    tools: {
      getRunway: getRunwayTool({
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      getSpending: getSpendingTool({
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
      getProfit: getProfitTool({
        currency: defaultValues.currency,
        dateFrom: defaultValues.from,
        dateTo: defaultValues.to,
      }),
    },
  });

  return {
    messages: [
      ...history,
      {
        role: "assistant" as const,
        content:
          text || toolResults.map((toolResult) => toolResult.result).join("\n"),
      },
    ],
  };
}
