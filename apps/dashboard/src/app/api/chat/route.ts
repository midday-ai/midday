import { getSpending } from "@/lib/tools/get-spending";
import { getTeamId } from "@/utils/team";
import { openai } from "@ai-sdk/openai";
import { createDataStreamResponse, smoothStream, streamText } from "ai";

export async function POST(request: Request) {
  const { messages } = await request.json();
  const teamId = await getTeamId();

  if (!teamId) {
    return new Response("Team not found", { status: 404 });
  }

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: `\
        You are a helpful assistant in Midday who can help users ask questions about their transactions, revenue, spending find invoices and more.
    
        If the user wants the burn rate, call \`getBurnRate\` function.
        If the user wants the runway, call \`getRunway\` function.
        If the user wants the profit, call \`getProfit\` function.
        If the user wants to find transactions or expenses, call \`getTransactions\` function.
        If the user wants to see spending based on a category, call \`getSpending\` function.
        If the user wants to find invoices or receipts, call \`getInvoices\` function.
        If the user wants to find documents, call \`getDocuments\` function.
        Don't return markdown, just plain text.
    
        Always try to call the functions with default values, otherwise ask the user to respond with parameters.
        Current date is: ${new Date().toISOString().split("T")[0]} \n
        `,
        messages,
        maxSteps: 5,
        experimental_transform: smoothStream({ chunking: "word" }),
        tools: {
          getSpending: getSpending({ teamId }),
        },
      });

      result.consumeStream();

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: () => {
      return "Oops, an error occurred!";
    },
  });
}
