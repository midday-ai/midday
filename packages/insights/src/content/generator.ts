/**
 * AI content generation for insights
 */
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod/v4";
import type {
  ExpenseAnomaly,
  InsightActivity,
  InsightAnomaly,
  InsightContent,
  InsightMetric,
  PeriodType,
} from "../types";
import { buildInsightPrompt, getFallbackContent } from "./prompts";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Schema for AI-generated content
 * Note: OpenAI structured output requires all properties to be required,
 * so we use nullable() instead of optional() for optional fields.
 * 
 * "What Matters Now" format - action-first, specific names/amounts
 */
const insightContentSchema = z.object({
  title: z
    .string()
    .describe(
      "15-20 words. Conversational, like a friend catching you up. Main thing + bigger picture. NEVER sound like a notification.",
    ),
  sentiment: z
    .enum(["positive", "neutral", "challenging"])
    .describe("positive (wins/growth), neutral (steady), challenging (needs attention)"),
  opener: z
    .string()
    .describe("Max 15 words. Set up the story - what's the main thing happening this week?"),
  story: z
    .string()
    .describe("3-4 sentences telling the story of their week. Like catching up over coffee. Weave in comparison to usual and streaks when available."),
  actions: z
    .array(
      z.object({
        text: z.string().describe("Specific action with customer name and amount"),
      }),
    )
    .describe("1-2 specific actions. Primary action should be the single most impactful thing."),
  celebration: z
    .string()
    .nullable()
    .describe("A genuine win to celebrate (milestone, streak, personal best), or null if nothing notable"),
});

type InsightContentOutput = z.infer<typeof insightContentSchema>;

export type ContentGeneratorOptions = {
  model?: string;
};

/**
 * Content generator class for creating AI-powered insight summaries
 */
export class ContentGenerator {
  private model: string;

  constructor(options: ContentGeneratorOptions = {}) {
    this.model = options.model ?? "gpt-4o-mini";
  }

  /**
   * Generate insight content using AI
   */
  async generate(
    selectedMetrics: InsightMetric[],
    anomalies: InsightAnomaly[],
    activity: InsightActivity,
    periodLabel: string,
    periodType: PeriodType,
    currency: string,
    expenseAnomalies: ExpenseAnomaly[] = [],
  ): Promise<InsightContent> {
    const prompt = buildInsightPrompt(
      selectedMetrics,
      anomalies,
      activity,
      periodLabel,
      periodType,
      currency,
      expenseAnomalies,
    );

    try {
      const { object } = await generateObject({
        model: openai(this.model),
        schema: insightContentSchema,
        temperature: 0.4, // Lower for more consistent, focused output
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return {
        title: object.title,
        sentiment: object.sentiment,
        opener: object.opener,
        story: object.story,
        actions: object.actions.map((action) => ({
          text: action.text,
        })),
        celebration: object.celebration ?? undefined,
      };
    } catch (error) {
      console.error(
        "Failed to generate AI content:",
        error instanceof Error ? error.message : "Unknown error",
      );

      // Return fallback content with activity for context
      return getFallbackContent(periodLabel, periodType, activity);
    }
  }
}

/**
 * Create a content generator instance
 */
export function createContentGenerator(
  options?: ContentGeneratorOptions,
): ContentGenerator {
  return new ContentGenerator(options);
}
