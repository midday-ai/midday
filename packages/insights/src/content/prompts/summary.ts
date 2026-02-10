/**
 * Summary prompt - narrative financial picture
 *
 * Uses Anthropic best practices:
 * - XML tags for structure
 * - Clear role assignment
 * - Few-shot examples with input/output
 * - Direct, specific instructions
 *
 * Uses shared data layer for consistency with audio prompt.
 */
import {
  BANNED_WORDS,
  CRITICAL_RUNWAY_BANNED_WORDS,
  extractFacts,
  getHeadlineFact,
  getProfitDescription,
  getRevenueDescription,
  getRunwayDescription,
} from "./shared-data";
import { getNotableContext, getToneGuidance, type InsightSlots } from "./slots";

/**
 * Build the summary generation prompt
 */
export function buildSummaryPrompt(slots: InsightSlots): string {
  const { isFirstInsight, weekType } = slots;
  const tone = getToneGuidance(weekType);

  const role = `<role>
You write the summary paragraph for a weekly business insight.
This follows the headline and gives the full financial picture in flowing prose.
Sound like a knowledgeable colleague giving a verbal debrief — not a report generator.
</role>

<voice>
${tone}
</voice>`;

  const data = buildDataSection(slots);

  const rules = isFirstInsight
    ? `<banned_words>
${BANNED_WORDS.join(", ")}
WHY: These are filler words. Plain language sounds more genuine.
</banned_words>

<constraints>
This is their FIRST insight: Welcome them briefly — this sets the tone for the relationship.

Word count: EXACTLY 40-60 words. Count before submitting.
WHY: Under 40 feels incomplete. Over 60 is too long.

Include profit, revenue, margin, runway: Woven together naturally.
WHY: First impressions matter. Show them you understand their core metrics.

Connect with flow words: "with", "while", "and your", "giving you".
WHY: Prose, not bullet points.

Never say "this period": Sounds robotic.
WHY: Real people don't talk like reports.

Match currency format exactly: Copy from data.
WHY: Consistency from day one.
</constraints>

<accuracy>
- All figures must match exactly
- If profit is negative, expenses MUST be mentioned
- Profit of 0 is "no activity", NOT a loss
- ACTIVITY METRICS: For invoices sent, hours tracked — use the description from data, NOT "down 100%"
</accuracy>`
    : `<banned_words>
${BANNED_WORDS.join(", ")}
WHY: These are filler words. Plain language sounds more genuine and trustworthy.
</banned_words>

<constraints>
Word count: EXACTLY 40-60 words. Count before submitting.
WHY: Under 40 feels incomplete. Over 60 becomes a wall of text they won't read.

Include profit, revenue, margin, runway: All four metrics, woven together naturally.
WHY: These are the core health indicators. Listing them separately feels like a spreadsheet.

Connect facts with flow words: Use "with", "while", "and your", "giving you".
WHY: Connected prose reads naturally. Bullet-point style feels robotic.

Never say "this period": Say "this week" or nothing.
WHY: "This period" is report-speak. Real people say "this week."

Match currency format exactly: Copy from data (e.g., "117,061 kr").
WHY: Consistency builds trust.

Mention outstanding receivables at the end: If any exist.
WHY: Ends with an actionable item they can address.

Include runway exhaustion date when provided: If data shows "cash lasts until [DATE]", include it.
WHY: Specific dates create urgency and help planning. "1 month" is vague; "until February 10" is actionable.
</constraints>

<accuracy>
- All figures must match the data exactly
- If profit is negative, expenses MUST be mentioned
- Profit of 0 is "no activity" or "break-even", NOT a loss
- CRITICAL: If profit is NEGATIVE, never say it "improved", "doubled", or "grew" even if the loss decreased
  - Say "loss decreased" or "loss shrank" instead
  - A smaller loss is NOT the same as profit growth
- If revenue is 0, margin is meaningless - don't emphasize margin changes
- When comparing weeks: -7k is better than -189k, but both are losses - frame accordingly
- ACTIVITY METRICS: For invoices sent, hours tracked, etc. — use the description from data
  - If "no activity" or "no new invoices" — say that, NOT "down 100%"
  - "Down 100%" sounds alarming for normal activity variations
- CRITICAL RUNWAY RULE: If runway is under 2 months, NEVER use reassuring language like:
  - "reassuring", "comfortable", "steady", "stable", "flexibility", "buffer", "cushion"
  - Instead emphasize URGENCY: "only X months", "cash is tight", "collecting overdue is urgent"
  - A 1-month runway is an EMERGENCY, not stability — frame it accordingly
</accuracy>`;

  const examples = isFirstInsight
    ? buildFirstInsightExamples(slots)
    : buildExamples(slots);

  return `${role}

<data>
${data}
</data>

${rules}

${examples}

<verify>
Before responding, silently verify (DO NOT include this in your response):
- Word count between 40-60? Rewrite if not.
- Flows naturally when read aloud?
- Facts connected, not listed?
- "This period" avoided?
- Amounts match data format?
</verify>

<output>
Write ONE summary (40-60 words). Begin directly — no preamble, no word count, no meta-commentary.
ONLY output the summary text itself.
</output>`;
}

