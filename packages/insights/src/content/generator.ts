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
 */
const insightContentSchema = z.object({
  goodNews: z.string().describe("1-2 sentences of positive news to start"),
  story: z.string().describe("2-3 sentences explaining what happened"),
  actions: z
    .array(
      z.object({
        text: z.string().describe("The action item text"),
        type: z
          .string()
          .optional()
          .describe("Type of action: review, send, follow_up, optimize"),
        deepLink: z.string().optional().describe("Optional deep link path"),
      }),
    )
    .describe("3-4 specific actionable recommendations"),
  celebration: z
    .string()
    .optional()
    .describe("Optional celebration message for milestones"),
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
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return {
        goodNews: object.goodNews,
        story: object.story,
        actions: object.actions,
        celebration: object.celebration,
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
