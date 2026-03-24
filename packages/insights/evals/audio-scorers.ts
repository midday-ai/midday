/**
 * Scorers for audio script evals
 *
 * Tests for professional tone, appropriate length, and data accuracy
 */
import "dotenv/config";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createScorer } from "evalite";
import type { InsightSlots } from "../src/content/prompts/slots";

// ============================================================================
// Length and pacing scorers
// ============================================================================

/**
 * Word count should be 60-80 words (~20-30 seconds when spoken)
 */
export const audioWordCount = createScorer<InsightSlots, string>({
  name: "Audio: 60-80 words",
  description: "Audio script should be 60-80 words for optimal pacing",
  scorer: ({ output }) => {
    const count = output.trim().split(/\s+/).length;
    return count >= 60 && count <= 80 ? 1 : 0;
  },
});

/**
 * Sentences should be relatively short (average < 15 words)
 */
export const audioShortSentences = createScorer<InsightSlots, string>({
  name: "Audio: short sentences",
  description: "Average sentence length should be under 15 words for clarity",
  scorer: ({ output }) => {
    const sentences = output.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) return 0;

    const totalWords = output.trim().split(/\s+/).length;
    const avgWordsPerSentence = totalWords / sentences.length;

    return avgWordsPerSentence <= 15 ? 1 : 0;
  },
});

// ============================================================================
// Professional tone scorers - CRITICAL
// ============================================================================

/**
 * No exclamation marks - professional tone
 */
export const noExclamationMarks = createScorer<InsightSlots, string>({
  name: "Tone: no exclamation marks",
  description: "Professional audio should not use exclamation marks",
  scorer: ({ output }) => {
    return output.includes("!") ? 0 : 1;
  },
});

/**
 * No enthusiastic/unprofessional adjectives
 */
export const noEnthusiasticLanguage = createScorer<InsightSlots, string>({
  name: "Tone: no enthusiastic language",
  description:
    "Should avoid words like amazing, fantastic, incredible, awesome",
  scorer: ({ output }) => {
    const banned =
      /\b(amazing|fantastic|incredible|awesome|wonderful|brilliant|excellent|terrific|superb|phenomenal|extraordinary|stunning|spectacular|magnificent|fabulous|marvelous|tremendous|sensational|exceptional)\b/i;
    return banned.test(output) ? 0 : 1;
  },
});

/**
 * No celebratory phrases
 */
export const noCelebratoryPhrases = createScorer<InsightSlots, string>({
  name: "Tone: no celebratory phrases",
  description:
    "Should avoid celebratory phrases like 'congrats', 'well done', 'great job'",
  scorer: ({ output }) => {
    const banned =
      /\b(congrat(ulation)?s?|well done|great job|nice work|keep it up|way to go|you did it|pat yourself|celebrate|celebrating|cheers to|hats off|bravo|kudos)\b/i;
    return banned.test(output) ? 0 : 1;
  },
});

/**
 * No thanking customers or expressing gratitude about payments
 */
export const noThankingCustomers = createScorer<InsightSlots, string>({
  name: "Tone: no thanking customers",
  description: "Should not thank customers for paying - just report facts",
  scorer: ({ output }) => {
    const thankPatterns =
      /\b(thanks? to|thank(s|ful|fully)?|grateful|gratitude|appreciate[ds]?|shout[- ]?out)\b/i;
    return thankPatterns.test(output) ? 0 : 1;
  },
});

/**
 * No overly positive qualifiers
 */
export const noOverlyPositiveQualifiers = createScorer<InsightSlots, string>({
  name: "Tone: no overly positive qualifiers",
  description:
    "Should avoid qualifiers like 'really', 'very', 'incredibly', 'extremely'",
  scorer: ({ output }) => {
    // Only flag when combined with positive words
    const overlyPositive =
      /\b(really|very|incredibly|extremely|super|absolutely|totally)\s+(good|great|strong|solid|healthy|positive|impressive)\b/i;
    return overlyPositive.test(output) ? 0 : 1;
  },
});

// ============================================================================
// Format and structure scorers
// ============================================================================

/**
 * Should start with period label (Week X, January, etc.)
 */
export const startsWithPeriod = createScorer<InsightSlots, string>({
  name: "Format: starts with period",
  description: "Audio should open with the period (Week X, January, etc.)",
  scorer: ({ input, output }) => {
    const _firstWord = output.trim().split(/\s+/)[0]?.toLowerCase();

    // Check for week number or month name
    if (/^week\b/i.test(output)) return 1;
    if (
      /^(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
        output,
      )
    ) {
      return 1;
    }
    // Check if period label from input appears at start
    if (
      input.periodLabel &&
      output.toLowerCase().startsWith(input.periodLabel.toLowerCase())
    ) {
      return 1;
    }

    return 0;
  },
});

