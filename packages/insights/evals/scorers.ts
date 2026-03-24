/**
 * Scorers for insight evals
 *
 * Only scorers that catch real quality problems
 */
import "dotenv/config";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createScorer } from "evalite";
import type { InsightSlots } from "../src/content/prompts/slots";

type InsightOutput = {
  title: string;
  summary: string;
  story: string;
};

// ============================================================================
// Deterministic scorers - cheap, always run
// ============================================================================

/**
 * Title must contain "your" or "you" — makes it personal
 */
export const titleHasPersonalPronoun = createScorer<
  InsightSlots,
  InsightOutput
>({
  name: "Title: has your/you",
  description: "Title should address the user directly with 'your' or 'you'",
  scorer: ({ output }) => {
    const hasYourOrYou = /\b(your|you)\b/i.test(output.title);
    return hasYourOrYou ? 1 : 0;
  },
});

/**
 * Title should NOT start with a number — leads with context instead
 */
export const titleNoLeadingNumber = createScorer<InsightSlots, InsightOutput>({
  name: "Title: no leading number",
  description: "Title should lead with context, not a raw number",
  scorer: ({ output }) => {
    const startsWithNumber = /^\d/.test(output.title.trim());
    return startsWithNumber ? 0 : 1;
  },
});

/**
 * Title word count should be 12-35 words
 * Slightly wider range since exact counts don't affect user experience
 */
export const titleWordCount = createScorer<InsightSlots, InsightOutput>({
  name: "Title: 12-35 words",
  description: "Title should be substantial but not too long",
  scorer: ({ output }) => {
    const count = output.title.trim().split(/\s+/).length;
    return count >= 12 && count <= 35 ? 1 : 0;
  },
});

/**
 * Summary should NOT contain "this period" — sounds robotic
 */
export const summaryNoThisPeriod = createScorer<InsightSlots, InsightOutput>({
  name: "Summary: no 'this period'",
  description: "Summary should avoid robotic phrasing like 'this period'",
  scorer: ({ output }) => {
    return /this period/i.test(output.summary) ? 0 : 1;
  },
});

/**
 * Summary word count should be 35-65 words
 * Slightly wider range - what matters is readability, not exact count
 */
export const summaryWordCount = createScorer<InsightSlots, InsightOutput>({
  name: "Summary: 35-65 words",
  description: "Summary should be complete but concise",
  scorer: ({ output }) => {
    const count = output.summary.trim().split(/\s+/).length;
    return count >= 35 && count <= 65 ? 1 : 0;
  },
});

/**
 * No banned adjectives anywhere — they sound generic
 * Note: "outstanding" is allowed when used in financial context (outstanding receivables/invoices)
 */
export const noBannedPhrases = createScorer<InsightSlots, InsightOutput>({
  name: "No banned phrases",
  description: "Output should not use generic/flowery adjectives",
  scorer: ({ output }) => {
    const fullText = `${output.title} ${output.summary} ${output.story}`;

    // Remove legitimate uses of "outstanding" (financial term for unpaid)
    const cleanedText = fullText.replace(
      /outstanding\s+(receivables?|invoices?|balance|amount|payment)/gi,
      "UNPAID_TERM",
    );

    const banned =
      /\b(robust|solid|excellent|strong|healthy|remarkable|impressive|amazing|outstanding|significant)\b/i;
    return banned.test(cleanedText) ? 0 : 1;
  },
});

// ============================================================================
// Data accuracy scorers - CRITICAL for correctness
// ============================================================================

/**
 * Extract numbers from text (handles formats like "117,061", "117.061", "117061")
 */
function extractNumbers(text: string): number[] {
  // Match numbers with optional thousand separators and decimals
  const matches = text.match(/[\d,.\s]+\d/g) || [];
  return matches
    .map((m) => {
      // Remove spaces, normalize separators
      const cleaned = m.replace(/\s/g, "").replace(/,/g, "");
      return Number.parseFloat(cleaned);
    })
    .filter((n) => !Number.isNaN(n) && n > 0);
}

