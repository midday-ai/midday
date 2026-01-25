/**
 * Summary prompt - narrative financial picture
 *
 * Uses Anthropic best practices:
 * - XML tags for structure
 * - Clear role assignment
 * - Few-shot examples with input/output
 * - Direct, specific instructions
 */
import { type InsightSlots, getNotableContext, getToneGuidance } from "./slots";

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
solid, healthy, strong, great, robust, excellent, remarkable, impressive, amazing, outstanding, significant
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
</accuracy>`
    : `<banned_words>
solid, healthy, strong, great, robust, excellent, remarkable, impressive, amazing, outstanding, significant
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
</constraints>

<accuracy>
- All figures must match the data exactly
- If profit is negative, expenses MUST be mentioned
- Profit of 0 is "no activity" or "break-even", NOT a loss
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
Before responding, COUNT YOUR WORDS:
- Is word count between 40-60? (This is critical — rewrite if not)
- Does it flow naturally when read aloud?
- Are facts connected, not just listed?
- Is "this period" avoided?
- Do amounts match the data format exactly?
</verify>

<output>
Write ONE summary (40-60 words exactly). Begin directly — no preamble.
</output>`;
}

function buildDataSection(slots: InsightSlots): string {
  const lines: string[] = [];

  // Currency context - tell AI to match the format shown in data values
  lines.push(
    `currency: ${slots.currency} (use same format as amounts below, e.g., "${slots.profit}")`,
  );
  lines.push("");

  // Notable context (already computed, surface for variety)
  // Only include for non-first insights (first insight has no comparison data)
  if (!slots.isFirstInsight) {
    const notable = getNotableContext(slots);
    if (notable) {
      lines.push(`notable: ${notable}`);
      lines.push("");
    }
  }

  // Core financials
  lines.push(`profit: ${slots.profit}`);
  lines.push(`revenue: ${slots.revenue}`);
  lines.push(`expenses: ${slots.expenses}`);
  lines.push(`margin: ${slots.margin}%`);
  lines.push(`runway: ${slots.runway} months`);

  // Overdue
  if (slots.hasOverdue) {
    lines.push("");
    lines.push("overdue:");
    for (const inv of slots.overdue) {
      lines.push(`  - ${inv.company}: ${inv.amount} (${inv.daysOverdue} days)`);
    }
  }

  // Skip "vs last week" for first insight
  if (!slots.isFirstInsight && slots.profitChange !== 0) {
    const dir = slots.profitDirection === "up" ? "+" : "";
    lines.push("");
    lines.push(
      `change: profit ${dir}${slots.profitChange.toFixed(0)}% vs last week`,
    );
  }

  return lines.join("\n");
}

function buildExamples(slots: InsightSlots): string {
  // Examples showing natural, flowing language that connects facts
  const examples: Record<string, { input: string; output: string }> = {
    // When there's a milestone/personal best
    milestone: {
      input:
        "notable: Best profit week since October\n\nprofit: 117,061 kr, revenue: 120,200 kr, expenses: 3,139 kr, margin: 97.4%, runway: 8 months, overdue: Klarna 24,300 kr",
      output:
        "Your best profit week since October — 117,061 kr on 120,200 kr revenue with margin holding at 97%. Expenses stayed minimal, and your 8-month runway gives you flexibility. Klarna still owes 24,300 kr worth chasing.",
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
        "notable: Recovery after 2 down weeks\n\nprofit: 85,000 kr, revenue: 90,000 kr, expenses: 5,000 kr, margin: 94.4%, runway: 6 months, overdue: Beta Inc 12,000 kr",
      output:
        "Back in the black after two tough weeks — 85,000 kr profit on 90,000 kr revenue. Margin recovered to 94%, and your 6-month runway held steady. Beta Inc still owes 12,000 kr from before.",
    },
    // Standard (no notable context)
    standard: {
      input:
        "profit: 75,000 kr, revenue: 80,000 kr, expenses: 5,000 kr, margin: 93.8%, runway: 10 months, overdue: Acme Corp 8,000 kr",
      output:
        "Solid week with 75,000 kr profit on 80,000 kr revenue — margin at 94% with low expenses. Your 10-month runway gives you room to operate. Acme Corp owes 8,000 kr that's worth following up on.",
    },
    // Challenging week - IMPORTANT: if profit is negative, expenses MUST be mentioned
    challenging: {
      input:
        "profit: -22,266 kr, revenue: 0 kr, expenses: 22,266 kr, runway: 14 months, overdue: Acme Corp 750 kr",
      output:
        "No revenue landed this week, with 22,266 kr in expenses creating a gap. This is usually payment timing — invoices crossing weeks. Your 14-month runway means no pressure. Acme Corp still owes 750 kr.",
    },
    // Zero activity week (all values are 0) - NOT a loss, just no activity
    zero_activity: {
      input:
        "profit: 0 kr, revenue: 0 kr, expenses: 0 kr, margin: 0%, runway: 8 months, overdue: Klarna 5,000 kr",
      output:
        "Quiet week with no revenue or expenses recorded — sometimes weeks are just slow. Your 8-month runway is unchanged, and Klarna's 5,000 kr overdue is still there to collect.",
    },
  };

  // Select appropriate example based on context
  let exampleKey: string;
  const isZeroActivity =
    slots.profitRaw === 0 && slots.revenueRaw === 0 && slots.expensesRaw === 0;

  if (isZeroActivity) {
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
      "currency: SEK\n\nnotable: 3 consecutive profitable weeks\n\nprofit: 117,061 kr, revenue: 120,200 kr, expenses: 3,139 kr, margin: 97.4%, runway: 8 months, overdue: Klarna 24,300 kr",
    output:
      "Third straight profitable week — 117,061 kr on 120,200 kr revenue with margin holding at 97%. Expenses stayed minimal at 3,139 kr, and your 8-month runway keeps things comfortable. Klarna owes 24,300 kr worth chasing.",
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
        "profit: 260,340 kr, revenue: 268,000 kr, expenses: 7,660 kr, margin: 97%, runway: 14 months, overdue: Acme Corp 750 kr",
      output:
        "Welcome to your weekly insights. This week brought 260,340 kr profit on 268,000 kr revenue — a 97% margin with minimal expenses. Your 14-month runway gives you plenty of flexibility. One thing to chase: 750 kr overdue from Acme Corp.",
    },
    good: {
      input:
        "profit: 85,000 kr, revenue: 95,000 kr, expenses: 10,000 kr, margin: 89%, runway: 8 months, overdue: Beta Inc 5,000 kr",
      output:
        "Welcome to your weekly insights. You're starting with 85,000 kr profit on 95,000 kr revenue — 89% margin after 10,000 kr in expenses. Your 8-month runway is comfortable. Beta Inc owes 5,000 kr worth following up on.",
    },
    quiet: {
      input:
        "profit: 12,000 kr, revenue: 15,000 kr, expenses: 3,000 kr, margin: 80%, runway: 6 months",
      output:
        "Welcome to your weekly insights. Quieter start with 12,000 kr profit on 15,000 kr revenue — 80% margin with low expenses. Your 6-month runway gives you time. No outstanding receivables to worry about.",
    },
    challenging: {
      input:
        "profit: -15,000 kr, revenue: 0 kr, expenses: 15,000 kr, runway: 10 months, overdue: Acme Corp 8,000 kr",
      output:
        "Welcome to your weekly insights. No revenue this week with 15,000 kr in expenses — often just payment timing when invoices cross weeks. Your 10-month runway means no rush. Acme Corp owes 8,000 kr that's worth collecting.",
    },
    zero_activity: {
      input:
        "profit: 0 kr, revenue: 0 kr, expenses: 0 kr, runway: 8 months, overdue: Klarna 3,000 kr",
      output:
        "Welcome to your weekly insights. No financial activity recorded this week — sometimes weeks are just quiet. Your 8-month runway is unchanged. Klarna still owes 3,000 kr from before.",
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
      "currency: SEK\n\nprofit: 260,340 kr, revenue: 268,000 kr, expenses: 7,660 kr, margin: 97%, runway: 14 months, overdue: Acme Corp 750 kr",
    output:
      "Welcome to your weekly insights. This week brought 260,340 kr profit on 268,000 kr revenue — a 97% margin with minimal expenses. Your 14-month runway gives you plenty of flexibility. One thing to chase: 750 kr overdue from Acme Corp.",
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
