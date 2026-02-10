import {
  BANNED_WORDS,
  CRITICAL_RUNWAY_BANNED_WORDS,
  extractFacts,
  formatNumberForSpeech,
  getHeadlineFact,
  getPrimaryAction,
  getProfitDescriptionSpoken,
  getRevenueDescriptionSpoken,
  getRunwayDescription,
  getToneGuidanceFromFacts,
  type InsightFacts,
} from "./shared-data";
/**
 * Audio script prompt - TTS-optimized spoken summary
 *
 * Uses shared data layer to ensure consistency with written prompts.
 * All prompts derive from the same InsightFacts.
 */
import type { InsightSlots } from "./slots";

/**
 * Build the audio script prompt using shared facts
 */
export function buildAudioPrompt(slots: InsightSlots): string {
  // Extract facts using shared data layer (same as summary/title)
  const facts = extractFacts(slots);

  // Build data section from shared facts
  const dataLines = buildDataSection(facts);

  const toneGuidance = getToneGuidanceFromFacts(facts);

  return `<role>
You are a professional financial analyst delivering a brief audio summary.
Write a script that will be read aloud by a text-to-speech system.
Be calm, clear, and trustworthy - like a knowledgeable advisor, not a cheerleader.
</role>

<data>
${dataLines.join("\n")}
</data>

<tone_guidance>
${toneGuidance}
</tone_guidance>

<rules>
1. TARGET: 20-30 seconds when spoken (~60-80 words)
2. TONE: Professional and measured. ${toneGuidance}
3. NUMBERS: Use natural phrasing - "about five thousand" not "5,039.55"
4. CURRENCY: Always say "${facts.currencyWord}" never abbreviations
5. OPENING: Start with the period name directly (e.g., "Week 4" or "January summary"). No greetings.
6. FACTUAL: State the key facts clearly. Avoid superlatives like "amazing", "fantastic", "incredible".
7. PERSONALIZE: Use customer names when mentioning payments or overdue invoices.
8. SENTENCES: Keep them clear and direct.
9. NO: bullet points, lists, headers, formatting, or exclamation marks
10. ACCURACY: Only mention data provided above. Don't invent numbers or imply growth when there isn't any.
11. CLOSING: End with a practical next step or forward-looking note.
12. AVOID: Thanking customers, celebrating, or being overly enthusiastic. Just report the facts.
13. SEMANTIC ACCURACY: Use profit/revenue descriptions EXACTLY as provided in the data tags:
    - "no revenue" = say exactly that, not "revenue is flat"
    - "no financial activity" = say that, not "quiet week" or "things slowed down"
    - "break-even" = zero profit, NOT growth or improvement
    - "loss decreased" = still in loss, NOT positive progress
14. ZERO VALUES: When profit shows "no financial activity" or "break-even", lead with that fact. Don't skip it or imply things are positive.
15. CRITICAL RUNWAY: If <runway_warning> shows 1-2 months, use URGENT language. Never say "comfortable", "stable", or "gives you time" for short runway.
16. CONSISTENCY: This audio will accompany a written summary. Match the same facts and framing - if the summary says "no profit this week", the audio must say the same.
</rules>

<banned_words>
${BANNED_WORDS.join(", ")}
${facts.runway.isCritical ? `\nCRITICAL RUNWAY - also avoid: ${CRITICAL_RUNWAY_BANNED_WORDS.join(", ")}` : ""}
</banned_words>

<examples>
Great week: "Week 4. Profit reached three hundred thirty-nine thousand kronor on three hundred forty thousand in revenue, your best week since October. That puts your margin at nearly one hundred percent with expenses staying minimal. Your fourteen month runway gives you flexibility. [Company] paid one hundred eighty thousand kronor this week. One invoice from [Company] is overdue at seven hundred fifty kronor, worth following up on."

Recovery: "Week 3. Profit recovered to forty-five thousand kronor after two slower weeks. Revenue came in at sixty thousand with expenses at fifteen thousand, putting your margin at seventy-five percent. Your nine month runway is holding steady. You have a twenty thousand kronor draft ready to send to [Company] that could boost next week's numbers."

Quiet week: "Week 2. Profit came in at twelve thousand kronor on fifteen thousand in revenue with expenses staying low. Margin is at eighty percent. Your six month runway gives you time to operate. No overdue invoices to chase this week, leaving you free to focus on new business development."

Forward-looking: "Week 5. Profit is at ninety-five thousand kronor with revenue at one hundred ten thousand. Margin is holding at eighty-six percent. Your fourteen month runway is comfortable. Three invoices totaling twenty-five thousand kronor are due next week, and you're on pace for four hundred fifty thousand this quarter."

No activity with critical runway: "Week 2. No revenue or profit this week, with runway at just one month until February tenth. Three invoices totaling twenty-three thousand kronor are overdue, with Whelma owing seven thousand five hundred. Collecting these payments is urgent to extend your runway."

Challenging week: "Week 3. No revenue landed this week. Your one month runway until March fifteenth means collecting the eight thousand kronor from [Company] should be your immediate priority."
</examples>

<task>
Write a professional spoken summary of this financial update.
Be factual and measured. Lead with the most significant information.
Do NOT include any formatting, just the spoken text.
</task>`;
}

