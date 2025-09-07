import { openai } from "@ai-sdk/openai";
import { TZDate } from "@date-fns/tz";
import type { ChatUserContext } from "@midday/cache/chat-cache";
import { logger } from "@midday/logger";
import { generateObject } from "ai";
import { z } from "zod";

const MIN_CONTEXT_LENGTH = 20;
const DEFAULT_TITLE = "New Chat";

type Params = Omit<ChatUserContext, "teamId" | "userId"> & {
  message: string;
};

export const generateTitle = async ({
  message,
  teamName,
  country,
  fullName,
  baseCurrency,
  city,
  region,
  timezone,
  countryCode,
}: Params) => {
  try {
    // If the message is too short, return "New Chat"
    if (message.length < MIN_CONTEXT_LENGTH) {
      return DEFAULT_TITLE;
    }

    const userTimezone = timezone || "UTC";
    const tzDate = new TZDate(new Date(), userTimezone);

    const titleResult = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        title: z.string().describe("The title of the chat"),
      }),
      temperature: 0.7,
      system: `You are a financial analyst and title generator specializing in financial management conversations for SMBs. Generate concise, finance-focused titles that capture the core financial intent and business value.

Context: You're creating titles for conversations in Midday, a comprehensive financial management platform for SMBs handling accounting, invoicing, expense tracking, and financial analytics.

Financial Focus Guidelines:
- Generate a short, finance-centric title based on the user's message
- Maximum 60 characters
- Prioritize financial terminology: P&L, EBITDA, ROI, burn rate, runway, margins, KPIs, forecasting, budgeting
- Focus on financial actions: analyze, reconcile, track, forecast, optimize, audit, categorize, report
- Emphasize financial outcomes: profitability, liquidity, efficiency, compliance, growth metrics
- Use accounting terminology: AR/AP, depreciation, accruals, write-offs, provisions, allocations
- Include financial periods: fiscal quarters (FY24/Q1), tax years, reporting periods
- Avoid generic business terms - make it financially specific
- Do not use quotes, colons, or unnecessary punctuation
- Return only the title, nothing else

Fallback Rules:
- If the message is too vague or generic (like "hello", "hi", "help"), return "New Chat"
- Only generate a financial title if there's clear financial intent or context in the message

Examples of financial-focused titles:
- "January 2024 Expense Reconciliation"
- "2023-2024 Revenue Growth Analysis"
- "Q1 Cash Flow Forecasting"  
- "2023 Tax Optimization Review"
- "December AR Aging Report"
- "Q3 Margin Analysis & KPIs"
- "Monthly Burn Rate Tracking"
- "Budget vs Actual Reporting"

    Current date and time: ${tzDate.toISOString()}
    Team name: ${teamName}
    Company registered in: ${countryCode}
    Base currency: ${baseCurrency}
    User full name: ${fullName}
    User current city: ${city}
    User current region: ${region}
    User current country: ${country}
    User local timezone: ${userTimezone}
`,

      prompt: message,
    });

    const cleanTitle = titleResult.object.title;

    return cleanTitle.slice(0, 60);
  } catch (error) {
    logger.warn({
      msg: "Failed to generate chat title",
      error: error instanceof Error ? error.message : String(error),
    });

    const trimmedMessage = message.trim();

    if (trimmedMessage) {
      return trimmedMessage.slice(0, 60);
    }

    return DEFAULT_TITLE;
  }
};