function buildDataSection(slots: InsightSlots): string {
  const lines: string[] = [];

  // Extract shared facts for consistency with audio prompt
  const facts = extractFacts(slots);

  // CRITICAL: Low runway warning at the very top - overrides tone
  if (facts.runway.isCritical) {
    lines.push("CRITICAL RUNWAY WARNING");
    lines.push(`${getRunwayDescription(facts)}`);
    lines.push(
      `NEVER use words like: ${CRITICAL_RUNWAY_BANNED_WORDS.join(", ")}`,
    );
    lines.push(
      "MUST frame as: urgent, priority, tight, limited time, needs immediate attention",
    );
    lines.push("");
  } else if (facts.runway.isLow) {
    lines.push("LOW RUNWAY WARNING");
    lines.push(
      `Runway is ${facts.runway.months} months — avoid overly reassuring language.`,
    );
    lines.push("");
  }

  // Currency context - tell AI to match the format shown in data values
  lines.push(
    `currency: ${slots.currency} (use same format as amounts below, e.g., "${slots.profit}")`,
  );
  lines.push("");

  // Headline fact - same as audio will use
  const headline = getHeadlineFact(facts);
  lines.push(`headline: ${headline}`);
  lines.push("");

  // Explicit warnings (pre-computed by backend) - prioritize alerts
  if (facts.hasAlerts || facts.hasWarnings) {
    if (facts.alerts.length > 0) {
      lines.push("ALERTS (mention these):");
      for (const alert of facts.alerts) {
        lines.push(`  - ${alert}`);
      }
      lines.push("");
    }

    if (facts.warnings.length > 0) {
      lines.push("warnings (weave in naturally if relevant):");
      for (const warning of facts.warnings) {
        lines.push(`  - ${warning}`);
      }
      lines.push("");
    }
  }

  // Notable context (already computed, surface for variety)
  // Only include for non-first insights (first insight has no comparison data)
  if (!slots.isFirstInsight) {
    const notable = getNotableContext(slots);
    if (notable) {
      lines.push(`notable: ${notable}`);
      lines.push("");
    }
  }

  // Core financials - using shared descriptions for consistency with audio
  lines.push(`profit: ${getProfitDescription(facts)} (${slots.profit})`);
  lines.push(`revenue: ${getRevenueDescription(facts)} (${slots.revenue})`);
  lines.push(`expenses: ${slots.expenses}`);
  lines.push(`margin: ${slots.margin}%`);

  // Activity changes (use these descriptions, don't calculate percentages)
  if (slots.invoicesSentChange) {
    lines.push(`invoices sent: ${slots.invoicesSentChange}`);
  } else if (slots.invoicesSent === 0) {
    lines.push("invoices sent: no new invoices this week");
  }
  if (slots.runwayExhaustionDate) {
    lines.push(
      `runway: ${slots.runway} months (cash lasts until ${slots.runwayExhaustionDate})`,
    );
  } else {
    lines.push(`runway: ${slots.runway} months`);
  }

  // Cash flow with explanation if it differs from profit
  if (slots.cashFlowExplanation) {
    lines.push(`cash flow: ${slots.cashFlow} (${slots.cashFlowExplanation})`);
  }

  // Overdue (with payment behavior anomaly flags)
  if (slots.hasOverdue) {
    lines.push("");
    lines.push("overdue:");
    for (const inv of slots.overdue) {
      if (inv.isUnusual && inv.unusualReason) {
        // Flag unusual payment behavior - this customer typically pays faster
        lines.push(
          `  - ${inv.company}: ${inv.amount} (${inv.daysOverdue} days) ⚠️ UNUSUAL - ${inv.unusualReason}`,
        );
      } else {
        lines.push(
          `  - ${inv.company}: ${inv.amount} (${inv.daysOverdue} days)`,
        );
      }
    }
  }

  // Skip "vs last week" for first insight
  if (!slots.isFirstInsight && slots.profitChange !== 0) {
    lines.push("");
    lines.push(`change: ${slots.profitChangeDescription}`);
  }

  // Year-over-year comparison (if available)
  if (slots.yoyRevenue || slots.yoyProfit) {
    lines.push("");
    lines.push("vs last year:");
    if (slots.yoyRevenue) lines.push(`  revenue: ${slots.yoyRevenue}`);
    if (slots.yoyProfit) lines.push(`  profit: ${slots.yoyProfit}`);
  }

  // Quarter pace projection (if available)
  if (slots.quarterPace) {
    lines.push("");
    lines.push(`quarter projection: ${slots.quarterPace}`);
  }

  return lines.join("\n");
}

