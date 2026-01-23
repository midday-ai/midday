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
  InsightPredictions,
  MomentumContext,
  PeriodType,
  PreviousPredictionsContext,
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
      "20-35 words. Week snapshot for widget cards. Lead with profit and context (margin, comparison). Include runway and any overdue. NO superlatives. Use full amounts. Example: '338,958 kr profit on 350,000 kr revenue - healthy 97% margin. 14 months runway. Acme Inc owes 750 kr.'",
    ),
  summary: z
    .string()
    .describe(
      "30-50 words. Use EXACT amounts from the data. If mentioning overdue, use EXACT customer name from the data. Include: profit, revenue, expenses, runway, overdue (if any). NEVER make up customer names.",
    ),
  story: z
    .string()
    .describe(
      "2-3 sentences that make the owner FEEL something. Celebrate wins ('profit up 7x - that's the kind of week you remember'), add historical context ('best since October'), patterns, implications. NO amounts (those are in summary). NO action reminders (those are in actions).",
    ),
  actions: z
    .array(
      z.object({
        text: z
          .string()
          .describe(
            "Action with EXACT customer name and amount from the data. NEVER make up names.",
          ),
      }),
    )
    .describe(
      "1-2 actions using ONLY data provided. Priority: 1) Overdue invoices 2) Draft invoices 3) Unbilled work. Empty array if no actionable data.",
    ),
});

type InsightContentOutput = z.infer<typeof insightContentSchema>;

export type ContentGeneratorOptions = {
  model?: string;
};

/**
 * Year-over-year comparison data
 */
export type YearOverYearContext = {
  lastYearRevenue: number;
  lastYearProfit: number;
  revenueChangePercent: number;
  profitChangePercent: number;
  hasComparison: boolean;
};

/**
 * Additional context for content generation (momentum, predictions, etc.)
 */
export type ContentGenerationContext = {
  momentumContext?: MomentumContext;
  previousPredictions?: PreviousPredictionsContext;
  predictions?: InsightPredictions;
  yearOverYear?: YearOverYearContext;
  runwayMonths?: number;
  locale?: string;
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
    context: ContentGenerationContext = {},
  ): Promise<InsightContent> {
    const prompt = buildInsightPrompt(
      selectedMetrics,
      anomalies,
      activity,
      periodLabel,
      periodType,
      currency,
      expenseAnomalies,
      context,
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
        summary: object.summary,
        story: object.story,
        actions: object.actions.map((action) => ({
          text: action.text,
        })),
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