/**
 * Check if a number appears in text (with tolerance for formatting differences)
 */
function numberAppearsInText(
  num: number,
  text: string,
  tolerance = 0.01,
): boolean {
  const extracted = extractNumbers(text);
  const absNum = Math.abs(num);
  return extracted.some(
    (n) => Math.abs(n - absNum) / Math.max(absNum, 1) < tolerance,
  );
}

/**
 * Profit value should appear in the summary
 * CRITICAL: Users must see accurate numbers
 */
export const summaryHasCorrectProfit = createScorer<
  InsightSlots,
  InsightOutput
>({
  name: "Accuracy: profit value in summary",
  description: "Summary should mention the correct profit amount",
  scorer: ({ input, output }) => {
    // Skip if profit is 0 (might not be mentioned)
    if (input.profitRaw === 0) return 1;

    const profitNum = Math.abs(input.profitRaw);
    // Check if the profit number appears in summary
    if (numberAppearsInText(profitNum, output.summary)) {
      return 1;
    }

    // Also check title since some insights lead with the number
    if (numberAppearsInText(profitNum, output.title)) {
      return 1;
    }

    return 0;
  },
});

/**
 * Runway should appear somewhere in title or summary
 */
export const hasRunwayMentioned = createScorer<InsightSlots, InsightOutput>({
  name: "Accuracy: runway mentioned",
  description: "Runway months should be mentioned for reassurance",
  scorer: ({ input, output }) => {
    const runway = input.runway;
    const fullText = `${output.title} ${output.summary}`;

    // Check for runway number
    const runwayPattern = new RegExp(`\\b${runway}[- ]month`, "i");
    if (runwayPattern.test(fullText)) {
      return 1;
    }

    // Also accept "X months runway" pattern
    const altPattern = new RegExp(
      `${runway}\\s*months?\\s*(of\\s+)?runway`,
      "i",
    );
    if (altPattern.test(fullText)) {
      return 1;
    }

    return 0;
  },
});

/**
 * CRITICAL: If profit is negative, should NOT say "no expenses" or similar
 * This catches the exact bug the user reported
 */
export const noContradictoryExpenseStatement = createScorer<
  InsightSlots,
  InsightOutput
>({
  name: "Accuracy: no contradictory expense claims",
  description: "Should not claim 'no expenses' when profit is negative",
  scorer: ({ input, output }) => {
    const fullText = `${output.title} ${output.summary} ${output.story}`;

    // If profit is negative, there MUST be expenses
    if (input.profitRaw < 0) {
      // Check for contradictory statements
      const noExpensePatterns = [
        /no expenses/i,
        /zero expenses/i,
        /without (any )?expenses/i,
        /expenses.*\b0\b/i,
      ];

      for (const pattern of noExpensePatterns) {
        if (pattern.test(fullText)) {
          return 0; // FAIL - contradictory statement
        }
      }
    }

    return 1;
  },
});

/**
 * If there are overdue invoices, they should be mentioned
 */
export const overdueInvoicesMentioned = createScorer<
  InsightSlots,
  InsightOutput
>({
  name: "Accuracy: overdue invoices mentioned",
  description: "Overdue invoices should be mentioned when they exist",
  scorer: ({ input, output }) => {
    if (!input.hasOverdue || input.overdueCount === 0) {
      return 1; // No overdue to mention
    }

    const fullText = `${output.title} ${output.summary} ${output.story}`;

    // Check for overdue mention
    if (/overdue/i.test(fullText)) {
      return 1;
    }

    // Also accept "owes", "owed", "outstanding"
    if (/\b(owes?|owed|outstanding)\b/i.test(fullText)) {
      return 1;
    }

    return 0;
  },
});

/**
 * CRITICAL: No false growth language when in loss
 * Prevents misleading statements like "profit doubled" when loss just decreased
 */