function buildExamples(slots: InsightSlots): string {
  // Examples showing natural, flowing language that connects facts
  const examples: Record<string, { input: string; output: string }> = {
    // When there's a milestone/personal best
    milestone: {
      input:
        "notable: Best profit week since October\n\nprofit: 117,061 kr, revenue: 120,200 kr, expenses: 3,139 kr, margin: 97.4%, runway: 8 months, overdue: [Company] 24,300 kr",
      output:
        "Your best profit week since October — 117,061 kr on 120,200 kr revenue with margin holding at 97%. Expenses stayed minimal, and your 8-month runway gives you flexibility. [Company] still owes 24,300 kr worth chasing.",
    },
    // When there's a streak
    streak: {
      input:
        "notable: 3 consecutive profitable weeks\n\nprofit: 117,061 kr, revenue: 120,200 kr, expenses: 3,139 kr, margin: 97.4%, runway: 8 months",
      output:
        "Third straight profitable week — 117,061 kr profit at 97% margin, continuing the momentum. Revenue came in at 120,200 kr with minimal expenses, and your 8-month runway keeps things comfortable.",
    },
    // When there's a recovery
    recovery: {
      input:
        "notable: Recovery after 2 down weeks\n\nprofit: 85,000 kr, revenue: 90,000 kr, expenses: 5,000 kr, margin: 94.4%, runway: 6 months, overdue: [Company] 12,000 kr",
      output:
        "Back in the black after two tough weeks — 85,000 kr profit on 90,000 kr revenue. Margin recovered to 94%, and your 6-month runway held steady. [Company] still owes 12,000 kr from before.",
    },
    // Standard (no notable context)
    standard: {
      input:
        "profit: 75,000 kr, revenue: 80,000 kr, expenses: 5,000 kr, margin: 93.8%, runway: 10 months, overdue: [Company] 8,000 kr",
      output:
        "Good week with 75,000 kr profit on 80,000 kr revenue — margin at 94% with low expenses. Your 10-month runway gives you room to operate. [Company] owes 8,000 kr that's worth following up on.",
    },
    // Challenging week - IMPORTANT: if profit is negative, expenses MUST be mentioned
    challenging: {
      input:
        "profit: -22,266 kr, revenue: 0 kr, expenses: 22,266 kr, runway: 2 months (cash lasts until March 15, 2026), overdue: [Company] 750 kr",
      output:
        "No revenue landed this week, with 22,266 kr in expenses creating a gap. Your cash lasts until March 15, so collecting the 750 kr from [Company] and landing new work should be top priority.",
    },
    // Zero activity week (all values are 0) - NOT a loss, just no activity
    // When runway is short, include the specific exhaustion date
    zero_activity: {
      input:
        "profit: 0 kr, revenue: 0 kr, expenses: 0 kr, margin: 0%, runway: 1 months (cash lasts until February 10, 2026), overdue: [Company] 5,000 kr",
      output:
        "No financial activity this week. With cash lasting until February 10, collecting the 5,000 kr overdue from [Company] should be a priority to extend your runway.",
    },
    // LOW RUNWAY with positive profit - CRITICAL: don't be reassuring!
    // This is the tricky case where good metrics might make AI sound too positive
    low_runway_profitable: {
      input:
        "CRITICAL RUNWAY WARNING\nRunway is only 1 months (until February 24, 2026).\n\nprofit: 5,644 kr, revenue: 7,500 kr, expenses: 1,856 kr, margin: 75.3%, runway: 1 months (cash lasts until February 24, 2026), overdue: [Company A] 7,500 kr, [Company B] 7,500 kr, [Company C] 7,500 kr",
      output:
        "Profit reached 5,644 kr on 7,500 kr revenue with a 75% margin, but with only 1 month of runway until February 24, cash is tight. The 22,500 kr overdue from three clients needs urgent attention to extend your runway.",
    },
  };

  // Select appropriate example based on context
  let exampleKey: string;
  const isZeroActivity =
    slots.profitRaw === 0 && slots.revenueRaw === 0 && slots.expensesRaw === 0;
  const isLowRunwayProfitable = slots.runway < 2 && slots.profitRaw > 0;

  // LOW RUNWAY takes priority over other classifications when profitable
  // This ensures we don't show celebratory examples for critical situations
  if (isLowRunwayProfitable) {
    exampleKey = "low_runway_profitable";
  } else if (isZeroActivity) {
    exampleKey = "zero_activity";
  } else if (slots.isPersonalBest && slots.historicalContext) {
    exampleKey = "milestone";
  } else if (slots.isRecovery && slots.recoveryDescription) {
    exampleKey = "recovery";
  } else if (slots.streak && slots.streak.count >= 3) {
    exampleKey = "streak";
  } else if (slots.weekType === "challenging") {
    exampleKey = "challenging";
  } else {
    exampleKey = "standard";
  }

  const example = examples[exampleKey]!;

  // Concrete example showing exact natural, flowing format
  const concreteExample = {
    input:
      "currency: SEK\n\nnotable: 3 consecutive profitable weeks\n\nprofit: 117,061 kr, revenue: 120,200 kr, expenses: 3,139 kr, margin: 97.4%, runway: 8 months, overdue: [Company] 24,300 kr",
    output:
      "Third straight profitable week — 117,061 kr on 120,200 kr revenue with margin holding at 97%. Expenses stayed minimal at 3,139 kr, and your 8-month runway keeps things comfortable. [Company] owes 24,300 kr worth chasing.",
  };

  return `<examples>
<concrete_example>
<input>${concreteExample.input}</input>
<output>${concreteExample.output}</output>
</concrete_example>
<pattern_example>
<input>${example.input}</input>
<output>${example.output}</output>
</pattern_example>
</examples>`;
}