/**
 * Build data section from shared facts
 */
function buildDataSection(facts: InsightFacts): string[] {
  const dataLines: string[] = [];

  // Period and context
  dataLines.push(`<period>${facts.periodLabel}</period>`);
  dataLines.push(`<mood>${facts.mood}</mood>`);
  dataLines.push(`<week_type>${facts.weekType}</week_type>`);

  // Headline fact - what leads the insight
  const headline = getHeadlineFact(facts);
  dataLines.push(`<headline>${headline}</headline>`);

  // Core financials - using shared descriptions for consistency
  dataLines.push(`<profit>${getProfitDescriptionSpoken(facts)}</profit>`);
  dataLines.push(`<revenue>${getRevenueDescriptionSpoken(facts)}</revenue>`);

  if (facts.expensesRaw > 0) {
    dataLines.push(
      `<expenses>${formatNumberForSpeech(facts.expensesRaw)} ${facts.currencyWord}</expenses>`,
    );
  }

  if (facts.marginPercent !== null && facts.marginPercent > 0) {
    dataLines.push(
      `<margin>${Math.round(facts.marginPercent)} percent</margin>`,
    );
  }

  // Historical context
  if (facts.isPersonalBest) {
    dataLines.push("<personal_best>true</personal_best>");
  }
  if (facts.historicalContext) {
    dataLines.push(
      `<historical_context>${facts.historicalContext}</historical_context>`,
    );
  }

  // Streak and momentum
  if (facts.streak) {
    dataLines.push(`<streak>${facts.streak.description}</streak>`);
  }

  // Recovery
  if (facts.isRecovery && facts.recoveryDescription) {
    dataLines.push(`<recovery>${facts.recoveryDescription}</recovery>`);
  }

  // Year over year
  if (facts.yoyRevenue) {
    dataLines.push(`<yoy_revenue>${facts.yoyRevenue}</yoy_revenue>`);
  }
  if (facts.yoyProfit) {
    dataLines.push(`<yoy_profit>${facts.yoyProfit}</yoy_profit>`);
  }

  // Quarter pace
  if (facts.quarterPace) {
    dataLines.push(`<quarter_pace>${facts.quarterPace}</quarter_pace>`);
  }

  // Changes - using shared semantic descriptions
  if (facts.profitChange) {
    dataLines.push(`<profit_change>${facts.profitChange}</profit_change>`);
  }
  if (facts.revenueChange && facts.revenueStatus.type === "revenue") {
    dataLines.push(`<revenue_change>${facts.revenueChange}</revenue_change>`);
  }

  // Largest payment
  if (facts.largestPayment) {
    dataLines.push(
      `<largest_payment>${facts.largestPayment.customer} paid ${formatNumberForSpeech(facts.largestPayment.rawAmount)} ${facts.currencyWord}</largest_payment>`,
    );
  }

  // Overdue invoices
  if (facts.overdue.hasOverdue) {
    dataLines.push(
      `<overdue>${facts.overdue.count} overdue invoice${facts.overdue.count !== 1 ? "s" : ""} totaling ${formatNumberForSpeech(facts.overdue.totalRaw)} ${facts.currencyWord}</overdue>`,
    );
    if (facts.overdue.largest) {
      dataLines.push(
        `<largest_overdue>${facts.overdue.largest.company} owes ${formatNumberForSpeech(facts.overdue.largest.rawAmount)} ${facts.currencyWord}</largest_overdue>`,
      );
    }
  }

  // Runway - with urgency context
  const runwayDesc = getRunwayDescription(facts);
  if (facts.runway.isCritical || facts.runway.isLow) {
    dataLines.push(
      `<runway_warning>${runwayDesc}${facts.runway.isCritical ? " — URGENT" : ""}</runway_warning>`,
    );
  } else {
    dataLines.push(`<runway>${runwayDesc}</runway>`);
  }

  // Primary action (same as summary/story)
  const primaryAction = getPrimaryAction(facts);
  if (primaryAction) {
    dataLines.push(
      `<primary_action>${primaryAction.description}</primary_action>`,
    );
  }

  // Alerts (high priority warnings)
  if (facts.hasAlerts && facts.alerts.length > 0) {
    dataLines.push(`<alerts>${facts.alerts.join("; ")}</alerts>`);
  }

  return dataLines;
}
