/**
 * Audio script builder for insights
 *
 * Target: ~25-35 seconds of audio
 * Structure: opening → summary → story → alerts → highlight
 */
import type { InsightActivity, InsightContent, InsightMetric } from "../types";

export type AudioScriptOptions = {
  content: InsightContent;
  periodLabel: string;
  metrics: InsightMetric[];
  activity?: InsightActivity;
  currency?: string;
};

/**
 * Currency code to spoken word mapping
 * ElevenLabs struggles with abbreviations like "kr", "SEK", etc.
 */
const CURRENCY_SPEECH_MAP: Record<string, string> = {
  // Nordic
  SEK: "Swedish kronor",
  NOK: "Norwegian kroner",
  DKK: "Danish kroner",
  ISK: "Icelandic króna",
  // Common
  USD: "dollars",
  EUR: "euros",
  GBP: "pounds",
  CHF: "Swiss francs",
  JPY: "yen",
  CAD: "Canadian dollars",
  AUD: "Australian dollars",
  NZD: "New Zealand dollars",
  // Abbreviations
  kr: "kronor",
  "kr.": "kronor",
};

/**
 * Normalize text for better TTS pronunciation
 * - Removes decimals from currency amounts (5,644.42 → 5,644)
 * - Rounds percentages (75.3% → 75%)
 * - Converts currency codes to spoken words
 * - Expands abbreviations (vs → versus, avg → average)
 * - Improves date pronunciation
 */
export function normalizeForSpeech(text: string): string {
  let normalized = text;

  // Remove decimals from large numbers (5,644.42 → 5,644)
  // Only for numbers with thousand separators (not percentages like 75.3%)
  normalized = normalized.replace(/(\d{1,3}(?:,\d{3})+)\.\d+/g, "$1");

  // Round percentages to whole numbers (75.3% → 75%)
  normalized = normalized.replace(/(\d+)\.\d+%/g, "$1%");

  // Replace currency codes with spoken equivalents
  for (const [code, spoken] of Object.entries(CURRENCY_SPEECH_MAP)) {
    const pattern = new RegExp(`(\\d[\\d,]*)\\s*${code}\\b`, "gi");
    normalized = normalized.replace(pattern, `$1 ${spoken}`);
  }

  // Expand common abbreviations
  normalized = normalized.replace(/\bvs\.?\b/gi, "versus");
  normalized = normalized.replace(/\bavg\.?\b/gi, "average");
  normalized = normalized.replace(/\bapprox\.?\b/gi, "approximately");

  // Make dates sound more natural (February 24, → February 24th,)
  // Match month + day number at word boundary
  const months =
    "January|February|March|April|May|June|July|August|September|October|November|December";
  normalized = normalized.replace(
    new RegExp(`(${months})\\s+(\\d{1,2})(?=[,\\s]|$)`, "g"),
    (_, month, day) => {
      const num = Number.parseInt(day, 10);
      const suffix =
        num === 1 || num === 21 || num === 31
          ? "st"
          : num === 2 || num === 22
            ? "nd"
            : num === 3 || num === 23
              ? "rd"
              : "th";
      return `${month} ${num}${suffix}`;
    },
  );

  // Clean up any double spaces
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Get the most notable metric highlight for audio
 */
function getMetricHighlight(metrics: InsightMetric[]): string | null {
  if (!metrics.length) return null;

  // Find the most significant change (positive or negative)
  const significant = metrics
    .filter((m) => Math.abs(m.change) >= 20 && m.value !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];

  if (!significant) return null;

  const direction = significant.change > 0 ? "up" : "down";
  const absChange = Math.abs(Math.round(significant.change));

  // Only highlight if it's noteworthy
  if (absChange < 20) return null;

  return `${significant.label} is ${direction} ${absChange}% from last week.`;
}

/**
 * Format amount for natural speech (no decimals for round numbers)
 */
function formatAmountForSpeech(amount: number, currency: string): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString()} ${currency}`;
}

/**
 * Get overdue alert text if there are overdue invoices
 */
function getOverdueAlert(
  activity?: InsightActivity,
  currency?: string,
): string | null {
  if (!activity?.invoicesOverdue || activity.invoicesOverdue === 0) {
    return null;
  }

  const count = activity.invoicesOverdue;
  const invoiceWord = count === 1 ? "invoice" : "invoices";

  if (activity.overdueAmount && currency) {
    return `You have ${count} overdue ${invoiceWord} totaling ${formatAmountForSpeech(activity.overdueAmount, currency)} that need attention.`;
  }

  return `You have ${count} overdue ${invoiceWord} that need attention.`;
}

/**
 * Build an audio script for TTS
 *
 * Uses AI-generated audioScript if available (optimized for natural speech),
 * otherwise falls back to structured content assembly.
 *
 * The script is normalized for TTS pronunciation (currency codes → spoken words)
 */
export function buildAudioScript(
  content: InsightContent,
  periodLabel: string,
  metrics: InsightMetric[],
  activity?: InsightActivity,
  currency?: string,
): string {
  // Use AI-generated script if available (already optimized for speech)
  if (content.audioScript) {
    return normalizeForSpeech(content.audioScript);
  }

  // Fallback: assemble from content parts
  const parts: string[] = [];

  // Opening with period context
  parts.push(`Here's your update for ${periodLabel}.`);

  // Core content (matches visual summary + story)
  parts.push(content.summary);

  if (content.story) {
    parts.push(content.story);
  }

  // Alert callout (matches visual "Needs attention" section)
  const overdueAlert = getOverdueAlert(activity, currency);
  if (overdueAlert) {
    parts.push(overdueAlert);
  }

  // Metric highlight (reinforces Key Metrics section)
  const highlight = getMetricHighlight(metrics);
  if (highlight) {
    parts.push(highlight);
  }

  // Normalize for better TTS pronunciation
  return normalizeForSpeech(parts.join(" "));
}

/**
 * Estimate character count for cost estimation
 */
export function estimateScriptCharacters(script: string): number {
  return script.length;
}

/**
 * Build a teaser script for notifications
 */
export function buildTeaserScript(
  content: InsightContent,
  _periodLabel: string,
  _metrics: InsightMetric[],
): string {
  return content.title;
}
