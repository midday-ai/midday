import { formatMetricValue } from "../metrics/calculator";
/**
 * Audio script builder for insights
 * Creates natural-sounding scripts with Eleven v3 audio tags
 */
import type { InsightContent, InsightMetric, InsightSentiment } from "../types";

/**
 * Eleven v3 Audio Tags Reference:
 * - [warmly] - Friendly, approachable tone
 * - [upbeat] - Energetic, positive delivery
 * - [clearly] - Precise, professional enunciation
 * - [pause] - Natural pauses for emphasis
 * - [excited] - For celebrations and achievements
 * - [thoughtfully] - Reflective, considered tone
 * - [gently] - Soft, supportive tone for challenging news
 */

/**
 * Get the appropriate tone tag based on sentiment
 */
function getOpenerTone(sentiment: InsightSentiment): string {
  switch (sentiment) {
    case "positive":
      return "[upbeat]";
    case "neutral":
      return "[warmly]";
    case "challenging":
      return "[gently]";
  }
}

/**
 * Build an audio script from insight content
 * Uses Eleven v3 audio tags for expressive narration
 *
 * @param content - The AI-generated insight content
 * @param periodLabel - Human-readable period label (e.g., "Week 2, 2026")
 * @param metrics - Selected key metrics to highlight
 * @param currency - Currency code for formatting
 * @returns Script string with embedded audio tags
 */
export function buildAudioScript(
  content: InsightContent,
  periodLabel: string,
  metrics: InsightMetric[],
  currency: string,
): string {
  const parts: string[] = [];

  // Opening with warm greeting
  parts.push(`[warmly] Here's your ${periodLabel} business insight. [pause]`);

  // Opener with sentiment-appropriate tone
  const openerTone = getOpenerTone(content.sentiment);
  parts.push(`${openerTone} ${content.opener}`);

  // Key metrics summary (clear, professional delivery)
  if (metrics.length > 0) {
    const topMetrics = metrics.slice(0, 3);
    const metricsText = topMetrics
      .map(
        (m) =>
          `${m.label}: ${formatMetricValue(m.value, m.unit ?? "number", currency)}`,
      )
      .join(". [pause] ");
    parts.push(`[pause] [clearly] Your key numbers: ${metricsText}.`);
  }

  // Story section (conversational, warm tone)
  parts.push(`[pause] [warmly] ${content.story}`);

  // Actions (clear, actionable tone)
  if (content.actions.length > 0) {
    const actionCount = Math.min(content.actions.length, 3);
    parts.push("[pause] [clearly] Here are your recommended actions:");
    content.actions.slice(0, actionCount).forEach((action, i) => {
      parts.push(`${i + 1}. ${action.text}`);
    });
  }

  // Celebration (excited tone for achievements)
  if (content.celebration) {
    parts.push(
      `[pause] [excited] And something to celebrate: ${content.celebration}`,
    );
  }

  // Sign off (warm, encouraging)
  const signOff = getSignOff(periodLabel);
  parts.push(`[pause] [warmly] ${signOff}`);

  return parts.join("\n\n");
}

/**
 * Generate a contextual sign-off based on the period
 */
function getSignOff(periodLabel: string): string {
  const lowerLabel = periodLabel.toLowerCase();

  if (lowerLabel.includes("week")) {
    return "That's your weekly insight. Have a great week ahead!";
  }
  if (lowerLabel.includes("q1") || lowerLabel.includes("quarter 1")) {
    return "That's your first quarter insight. Here's to a strong year!";
  }
  if (lowerLabel.includes("q2") || lowerLabel.includes("quarter 2")) {
    return "That's your second quarter insight. Keep up the great work!";
  }
  if (lowerLabel.includes("q3") || lowerLabel.includes("quarter 3")) {
    return "That's your third quarter insight. The finish line is in sight!";
  }
  if (lowerLabel.includes("q4") || lowerLabel.includes("quarter 4")) {
    return "That's your fourth quarter insight. Let's finish strong!";
  }
  if (
    lowerLabel.includes("january") ||
    lowerLabel.includes("february") ||
    lowerLabel.includes("march")
  ) {
    return "That's your monthly insight. Here's to a great month ahead!";
  }
  if (lowerLabel.includes("december") || lowerLabel.includes("year")) {
    return "That's your insight. Here's to continued success!";
  }

  return "That's your insight for this period. Keep up the momentum!";
}

/**
 * Estimate the character count for cost estimation
 * ElevenLabs charges per character
 */
export function estimateScriptCharacters(script: string): number {
  // Remove audio tags for accurate character count (they're free)
  const withoutTags = script.replace(/\[[\w]+\]/g, "");
  return withoutTags.length;
}

/**
 * Build a shorter audio script for teaser/preview
 * Used in notifications or quick summaries
 */
export function buildTeaserScript(
  content: InsightContent,
  periodLabel: string,
): string {
  const openerTone = getOpenerTone(content.sentiment);
  return `[warmly] Here's your ${periodLabel} business insight. [pause] ${openerTone} ${content.opener} [pause] [warmly] Check your dashboard for the full details and recommended actions.`;
}