/**
 * No greetings (Hi, Hello, Good morning, etc.)
 */
export const noGreetings = createScorer<InsightSlots, string>({
  name: "Format: no greetings",
  description: "Should not start with generic greetings",
  scorer: ({ output }) => {
    const greetings =
      /^(hi|hello|hey|good\s+(morning|afternoon|evening)|greetings|welcome)\b/i;
    return greetings.test(output.trim()) ? 0 : 1;
  },
});

/**
 * No bullet points or list formatting
 */
export const noListFormatting = createScorer<InsightSlots, string>({
  name: "Format: no lists",
  description: "Audio script should be prose, not bullet points",
  scorer: ({ output }) => {
    const listPatterns = /^[\s]*[-•*]\s|^\d+\.\s/m;
    return listPatterns.test(output) ? 0 : 1;
  },
});

/**
 * Currency should be in spoken form, not abbreviations
 */
export const currencyInSpokenForm = createScorer<InsightSlots, string>({
  name: "Format: currency spoken",
  description: "Currency should be spoken (kronor, dollars) not abbreviated",
  scorer: ({ output }) => {
    // Check for common currency abbreviations that should be expanded
    const abbreviations = /\b(SEK|USD|EUR|GBP|NOK|DKK|kr\.?|€|\$|£)\b/;
    return abbreviations.test(output) ? 0 : 1;
  },
});

// ============================================================================
// Data accuracy scorers
// ============================================================================

/**
 * Extract numbers from text
 */
function extractNumbers(text: string): number[] {
  const matches = text.match(/[\d,.\s]+\d/g) || [];
  return matches
    .map((m) => {
      const cleaned = m.replace(/\s/g, "").replace(/,/g, "");
      return Number.parseFloat(cleaned);
    })
    .filter((n) => !Number.isNaN(n) && n > 0);
}

/**
 * Check if a number appears in text (with tolerance)
 * Handles both numeric and written forms
 */
function numberAppearsInText(
  num: number,
  text: string,
  tolerance = 0.15,
): boolean {
  const extracted = extractNumbers(text);
  const absNum = Math.abs(num);

  // Check for extracted numeric values first
  if (
    extracted.some(
      (n) => Math.abs(n - absNum) / Math.max(absNum, 1) < tolerance,
    )
  ) {
    return true;
  }

  // Parse written numbers from text to handle speech format
  // E.g., "three hundred thirty-nine thousand" = 339000
  const writtenPatterns = [
    // Hundreds of thousands
    {
      pattern: /(\w+)\s+hundred\s+(\w+)(?:-(\w+))?\s+thousand/i,
      parse: (m: RegExpMatchArray) => {
        const h = wordToNumber(m[1]!) * 100;
        const t = wordToNumber(m[2]!);
        const u = m[3] ? wordToNumber(m[3]) : 0;
        return (h + t + u) * 1000;
      },
    },
    // X hundred thousand
    {
      pattern: /(\w+)\s+hundred\s+thousand/i,
      parse: (m: RegExpMatchArray) => wordToNumber(m[1]!) * 100000,
    },
    // X thousand Y hundred (like "339 thousand")
    {
      pattern: /(\d+)\s+thousand/i,
      parse: (m: RegExpMatchArray) => Number.parseInt(m[1]!, 10) * 1000,
    },
    // Word thousands (one through ninety-nine thousand)
    {
      pattern: /(\w+)(?:-(\w+))?\s+thousand/i,
      parse: (m: RegExpMatchArray) => {
        const t = wordToNumber(m[1]!);
        const u = m[2] ? wordToNumber(m[2]) : 0;
        return (t + u) * 1000;
      },
    },
    // X thousand Y (like "5 thousand 600")
    {
      pattern: /(\d+)\s+thousand\s+(\d+)/i,
      parse: (m: RegExpMatchArray) =>
        Number.parseInt(m[1]!, 10) * 1000 + Number.parseInt(m[2]!, 10),
    },
  ];

  for (const { pattern, parse } of writtenPatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const value = parse(match);
        if (
          value > 0 &&
          Math.abs(value - absNum) / Math.max(absNum, 1) < tolerance
        ) {
          return true;
        }
      } catch {
        // Pattern matched but parsing failed, continue
      }
    }
  }

  return false;
}

/**
 * Convert a word to a number
 */
function wordToNumber(word: string): number {
  const words: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
  };
  return words[word.toLowerCase()] ?? 0;
}

