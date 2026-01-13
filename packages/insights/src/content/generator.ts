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
 */
const insightContentSchema = z.object({
  title: z
    .string()
    .describe(
      "Exactly one sentence. Format: 'Revenue $X, Expenses $Y, Net $Z. [Other metric]. [Sentiment]!'. Use actual numbers and currency symbol from data.",
    ),
  sentiment: z
    .enum(["positive", "neutral", "challenging"])
    .describe("positive, neutral, or challenging"),
  opener: z
    .string()
    .describe("Max 10 words. The single most important insight."),
  story: z
    .string()
    .describe("Exactly 2 sentences connecting specific data points."),
  actions: z
    .array(
      z.object({
        text: z.string().describe("Specific action with names/amounts"),
      }),
    )
    .describe("Exactly 2 specific actions"),
  celebration: z
    .string()
    .nullable()
    .describe("A genuine win to celebrate, or null"),
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

      // Return fallback content
      return getFallbackContent(periodLabel, periodType);
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