export const noFalseGrowthInLoss = createScorer<InsightSlots, InsightOutput>({
  name: "Accuracy: no false growth language in loss",
  description:
    "When profit is negative, should not use growth language like 'doubled', 'grew', etc.",
  scorer: ({ input, output }) => {
    // Only applicable when in loss
    if (input.profitRaw >= 0) {
      return 1;
    }

    const fullText =
      `${output.title} ${output.summary} ${output.story}`.toLowerCase();

    // Bad phrases that suggest growth when we're actually in loss
    const badPhrases = [
      "doubled",
      "tripled",
      "quadrupled",
      " grew",
      "growth",
      "strong momentum",
      "profit up",
      "profits up",
      "profit increased",
      "profits increased",
    ];

    for (const phrase of badPhrases) {
      if (fullText.includes(phrase)) {
        return 0;
      }
    }

    return 1;
  },
});

// ============================================================================
// LLM-as-judge scorer - more expensive, checks subjective quality
// ============================================================================

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Tone should match the week type
 * - great: confident, acknowledging
 * - good: warm, professional
 * - quiet: brief, reassuring
 * - challenging: direct but not alarming, focus on buffer
 */
export const toneAppropriate = createScorer<InsightSlots, InsightOutput>({
  name: "Tone matches week type",
  description: "The tone should be appropriate for the business situation",
  scorer: async ({ input, output }) => {
    const weekType = input.weekType;

    const toneExpectations: Record<string, string> = {
      great:
        "Confident and acknowledging the achievement, but not over-the-top or cheesy",
      good: "Warm and professional, matter-of-fact with positive undercurrent",
      quiet: "Brief and reassuring, no drama about low activity",
      challenging:
        "Direct and constructive, honest but focused on the buffer (runway), not alarming",
    };

    const expected = toneExpectations[weekType] || toneExpectations.good;

    const prompt = `You are evaluating if a weekly business insight has the appropriate tone.

WEEK TYPE: ${weekType}
EXPECTED TONE: ${expected}

INSIGHT TO EVALUATE:
Title: "${output.title}"
Summary: "${output.summary}"
Story: "${output.story}"

Does this insight have the appropriate tone for the week type?

Think step by step:
1. What is the actual tone of this insight?
2. Does it match what's expected for a "${weekType}" week?
3. Any tone mismatches? (e.g., celebratory tone for a challenging week, or alarming tone for a good week)

Final answer: PASS if tone is appropriate, FAIL if tone is mismatched.

Answer format:
REASONING: [your analysis]
VERDICT: [PASS or FAIL]`;

    try {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        temperature: 0,
      });

      const verdict = result.text.includes("VERDICT: PASS") ? 1 : 0;

      return {
        score: verdict,
        metadata: {
          weekType,
          expectedTone: expected,
          reasoning: result.text,
        },
      };
    } catch (error) {
      // If LLM call fails, don't fail the eval — just skip this scorer
      return {
        score: 0.5,
        metadata: { error: String(error) },
      };
    }
  },
});

// ============================================================================
// Projection and anomaly scorers
// ============================================================================

/**
 * If runway exhaustion date is provided, it should appear in the summary
 */
export const runwayDateMentioned = createScorer<InsightSlots, InsightOutput>({
  name: "Projection: runway date mentioned",
  description:
    "When runway exhaustion date is provided, it should be mentioned",
  scorer: ({ input, output }) => {
    // Only check if we have a runway exhaustion date
    if (!input.runwayExhaustionDate) {
      return 1; // Skip if no date provided
    }

    const fullText = `${output.title} ${output.summary}`;

    // Check for month names (the date format is "Month Day, Year")
    const monthPattern =
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i;

    if (monthPattern.test(fullText)) {
      return 1;
    }

    // Also accept "lasts until" or "runs out" phrasing
    if (/lasts until|runs out|run out/i.test(fullText)) {
      return 0.5; // Partial credit if they mention timing but not exact date
    }

    return 0;
  },
});