/**
 * Profit value should be mentioned (approximately)
 */
export const audioHasProfit = createScorer<InsightSlots, string>({
  name: "Accuracy: profit mentioned",
  description: "Audio should mention the profit amount",
  scorer: ({ input, output }) => {
    if (input.profitRaw === 0) return 1;

    const profitNum = Math.abs(input.profitRaw);

    // Check for the number or approximate verbal version
    if (numberAppearsInText(profitNum, output, 0.2)) {
      return 1;
    }

    // Check for "loss" if negative
    if (input.profitRaw < 0 && /loss/i.test(output)) {
      return 0.5; // Partial credit
    }

    return 0;
  },
});

/**
 * If overdue invoices exist, they should be mentioned
 */
export const audioMentionsOverdue = createScorer<InsightSlots, string>({
  name: "Accuracy: overdue mentioned",
  description: "Overdue invoices should be mentioned when they exist",
  scorer: ({ input, output }) => {
    if (!input.hasOverdue || input.overdueCount === 0) {
      return 1;
    }

    if (/overdue/i.test(output)) {
      return 1;
    }

    // Also accept "owes", "owed", "outstanding"
    if (/\b(owes?|owed|outstanding|unpaid)\b/i.test(output)) {
      return 0.75;
    }

    return 0;
  },
});

/**
 * No false growth language when in loss
 */
export const audioNoFalseGrowth = createScorer<InsightSlots, string>({
  name: "Accuracy: no false growth in loss",
  description: "When in loss, should not use growth language",
  scorer: ({ input, output }) => {
    if (input.profitRaw >= 0) {
      return 1;
    }

    const textLower = output.toLowerCase();
    const badPhrases = [
      "doubled",
      "tripled",
      "grew",
      "growth",
      "strong momentum",
      "profit up",
      "profits up",
      "profit increased",
    ];

    for (const phrase of badPhrases) {
      if (textLower.includes(phrase)) {
        return 0;
      }
    }

    return 1;
  },
});

// ============================================================================
// LLM-as-judge scorer for professional tone
// ============================================================================

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Professional tone evaluation using LLM
 */
export const audioProfessionalTone = createScorer<InsightSlots, string>({
  name: "Tone: professional (LLM judge)",
  description:
    "Audio should sound like a professional financial analyst, not a cheerleader",
  scorer: async ({ input, output }) => {
    const prompt = `You are evaluating if a financial audio summary has an appropriate professional tone.

CONTEXT:
- This is a weekly financial summary for a business owner
- It should sound like a calm, professional financial advisor
- It should NOT sound like a marketing message or celebration

AUDIO SCRIPT TO EVALUATE:
"${output}"

EVALUATION CRITERIA:
1. Calm and measured - not excited or enthusiastic
2. Factual - states numbers and facts clearly
3. No cheerleading - doesn't celebrate or congratulate
4. No superlatives - avoids "amazing", "fantastic", "incredible"
5. Professional - like a trusted advisor, not a friend
6. Trustworthy - inspires confidence through competence, not enthusiasm

Think step by step:
1. What is the overall tone of this audio?
2. Are there any unprofessional elements?
3. Does it sound like a calm financial analyst?

VERDICT: PASS if professional and calm, FAIL if too enthusiastic or unprofessional.

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
          weekType: input.weekType,
          reasoning: result.text,
        },
      };
    } catch (error) {
      return {
        score: 0.5,
        metadata: { error: String(error) },
      };
    }
  },
});

// ============================================================================
// Export all scorers
// ============================================================================

/**
 * Length and pacing scorers
 */
export const lengthScorers = [audioWordCount, audioShortSentences];

/**
 * Professional tone scorers (deterministic)
 */
export const toneScorers = [
  noExclamationMarks,
  noEnthusiasticLanguage,
  noCelebratoryPhrases,
  noThankingCustomers,
  noOverlyPositiveQualifiers,
];

/**
 * Format scorers
 */
export const formatScorers = [
  startsWithPeriod,
  noGreetings,
  noListFormatting,
  currencyInSpokenForm,
];

/**
 * Accuracy scorers
 */
export const accuracyScorers = [
  audioHasProfit,
  audioMentionsOverdue,
  audioNoFalseGrowth,
];

/**
 * All deterministic scorers
 */
export const deterministicAudioScorers = [
  ...lengthScorers,
  ...toneScorers,
  ...formatScorers,
  ...accuracyScorers,
];

/**
 * All audio scorers including LLM judge
 */
export const audioScorers = [
  ...deterministicAudioScorers,
  audioProfessionalTone,
];
