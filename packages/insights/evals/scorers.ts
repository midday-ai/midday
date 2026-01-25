/**
 * Scorers for insight evals
 *
 * Only scorers that catch real quality problems
 */
import "dotenv/config";
import { createScorer } from "evalite";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
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
 * Title word count should be 15-30 words
 */
export const titleWordCount = createScorer<InsightSlots, InsightOutput>({
  name: "Title: 15-30 words",
  description: "Title should be substantial but not too long",
  scorer: ({ output }) => {
    const count = output.title.trim().split(/\s+/).length;
    return count >= 15 && count <= 30 ? 1 : 0;
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
 * Summary word count should be 40-60 words
 */
export const summaryWordCount = createScorer<InsightSlots, InsightOutput>({
  name: "Summary: 40-60 words",
  description: "Summary should be complete but concise",
  scorer: ({ output }) => {
    const count = output.summary.trim().split(/\s+/).length;
    return count >= 40 && count <= 60 ? 1 : 0;
  },
});

/**
 * No banned adjectives anywhere — they sound generic
 */
export const noBannedPhrases = createScorer<InsightSlots, InsightOutput>({
  name: "No banned phrases",
  description: "Output should not use generic/flowery adjectives",
  scorer: ({ output }) => {
    const fullText = `${output.title} ${output.summary} ${output.story}`;
    const banned =
      /\b(robust|solid|excellent|strong|healthy|remarkable|impressive|amazing|outstanding|significant)\b/i;
    return banned.test(fullText) ? 0 : 1;
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

/**
 * All deterministic scorers (cheap, always run)
 */
export const deterministicScorers = [
  titleHasPersonalPronoun,
  titleNoLeadingNumber,
  titleWordCount,
  summaryNoThisPeriod,
  summaryWordCount,
  noBannedPhrases,
];

/**
 * All scorers including LLM-as-judge
 */
export const allScorers = [...deterministicScorers, toneAppropriate];
