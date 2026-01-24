/**
 * Summary prompt - narrative financial picture
 *
 * Uses Anthropic best practices:
 * - XML tags for structure
 * - Clear role assignment
 * - Few-shot examples with input/output
 * - Direct, specific instructions
 */
import { type InsightSlots, getNotableContext } from "./slots";

/**
 * Build the summary generation prompt
 */
export function buildSummaryPrompt(slots: InsightSlots): string {
  const { isFirstInsight } = slots;

  const role = `<role>
You are a financial analyst providing a weekly business briefing.
Clear, precise language. No fluff, but accessible to non-accountants.
</role>`;

  const data = buildDataSection(slots);

  const rules = isFirstInsight
    ? `<rules>
- This is their FIRST weekly insight - provide brief context on what this report covers
- MUST be 40-60 words, professional and precise
- MUST include: profit, margin, runway with brief assessment
- Assess business health objectively (margin quality, runway adequacy)
- NEVER use "vs last week" comparisons - no prior data exists
- Note any outstanding receivables at the end
- ACCURACY: If profit is negative and revenue is zero, expenses MUST equal the absolute value of profit. NEVER say "no expenses" when profit is negative.
- MUST use the exact currency format shown in data values (copy the format, not the ISO code)
- NEVER use these adjectives: robust, solid, excellent, strong, healthy
- CRITICAL: Profit of 0 is NOT a loss. Only negative profit is a loss. Zero profit with zero expenses = "no activity", not "loss"
</rules>`
    : `<rules>
- MUST be 40-60 words, professional and precise
- If "notable" context provided, MUST LEAD with it (e.g., "Best week since October: ..." or "Third consecutive profitable week: ...")
- MUST include: profit, margin, runway
- MUST use direct statements: "Profit of X" not casual "You made X"
- Note outstanding receivables at end if any
- ACCURACY: All stated figures MUST match the data exactly. If revenue is 0 and profit is negative, expenses exist.
- MUST use the exact currency format shown in data values (copy the format, not the ISO code)
- NEVER use these adjectives: robust, solid, excellent, strong, healthy
- For loss periods: acknowledge honestly, explain likely cause (timing), note runway buffer
- ZERO VALUES: If profit, revenue, AND expenses are all 0, state "No financial activity this period" - don't report meaningless percentages
- NEVER report percentage changes when the result is 0 (e.g., don't say "+100% to reach 0 kr")
- CRITICAL: Profit of 0 is NOT a loss. Only negative profit is a loss. If profit = 0, say "break-even" or "no activity", never "loss"
</rules>`;

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
Before responding, check:
- All amounts use the same format as shown in data (e.g., if data shows "338,957 kr", use "kr" not "SEK")
- Word count is 40-60 words
- No banned adjectives (robust, solid, excellent, strong, healthy)
- All figures match the data exactly
- If profit is negative, did you mention expenses? (NEVER say "no expenses" when profit is negative)
</verify>

<output>
Write ONE summary (40-60 words). Begin directly with the content - no preamble or introduction.
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
  // Examples showing different lead patterns for variety
  const examples: Record<string, { input: string; output: string }> = {
    // When there's a milestone/personal best
    milestone: {
      input:
        "notable: Best profit week since [month]\n\nprofit: [amount], revenue: [amount], expenses: [amount], margin: [X]%, runway: [X] months, overdue: [Company] [amount]",
      output:
        "Best profit week since [month]: [amount] on [amount] revenue. Margin at [X]% with minimal expenses. Runway at [X] months. Outstanding: [amount] from [Company].",
    },
    // When there's a streak
    streak: {
      input:
        "notable: [X] consecutive profitable weeks\n\nprofit: [amount], revenue: [amount], expenses: [amount], margin: [X]%, runway: [X] months",
      output:
        "[Xth] consecutive profitable week: [amount] profit at [X]% margin. Revenue of [amount] with [amount] expenses. Runway at [X] months.",
    },
    // When there's a recovery
    recovery: {
      input:
        "notable: Recovery after [X] down weeks\n\nprofit: [amount], revenue: [amount], expenses: [amount], margin: [X]%, runway: [X] months, overdue: [Company] [amount]",
      output:
        "Recovery after [X] down weeks: [amount] profit on [amount] revenue. Margin at [X]%, runway at [X] months. Outstanding: [amount] from [Company].",
    },
    // Standard (no notable context)
    standard: {
      input:
        "profit: [amount], revenue: [amount], expenses: [amount], margin: [X]%, runway: [X] months, overdue: [Company] [amount]",
      output:
        "Profit of [amount] on [amount] revenue this period. Margin at [X]% with [amount] in expenses. Runway at [X] months. Outstanding: [amount] from [Company].",
    },
    // Challenging week - IMPORTANT: if profit is negative, expenses MUST be mentioned
    challenging: {
      input:
        "profit: -22,266 kr, revenue: 0 kr, expenses: 22,266 kr, runway: 14 months, overdue: Acme Corp 750 kr",
      output:
        "No revenue this period with 22,266 kr in expenses, resulting in a net loss. This reflects invoice payment timing. Runway of 14 months provides buffer. Outstanding: 750 kr from Acme Corp.",
    },
    // Zero activity week (all values are 0) - NOT a loss, just no activity
    zero_activity: {
      input:
        "profit: 0 kr, revenue: 0 kr, expenses: 0 kr, margin: 0%, runway: [X] months, overdue: [Company] [amount]",
      output:
        "No financial activity recorded this period — no revenue or expenses. Runway remains at [X] months. Outstanding: [amount] from [Company] overdue by [X] days.",
    },
  };

  // Select appropriate example based on context
  let exampleKey: string;
  // Check for zero activity week first
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

  // Concrete example showing exact format expected
  const concreteExample = {
    input:
      "currency: SEK\n\nprofit: 338,958 kr, revenue: 340,000 kr, expenses: 1,042 kr, margin: 99.7%, runway: 14 months, overdue: Acme Corp 750 kr",
    output:
      "Profit of 338,958 kr on 340,000 kr revenue this period. Margin at 99.7% with minimal expenses of 1,042 kr. Runway at 14 months. Outstanding: 750 kr from Acme Corp.",
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
        "profit: [amount], margin: [X]%, runway: [X] months, overdue: [Company] [amount]",
      output:
        "Initial weekly analysis: [amount] profit with [X]% operating margin, indicating low cost relative to revenue. Current runway of [X] months. Outstanding receivable: [amount] from [Company].",
    },
    good: {
      input:
        "profit: [amount], margin: [X]%, runway: [X] months, overdue: [Company] [amount]",
      output:
        "Initial weekly analysis: [amount] profit at [X]% margin, typical for service-based operations. Runway of [X] months. Action needed: [amount] overdue from [Company].",
    },
    quiet: {
      input: "profit: [amount], margin: [X]%, runway: [X] months",
      output:
        "Initial weekly analysis: [amount] profit with [X]% operating margin. Runway of [X] months. No outstanding receivables to address.",
    },
    challenging: {
      input:
        "profit: -[amount], revenue: 0, expenses: [amount], runway: [X] months, overdue: [Company] [amount]",
      output:
        "Initial weekly analysis: No revenue recorded with [amount] in expenses, resulting in a net loss for the period. This is common when invoice payments span multiple periods. Runway of [X] months provides operating buffer. Outstanding: [amount] from [Company].",
    },
    // Zero activity - NOT a loss
    zero_activity: {
      input:
        "profit: 0 kr, revenue: 0 kr, expenses: 0 kr, runway: [X] months, overdue: [Company] [amount]",
      output:
        "Initial weekly analysis: No financial activity recorded — no revenue or expenses this period. Runway of [X] months. Outstanding: [amount] from [Company] requires follow-up.",
    },
  };

  // Check for zero activity first
  const isZeroActivity =
    slots.profitRaw === 0 && slots.revenueRaw === 0 && slots.expensesRaw === 0;
  const example = isZeroActivity
    ? examples.zero_activity
    : (examples[weekType] ?? examples.good);

  // Concrete example for first insights
  const concreteExample = {
    input:
      "currency: SEK\n\nprofit: 260,340 kr, margin: 97%, runway: 14 months, overdue: Acme Corp 750 kr",
    output:
      "Initial weekly analysis: 260,340 kr profit with 97% operating margin, indicating efficient cost management. Current runway of 14 months. Outstanding receivable: 750 kr from Acme Corp.",
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
