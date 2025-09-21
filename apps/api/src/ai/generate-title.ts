import { openai } from "@ai-sdk/openai";
import { TZDate } from "@date-fns/tz";
import type { ChatUserContext } from "@midday/cache/chat-cache";
import { logger } from "@midday/logger";
import { generateObject } from "ai";
import { z } from "zod";
import type { UIChatMessage } from "./types";

const MIN_CONTEXT_LENGTH = 10;

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
      return null;
    }

    const userTimezone = timezone || "UTC";
    const tzDate = new TZDate(new Date(), userTimezone);

    const titleResult = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        title: z.string().describe("The title of the chat"),
      }),
      temperature: 0.7,
      system: `
      You will generate a short title based on the first message a user begins a conversation with.
      - Ensure the title is not more than 50 characters long.
      - The title should be a summary of the user's message.
      - Do not use quotes or colons in the title.
      - Return only the title, nothing else.

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
      User current country: ${country}
      User local timezone: ${userTimezone}
      `,
      prompt: message,
    });

    const cleanTitle = titleResult.object.title;

    return cleanTitle.slice(0, 50);
  } catch (error) {
    logger.warn({
      msg: "Failed to generate chat title",
      error: error instanceof Error ? error.message : String(error),
    });

    const trimmedMessage = message.trim();

    if (trimmedMessage) {
      return trimmedMessage.slice(0, 50);
    }

    return null;
  }
};

/**
 * Extracts and combines all text content from an array of chat messages
 * @param messages Array of chat messages
 * @returns Combined text content from all messages
 */
export function extractTextContent(messages: UIChatMessage[]): string {
  return messages
    .map((msg) => {
      const textPart = msg.parts?.find((part: any) => part.type === "text");
      return (textPart as any)?.text || "";
    })
    .join(" ")
    .trim();
}

/**
 * Checks if a conversation has enough content for title generation
 * @param messages Array of chat messages
 * @param minLength Minimum length threshold (default: 20)
 * @returns True if conversation has enough content
 */
export function hasEnoughContent(
  messages: UIChatMessage[],
  minLength = MIN_CONTEXT_LENGTH,
): boolean {
  const combinedText = extractTextContent(messages);
  return combinedText.length > minLength;
}
