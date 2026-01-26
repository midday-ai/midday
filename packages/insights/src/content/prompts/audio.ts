import type { InsightSlots } from "./slots";

/**
 * Format a number for natural speech
 * Examples: 5644.42 → "about fifty-six hundred", 22500 → "twenty-two thousand five hundred"
 */
function formatNumberForSpeech(value: number): string {
  const rounded = Math.round(value);

  // For amounts under 1000, just say the number
  if (rounded < 1000) {
    return rounded.toString();
  }

  // For amounts 1000-9999, use "thousand" phrasing
  if (rounded < 10000) {
    const thousands = Math.floor(rounded / 1000);
    const hundreds = Math.round((rounded % 1000) / 100) * 100;
    if (hundreds > 0) {
      return `${thousands} thousand ${hundreds}`;
    }
    return `${thousands} thousand`;
  }

  // For larger amounts, simplify
  if (rounded < 100000) {
    const thousands = Math.round(rounded / 1000);
    return `${thousands} thousand`;
  }

  // Very large amounts
  if (rounded < 1000000) {
    const hundreds = Math.round(rounded / 1000);
    return `${hundreds} thousand`;
  }

  const millions = (rounded / 1000000).toFixed(1);
  return `${millions} million`;
}

/**
 * Get currency as spoken word
 */
function getCurrencyWord(currency: string): string {
  const currencyMap: Record<string, string> = {
    SEK: "kronor",
    NOK: "kroner",
    DKK: "kroner",
    USD: "dollars",
    EUR: "euros",
    GBP: "pounds",
    CHF: "francs",
    JPY: "yen",
  };
  return currencyMap[currency] || currency.toLowerCase();
}

/**
 * Determine the emotional tone based on the week's performance
 * WeekType: "great" | "good" | "quiet" | "challenging"
 */
function getWeekMood(
  slots: InsightSlots,
): "celebratory" | "positive" | "neutral" | "supportive" {
  if (slots.isPersonalBest || slots.weekType === "great") return "celebratory";
  if (
    slots.isRecovery ||
    slots.profitChange > 20 ||
    slots.weekType === "good"
  ) {
    return "positive";
  }
  if (slots.weekType === "quiet" || slots.weekType === "challenging") {
    return "supportive";
  }
  return "neutral";
}

/**
 * Build the audio script prompt
 */
