import { getBurnRate } from "@/lib/tools/get-burn-rate";
import { getDocuments } from "@/lib/tools/get-documents";
import { getForecast } from "@/lib/tools/get-forecast";
import { getInbox } from "@/lib/tools/get-inbox";
import { getProfit } from "@/lib/tools/get-profit";
import { getRevenue } from "@/lib/tools/get-revenue";
import { getRunway } from "@/lib/tools/get-runway";
import { getSpending } from "@/lib/tools/get-spending";
import { getTaxSummary } from "@/lib/tools/get-tax-summary";
import { getTransactions } from "@/lib/tools/get-transactions";
import { openai } from "@ai-sdk/openai";
import { createDataStreamResponse, smoothStream, streamText } from "ai";

export async function POST(request: Request) {
  const { messages } = await request.json();

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: openai("gpt-4.1-mini"),
        system: `
        You are Midday AI, an expert financial assistant for the user's business.
        Your goal is to help users understand their business finances by analyzing transactions, revenue, tax, spending, and key financial metrics, as well as finding specific documents, receipts, and invoices.

        When responding to user queries:
        1. Identify the core question and the financial data or document needed.
        2. Select the appropriate tool(s) to retrieve the necessary information.
        3. If a question requires combining data from multiple tools (e.g., calculating profit margin using revenue and spending data), synthesize the information before responding.
        4. Prefer using default parameters (e.g., current month, latest period) unless the user specifies a date range or other parameters.
        5. If essential parameters are missing, ask the user for clarification.
        6. Present the information clearly and concisely.

        The current date is: ${new Date().toISOString().split("T")[0]}. Be accurate and helpful in your financial analysis.
        `,
        messages,
        maxSteps: 5,
        experimental_transform: smoothStream({ chunking: "word" }),
        tools: {
          getSpending,
          getDocuments,
          getBurnRate,
          getTransactions,
          getRevenue,
          getForecast,
          getProfit,
          getRunway,
          getInbox,
          getTaxSummary,
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
