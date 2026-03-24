import { createOpenAI } from "@ai-sdk/openai";
/**
 * AI content generation for insights
 *
 * Uses split prompts for maximum quality:
 * - Title: Concise headline (10-20 words)
 * - Summary: Complete financial picture (40-60 words)
 * - Story: Forward-looking or actionable insight (max 15 words)
 * - Actions: Specific actionable items with exact names/amounts
 */
import { createLoggerWithContext } from "@midday/logger";
import { generateObject, generateText } from "ai";
import { z } from "zod/v4";

const logger = createLoggerWithContext("insights:generator");

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
import { getFallbackContent } from "./prompts";
import {
  buildActionsPrompt,
  buildAudioPrompt,
  buildStoryPrompt,
  buildSummaryPrompt,
  buildTitlePrompt,
  computeSlots,
} from "./prompts/index";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
 * Revenue concentration data
 */
export type RevenueConcentrationContext = {
  topCustomer: { name: string; revenue: number; percentage: number } | null;
  isConcentrated: boolean;
};

/**
 * Quarter pace projection data
 */
export type QuarterPaceContext = {
  currentQuarter: number;
  qtdRevenue: number;
  projectedRevenue: number;
  lastYearQuarterRevenue: number;
  vsLastYearPercent: number;
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
  quarterPace?: QuarterPaceContext;
  runwayMonths?: number;
  periodEnd?: Date; // End of insight period, for calculating dates relative to period
  locale?: string;
  weeksOfHistory?: number;
  revenueConcentration?: RevenueConcentrationContext;
  /** All computed metrics (for activity metric change descriptions) */
  allMetrics?: Record<string, InsightMetric>;
};

/**
 * Content generator class for creating AI-powered insight summaries
 *
 * Uses split prompts for maximum quality:
 * 1. Title + Summary generated in parallel (both only need slots)
 * 2. Story generated after (needs title/summary context)
 * 3. Actions generated in parallel with story (only needs slots)
 */
export class ContentGenerator {
  private model: string;

  constructor(options: ContentGeneratorOptions = {}) {
    // gpt-4.1-mini: best instruction following + cost efficiency for text generation
    this.model = options.model ?? "gpt-4.1-mini";
  }

  /**
   * Generate insight content using split focused prompts
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
    const startTime = Date.now();

    try {
      // 1. Compute all slots (exact values for AI to use)
      const slots = computeSlots(
        selectedMetrics,
        activity,
        currency,
        periodLabel,
        periodType,
        {
          momentumContext: context.momentumContext,
          yearOverYear: context.yearOverYear,
          quarterPace: context.quarterPace,
          runwayMonths: context.runwayMonths,
          periodEnd: context.periodEnd,
          weeksOfHistory: context.weeksOfHistory,
          expenseAnomalies,
          revenueConcentration: context.revenueConcentration,
          anomalies,
          allMetrics: context.allMetrics,
          predictions: context.predictions,
        },
      );

      logger.debug("Slots computed", {
        weekType: slots.weekType,
        profit: slots.profitRaw,
        revenue: slots.revenueRaw,
        expenses: slots.expensesRaw,
        isFirstInsight: slots.isFirstInsight,
      });

      // 2. Generate title, summary, actions, and audio script in parallel
      const [title, summary, actions, audioScript] = await Promise.all([
        this.generateTitle(slots),
        this.generateSummary(slots),
        this.generateActions(slots),
        this.generateAudioScript(slots),
      ]);

      // 3. Generate story
      const story = await this.generateStory(slots);

      const duration = Date.now() - startTime;
      logger.info("Content generated", {
        model: this.model,
        durationMs: duration,
        actionsCount: actions.length,
        hasAudioScript: !!audioScript,
      });

      return { title, summary, story, actions, audioScript };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Failed to generate AI content", {
        error: error instanceof Error ? error.message : "Unknown error",
        model: this.model,
        durationMs: duration,
        periodLabel,
      });

      // Return fallback content with activity for context
      return getFallbackContent(periodLabel, periodType, activity);
    }
  }

  /**
   * Generate title using focused prompt
   */
  private async generateTitle(
    slots: ReturnType<typeof computeSlots>,
  ): Promise<string> {
    const prompt = buildTitlePrompt(slots);

    const { text } = await generateText({
      model: openai(this.model),
      temperature: 0.3, // Lower for consistency
      prompt,
    });

    return text.trim();
  }

  /**
   * Generate summary using focused prompt
   */
  private async generateSummary(
    slots: ReturnType<typeof computeSlots>,
  ): Promise<string> {
    const prompt = buildSummaryPrompt(slots);

    const { text } = await generateText({
      model: openai(this.model),
      temperature: 0.3,
      prompt,
    });

    return text.trim();
  }

  /**
   * Generate story using focused prompt
   */
  private async generateStory(
    slots: ReturnType<typeof computeSlots>,
  ): Promise<string> {
    const prompt = buildStoryPrompt(slots);

    const { text } = await generateText({
      model: openai(this.model),
      temperature: 0.4, // Slightly higher for creative forward-looking content
      prompt,
    });

    // Strip quotes and clean up
    return text.trim().replace(/^["']|["']$/g, "");
  }

  /**
   * Generate TTS-optimized audio script
   * Natural spoken content designed for ElevenLabs
   */
  private async generateAudioScript(
    slots: ReturnType<typeof computeSlots>,
  ): Promise<string> {
    const prompt = buildAudioPrompt(slots);

    const { text } = await generateText({
      model: openai(this.model),
      temperature: 0.5, // Slightly higher for natural conversational tone
      prompt,
    });

    // Clean up any accidental formatting
    return text
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ");
  }

  /**
   * Generate actions using structured output
   */
  private async generateActions(
    slots: ReturnType<typeof computeSlots>,
  ): Promise<
    Array<{
      text: string;
      type?: string;
      entityType?: "invoice" | "project" | "customer" | "transaction";
      entityId?: string;
    }>
  > {
    const prompt = buildActionsPrompt(slots);

    // No actionable data
    if (!prompt) {
      return [];
    }

    const { object } = await generateObject({
      model: openai(this.model),
      temperature: 0.2, // Low for consistent structured output
      schema: z.object({
        actions: z.array(z.object({ text: z.string() })),
      }),
      prompt,
    });

    // Enrich actions with deep links based on slot data
    return object.actions.map((action) => {
      const enriched = this.enrichActionWithEntity(action.text, slots);
      return enriched;
    });
  }

  /**
   * Match action text to slot data and add entity ID for client-side sheet opening
   */
  private enrichActionWithEntity(
    text: string,
    slots: ReturnType<typeof computeSlots>,
  ): {
    text: string;
    type?: string;
    entityType?: "invoice" | "project" | "customer" | "transaction";
    entityId?: string;
  } {
    const textLower = text.toLowerCase();

    // Check overdue invoices
    for (const inv of slots.overdue) {
      if (textLower.includes(inv.company.toLowerCase())) {
        return {
          text,
          type: "overdue",
          entityType: "invoice",
          entityId: inv.id,
        };
      }
    }

    // Check drafts
    for (const draft of slots.drafts) {
      if (textLower.includes(draft.company.toLowerCase())) {
        return {
          text,
          type: "draft",
          entityType: "invoice",
          entityId: draft.id,
        };
      }
    }

    // No match - return as is
    return { text };
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
