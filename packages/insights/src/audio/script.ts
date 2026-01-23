import { formatMetricValue } from "../metrics/calculator";
/**
 * Audio script builder for insights
 * Creates natural-sounding scripts with Eleven v3 audio tags
 *
 * "What Matters Now" format - action-first, specific, conversational
 */
import type { InsightActivity, InsightContent, InsightMetric } from "../types";

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
 * Infer sentiment from content metrics and profit
 */
function inferSentiment(
  metrics: InsightMetric[],
): "positive" | "neutral" | "challenging" {
  const profitMetric = metrics.find((m) => m.type === "net_profit");
  if (profitMetric) {
    if (profitMetric.value > 0 && profitMetric.changeDirection === "up") {
      return "positive";
    }
    if (profitMetric.value < 0) {
      return "challenging";
    }
  }
  return "neutral";
}

/**
 * Get the appropriate tone tag based on sentiment
 */
function getOpenerTone(
  sentiment: "positive" | "neutral" | "challenging",
): string {
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
 * "What Matters Now" format:
 * 1. Quick greeting
 * 2. The main thing (money on table or highlight)
 * 3. Brief context
 * 4. One priority action
 * 5. Celebration if earned
 *
 * @param content - The AI-generated insight content
 * @param periodLabel - Human-readable period label (e.g., "Week 2, 2026")
 * @param metrics - Selected key metrics to highlight
 * @param currency - Currency code for formatting
 * @param activity - Optional activity data for richer context
 * @returns Script string with embedded audio tags
 */
export function buildAudioScript(
  content: InsightContent,
  periodLabel: string,
  metrics: InsightMetric[],
  currency: string,
  activity?: InsightActivity,
): string {
  const parts: string[] = [];
  const sentiment = inferSentiment(metrics);
  const openerTone = getOpenerTone(sentiment);

  // Quick greeting
  parts.push(`[warmly] Here's your ${periodLabel} update. [pause]`);

  // The main thing - use title as the hook
  parts.push(`${openerTone} ${content.title}`);

  // Story section - the context (keep it brief)
  if (content.story) {
    parts.push(`[pause] [warmly] ${content.story}`);
  }

  // Money on table highlight if significant
  const moneyOnTable = activity?.moneyOnTable;
  if (moneyOnTable && moneyOnTable.totalAmount > 500) {
    // Highlight top overdue invoice by name
    if (moneyOnTable.overdueInvoices.length > 0) {
      const top = moneyOnTable.overdueInvoices[0];
      if (top) {
        const topAmount = formatMetricValue(top.amount, "currency", currency);
        parts.push(
          `[pause] [clearly] Quick note: ${top.customerName} owes you ${topAmount}, now ${top.daysOverdue} days overdue.`,
        );
      }
    }
  }

  // One priority action (if any)
  if (content.actions.length > 0) {
    const primaryAction = content.actions[0];
    if (primaryAction) {
      parts.push(
        `[pause] [clearly] Your priority this week: ${primaryAction.text}`,
      );
    }
  }

  // Brief sign off
  const signOff = getSignOff(periodLabel, sentiment);
  parts.push(`[pause] [warmly] ${signOff}`);

  return parts.join("\n\n");
}

/**
 * Generate a contextual sign-off based on the period and sentiment
 */
function getSignOff(
  periodLabel: string,
  sentiment?: "positive" | "neutral" | "challenging",
): string {
  const lowerLabel = periodLabel.toLowerCase();
  const isWeekly = lowerLabel.includes("week");

  // Shorter, more conversational sign-offs
  if (sentiment === "positive") {
    return isWeekly ? "Keep up the momentum!" : "You're on a good track.";
  }

  if (sentiment === "challenging") {
    return isWeekly
      ? "You've got this. One step at a time."
      : "Focus on that priority and you'll be fine.";
  }

  // Neutral / default
  if (isWeekly) {
    return "That's your week. You're in good shape.";
  }

  if (lowerLabel.includes("q1") || lowerLabel.includes("quarter 1")) {
    return "Strong start to the year.";
  }
  if (lowerLabel.includes("q2") || lowerLabel.includes("quarter 2")) {
    return "Halfway there. Keep going.";
  }
  if (lowerLabel.includes("q3") || lowerLabel.includes("quarter 3")) {
    return "Home stretch is coming up.";
  }
  if (lowerLabel.includes("q4") || lowerLabel.includes("quarter 4")) {
    return "Let's finish strong.";
  }

  return "That's your update. You're doing fine.";
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
  metrics: InsightMetric[],
): string {
  const sentiment = inferSentiment(metrics);
  const openerTone = getOpenerTone(sentiment);

  // Super short - just the hook and call to action
  const hasAction = content.actions.length > 0;
  const actionHint = hasAction
    ? "Tap to see your priority for the week."
    : "Tap to see the details.";

  return `[warmly] Your ${periodLabel} update is ready. [pause] ${openerTone} ${content.title} [pause] [warmly] ${actionHint}`;
}