function buildFirstInsightExamples(slots: InsightSlots): string {
  const { weekType } = slots;

  const examples: Record<string, { input: string; output: string }> = {
    great: {
      input:
        "profit: 260,340 kr, revenue: 268,000 kr, expenses: 7,660 kr, margin: 97%, runway: 14 months, overdue: [Company] 750 kr",
      output:
        "Welcome to your weekly insights. This week brought 260,340 kr profit on 268,000 kr revenue — a 97% margin with minimal expenses. Your 14-month runway gives you plenty of flexibility. One thing to chase: 750 kr overdue from [Company].",
    },
    good: {
      input:
        "profit: 85,000 kr, revenue: 95,000 kr, expenses: 10,000 kr, margin: 89%, runway: 8 months, overdue: [Company] 5,000 kr",
      output:
        "Welcome to your weekly insights. You're starting with 85,000 kr profit on 95,000 kr revenue — 89% margin after 10,000 kr in expenses. Your 8-month runway is comfortable. [Company] owes 5,000 kr worth following up on.",
    },
    quiet: {
      input:
        "profit: 12,000 kr, revenue: 15,000 kr, expenses: 3,000 kr, margin: 80%, runway: 6 months",
      output:
        "Welcome to your weekly insights. Quieter start with 12,000 kr profit on 15,000 kr revenue — 80% margin with low expenses. Your 6-month runway gives you time. No overdue invoices to worry about.",
    },
    challenging: {
      input:
        "profit: -15,000 kr, revenue: 0 kr, expenses: 15,000 kr, runway: 10 months, overdue: [Company] 8,000 kr",
      output:
        "Welcome to your weekly insights. No revenue this week with 15,000 kr in expenses — often just payment timing when invoices cross weeks. Your 10-month runway means no rush. [Company] owes 8,000 kr that's worth collecting.",
    },
    zero_activity: {
      input:
        "profit: 0 kr, revenue: 0 kr, expenses: 0 kr, runway: 1 months (cash lasts until February 10, 2026), overdue: [Company] 3,000 kr",
      output:
        "Welcome to your weekly insights. No financial activity recorded this week. With cash lasting until February 10, collecting the 3,000 kr from [Company] should be a priority.",
    },
  };

  const isZeroActivity =
    slots.profitRaw === 0 && slots.revenueRaw === 0 && slots.expensesRaw === 0;
  const example = isZeroActivity
    ? examples.zero_activity
    : (examples[weekType] ?? examples.good);

  // Concrete example for first insights
  const concreteExample = {
    input:
      "currency: SEK\n\nprofit: 260,340 kr, revenue: 268,000 kr, expenses: 7,660 kr, margin: 97%, runway: 14 months, overdue: [Company] 750 kr",
    output:
      "Welcome to your weekly insights. This week brought 260,340 kr profit on 268,000 kr revenue — a 97% margin with minimal expenses. Your 14-month runway gives you plenty of flexibility. One thing to chase: 750 kr overdue from [Company].",
  };

  return `<examples>
<concrete_example>
<input>${concreteExample.input}</input>
<output>${concreteExample.output}</output>
</concrete_example>
<pattern_example>
<input>${example!.input}</input>
<output>${example!.output}</output>
</pattern_example>
</examples>`;
}