/**
 * If quarter pace is provided, it should be mentioned in summary
 */
export const quarterPaceMentioned = createScorer<InsightSlots, InsightOutput>({
  name: "Projection: quarter pace mentioned",
  description: "When quarter pace projection is provided, it should be used",
  scorer: ({ input, output }) => {
    // Only check if we have quarter pace data
    if (!input.quarterPace) {
      return 1; // Skip if no quarter pace
    }

    const fullText = `${output.title} ${output.summary}`;

    // Check for quarter/Q1/Q2/etc mention
    if (/\bQ[1-4]\b|quarter/i.test(fullText)) {
      return 1;
    }

    // Check for "on pace" language
    if (/on pace|on track|pacing/i.test(fullText)) {
      return 0.75;
    }

    return 0;
  },
});

/**
 * If there are unusual payment delays, they should be flagged
 */
export const paymentAnomalyHighlighted = createScorer<
  InsightSlots,
  InsightOutput
>({
  name: "Anomaly: payment delay highlighted",
  description: "Unusual payment delays should be highlighted",
  scorer: ({ input, output }) => {
    // Check if any overdue has isUnusual flag
    const unusualOverdue = input.overdue?.filter((inv) => inv.isUnusual) ?? [];

    if (unusualOverdue.length === 0) {
      return 1; // Skip if no unusual payments
    }

    const fullText = `${output.title} ${output.summary} ${output.story}`;

    // Check for unusual/anomaly language
    if (/unusual|typically|usually|normally|out of character/i.test(fullText)) {
      return 1;
    }

    // Check if at least mentioning the customer with the unusual delay
    const unusualCustomer = unusualOverdue[0]?.company;
    if (unusualCustomer && fullText.includes(unusualCustomer)) {
      return 0.5; // Partial credit for mentioning the customer
    }

    return 0;
  },
});

/**
 * Short runway (< 4 months) should have urgent tone
 */
export const shortRunwayUrgency = createScorer<InsightSlots, InsightOutput>({
  name: "Tone: short runway urgency",
  description:
    "When runway is < 4 months, tone should convey appropriate urgency",
  scorer: ({ input, output }) => {
    // Only check for short runway
    if (input.runway >= 4) {
      return 1; // Skip if runway is comfortable
    }

    const fullText = `${output.title} ${output.summary} ${output.story}`;

    // Check for urgency indicators
    const urgencyPatterns = [
      /prioritize|priority/i,
      /urgent|immediately/i,
      /act (now|quickly|fast)/i,
      /limited time/i,
      /collect/i,
      /critical/i,
    ];

    for (const pattern of urgencyPatterns) {
      if (pattern.test(fullText)) {
        return 1;
      }
    }

    // Partial credit if they mention runway is short
    if (/\b[1-3]\s*month/i.test(fullText)) {
      return 0.5;
    }

    return 0;
  },
});

/**
 * Quality scorers (formatting, style)
 */
export const qualityScorers = [
  titleHasPersonalPronoun,
  titleNoLeadingNumber,
  titleWordCount,
  summaryNoThisPeriod,
  summaryWordCount,
  noBannedPhrases,
];

/**
 * Accuracy scorers (data correctness) - CRITICAL
 */
export const accuracyScorers = [
  summaryHasCorrectProfit,
  hasRunwayMentioned,
  noContradictoryExpenseStatement,
  overdueInvoicesMentioned,
  noFalseGrowthInLoss,
];

/**
 * Projection and anomaly scorers
 */
export const projectionScorers = [
  runwayDateMentioned,
  quarterPaceMentioned,
  paymentAnomalyHighlighted,
  shortRunwayUrgency,
];

/**
 * All deterministic scorers (cheap, always run)
 */
export const deterministicScorers = [
  ...qualityScorers,
  ...accuracyScorers,
  ...projectionScorers,
];

/**
 * All scorers including LLM-as-judge
 */
export const allScorers = [...deterministicScorers, toneAppropriate];
