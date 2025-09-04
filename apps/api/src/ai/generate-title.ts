import { openai } from "@ai-sdk/openai";
import type { ChatUserContext } from "@midday/cache/chat-cache";
import { logger } from "@midday/logger";
import { streamText } from "ai";

type Params = Omit<ChatUserContext, "teamId" | "userId"> & {
  message: string;
};

export const generateTitle = async ({
  message,
  teamName,
  fullName,
}: Params) => {
  try {
    const titleResult = await streamText({
      model: openai("gpt-5-nano"),
      system: `You are an expert title generator specializing in business and financial conversations for SMBs (Small and Medium Businesses). Generate concise, professional titles that capture the business intent.

Context: You're creating titles for conversations in Midday, a financial management platform for SMBs.

Guidelines:
- Generate a short, business-focused title based on the first message
- Maximum 80 characters
- Use professional, business-appropriate language
- Focus on the business action, financial topic, or operational need
- Make it specific and actionable when possible
- Avoid generic words like "help", "question", "issue"
- Use business terminology (revenue, expenses, cash flow, invoices, etc.)
- Do not use quotes, colons, or unnecessary punctuation
- Return only the title, nothing else
- Be specific with time periods: use "2024/Q1", "2023", "January 2024" instead of "last quarter", "last year", "last month"

Examples of good business titles with specific time references:
- "2024/Q4 Revenue Analysis Request"
- "January 2024 Expense Categorization" 
- "2023 vs 2024 Revenue Comparison"
- "2024/Q1 Cash Flow Projection"
- "2023 Tax Deduction Review"
- "December 2024 Invoice Processing"
- "2024/Q3 Performance Metrics"

Date: ${new Date().toISOString().split("T")[0]}
Team name: ${teamName}
Full name: ${fullName}
`,

      prompt: message,
    });

    let title = "";
    for await (const delta of titleResult.textStream) {
      title += delta;
    }

    return title.trim().slice(0, 80);
  } catch (error) {
    logger.warn({
      msg: "Failed to generate chat title",
      error: error instanceof Error ? error.message : String(error),
    });

    return "New Chat"; // Fallback title
  }
};