export function buildAudioPrompt(slots: InsightSlots): string {
  const currencyWord = getCurrencyWord(slots.currency);
  const mood = getWeekMood(slots);

  // Build data context for the AI
  const dataLines: string[] = [];

  // Period and mood context
  dataLines.push(`<period>${slots.periodLabel}</period>`);
  dataLines.push(`<mood>${mood}</mood>`);

  // Week type classification (great | good | quiet | challenging)
  dataLines.push(`<week_type>${slots.weekType}</week_type>`);

  // Core metrics (using raw values for comparison)
  if (slots.revenueRaw > 0) {
    dataLines.push(
      `<revenue>${formatNumberForSpeech(slots.revenueRaw)} ${currencyWord}</revenue>`,
    );
  }
  if (slots.profitRaw !== 0) {
    dataLines.push(
      `<profit>${formatNumberForSpeech(Math.abs(slots.profitRaw))} ${currencyWord}${slots.profitRaw < 0 ? " loss" : ""}</profit>`,
    );
  }
  if (slots.expensesRaw > 0) {
    dataLines.push(
      `<expenses>${formatNumberForSpeech(slots.expensesRaw)} ${currencyWord}</expenses>`,
    );
  }
  if (slots.marginRaw > 0) {
    dataLines.push(`<margin>${Math.round(slots.marginRaw)} percent</margin>`);
  }

  // Historical context - this is the wow factor
  if (slots.isPersonalBest) {
    dataLines.push("<personal_best>true</personal_best>");
  }
  if (slots.historicalContext) {
    dataLines.push(
      `<historical_context>${slots.historicalContext}</historical_context>`,
    );
  }
  if (slots.vsAverage) {
    dataLines.push(`<vs_average>${slots.vsAverage}</vs_average>`);
  }

  // Streak and momentum
  if (slots.streak) {
    dataLines.push(`<streak>${slots.streak.description}</streak>`);
  }
  if (slots.momentum && slots.momentum !== "steady") {
    dataLines.push(`<momentum>${slots.momentum}</momentum>`);
  }

  // Recovery story
  if (slots.isRecovery && slots.recoveryDescription) {
    dataLines.push(`<recovery>${slots.recoveryDescription}</recovery>`);
  }

  // Year over year comparisons
  if (slots.yoyRevenue) {
    dataLines.push(`<yoy_revenue>${slots.yoyRevenue}</yoy_revenue>`);
  }
  if (slots.yoyProfit) {
    dataLines.push(`<yoy_profit>${slots.yoyProfit}</yoy_profit>`);
  }

  // Quarter pace projection
  if (slots.quarterPace) {
    dataLines.push(`<quarter_pace>${slots.quarterPace}</quarter_pace>`);
  }

  // Significant changes
  if (Math.abs(slots.profitChange) >= 15) {
    const direction = slots.profitChange > 0 ? "up" : "down";
    dataLines.push(
      `<change>profit is ${direction} ${Math.abs(Math.round(slots.profitChange))} percent</change>`,
    );
  }
  if (Math.abs(slots.revenueChange) >= 15) {
    const direction = slots.revenueChange > 0 ? "up" : "down";
    dataLines.push(
      `<change>revenue is ${direction} ${Math.abs(Math.round(slots.revenueChange))} percent</change>`,
    );
  }

  // Largest payment (personalization)
  if (slots.largestPayment) {
    const amountNum = Number.parseFloat(
      slots.largestPayment.amount.replace(/[^0-9.-]/g, ""),
    );
    dataLines.push(
      `<largest_payment>${slots.largestPayment.customer} paid ${formatNumberForSpeech(amountNum)} ${currencyWord}</largest_payment>`,
    );
  }

  // Overdue invoices
  if (slots.overdue.length > 0) {
    const total = slots.overdue.reduce((sum, inv) => sum + inv.rawAmount, 0);
    dataLines.push(
      `<overdue>${slots.overdue.length} overdue invoices totaling ${formatNumberForSpeech(total)} ${currencyWord}</overdue>`,
    );
    if (slots.largestOverdue) {
      dataLines.push(
        `<largest_overdue>${slots.largestOverdue.company} owes ${formatNumberForSpeech(slots.largestOverdue.rawAmount)} ${currencyWord}</largest_overdue>`,
      );
    }
  }

  // Runway warning
  if (slots.runway && slots.runway <= 3) {
    dataLines.push(
      `<runway_warning>${slots.runway} months of runway${slots.runwayExhaustionDate ? ` until ${slots.runwayExhaustionDate}` : ""}</runway_warning>`,
    );
  }

  // Next week preview (forward-looking hook)
  if (slots.nextWeekInvoicesDue && slots.nextWeekInvoicesDue.count > 0) {
    dataLines.push(
      `<next_week>${slots.nextWeekInvoicesDue.count} invoices due next week worth ${slots.nextWeekInvoicesDue.amount}</next_week>`,
    );
  }

  // Highlight (fallback for anything special)
  if (
    slots.highlight.type !== "none" &&
    slots.highlight.type !== "big_payment"
  ) {
    if ("description" in slots.highlight) {
      dataLines.push(`<highlight>${slots.highlight.description}</highlight>`);
    }
  }

  const toneGuidance =
    mood === "celebratory"
      ? "Sound confident and pleased, but understated. Let the numbers speak for themselves."
      : mood === "positive"
        ? "Sound calm and assured. Acknowledge progress without overstating."
        : mood === "supportive"
          ? "Sound steady and pragmatic. Focus on actionable next steps."
          : "Sound clear and informative.";

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
4. CURRENCY: Always say "${currencyWord}" never abbreviations
5. OPENING: Start with the period name directly (e.g., "Week 4" or "January summary"). No greetings.
6. FACTUAL: State the key facts clearly. Avoid superlatives like "amazing", "fantastic", "incredible".
7. PERSONALIZE: Use customer names when mentioning payments or overdue invoices.
8. SENTENCES: Keep them clear and direct.
9. NO: bullet points, lists, headers, formatting, or exclamation marks
10. ACCURACY: Only mention data provided above. Don't invent numbers.
11. CLOSING: End with a practical next step or forward-looking note.
12. AVOID: Thanking customers, celebrating, or being overly enthusiastic. Just report the facts.
</rules>

<examples>
Strong week: "Week 4. Profit reached fifty-six hundred kronor, your highest this year. Margin is at seventy-five percent. PES Sälj paid their invoice, contributing to the result. Three invoices remain overdue."

Recovery: "Week 3. Profit recovered to four thousand kronor after two slower weeks. Revenue is up thirty percent. Three invoices are overdue totaling twenty-two thousand, with Whelma being the largest at seventy-five hundred."

Quiet week: "Week 2. Profit came in at two thousand kronor with higher than usual expenses. Three invoices are overdue totaling twenty-two thousand kronor. Following up with Whelma would address the largest outstanding amount."

Forward-looking: "Week 5. Profit is at eight thousand kronor with healthy margins. Three invoices totaling fifteen thousand kronor are due next week."
</examples>

<task>
Write a professional spoken summary of this financial update.
Be factual and measured. Lead with the most significant information.
Do NOT include any formatting, just the spoken text.
</task>`;
}
