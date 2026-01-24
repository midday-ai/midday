/**
 * Title prompt - executive summary headline
 *
 * Uses Anthropic best practices:
 * - XML tags for structure
 * - Clear role assignment
 * - Few-shot examples
 * - Direct, specific instructions
 */
import { type InsightSlots, getNotableContext } from "./slots";

/**
 * Build the title generation prompt
 */
export function buildTitlePrompt(slots: InsightSlots): string {
  const { weekType, isFirstInsight } = slots;

  const data = buildDataSection(slots);
  const examples = buildExamples(weekType, isFirstInsight);

  const firstInsightNote = isFirstInsight
    ? "\n- This is their FIRST insight - no 'vs last week' comparisons"
    : "";

  return `<role>
You write concise, varied headlines for weekly financial reports.
Lead with what's most notable. No fixed format.
</role>

<data>
${data}
</data>

<rules>
- MUST be 10-20 words
- NEVER use "Weekly Summary:" prefix - vary the opening
- If "notable" context provided, MUST lead with it
- Otherwise lead with the most significant metric (profit, or runway if challenging week)
- MUST include runway somewhere
- MUST use the exact currency format shown in data values (copy the format, not the ISO code)
- NEVER use these adjectives: solid, healthy, strong, great, robust, excellent
- ZERO VALUES: If profit/revenue/expenses are all 0, lead with "No activity this period" or focus on runway/outstanding items
- NEVER report percentage changes when the result is 0 (e.g., don't say "+100%" for 0 kr profit)
- Note largest overdue only if significant${firstInsightNote}
</rules>

${examples}

<output>
Write ONE headline (10-20 words). Begin directly - no preamble.
</output>`;
}

function buildDataSection(slots: InsightSlots): string {
  const lines: string[] = [];

  // Currency context - tell AI to match the format shown in data values
  lines.push(
    `currency: ${slots.currency} (use same format as amounts below, e.g., "${slots.profit}")`,
  );
  lines.push("");

  // Notable context for dynamic leads (shared utility)
  if (!slots.isFirstInsight) {
    const notable = getNotableContext(slots);
    if (notable) {
      lines.push(`notable: ${notable}`);
      lines.push("");
    }
  }

  lines.push(`profit: ${slots.profit}`);
  lines.push(`margin: ${slots.margin}%`);
  lines.push(`runway: ${slots.runway} months`);

  if (slots.revenueRaw > 0) {
    lines.push(`revenue: ${slots.revenue}`);
  }

  if (slots.profitRaw <= 0) {
    lines.push(`expenses: ${slots.expenses}`);
  }

  if (slots.largestOverdue) {
    lines.push(
      `overdue: ${slots.largestOverdue.company} owes ${slots.largestOverdue.amount}`,
    );
  }

  return lines.join("\n");
}

function buildExamples(weekType: string, isFirstInsight: boolean): string {
  const examples: Record<string, string[]> = {
    great: [
      "[amount] profit at [X]% margin. [X]-month runway. [amount] outstanding from [Company].",
      "Best week since [month] — [amount] profit, [X]% margin, [X]-month runway.",
    ],
    good: [
      "[amount] profit ([X]% margin) with [X]-month runway. [amount] overdue from [Company].",
      "Third consecutive profitable week — [amount] at [X]% margin. [X]-month runway.",
    ],
    quiet: [
      "Steady week: [amount] profit, [X]% margin, [X]-month runway.",
      "[amount] profit with margin holding. Runway at [X] months.",
      "No activity this period. [X]-month runway. [amount] outstanding from [Company].",
    ],
    challenging: [
      "No revenue this period — [amount] expenses. [X]-month runway provides buffer.",
      "Payment timing gap. [X]-month runway. [amount] outstanding from [Company].",
      "No activity recorded. Runway at [X] months. [amount] overdue from [Company].",
    ],
  };

  const weekExamples = examples[weekType] ?? examples.good;

  // Concrete example showing exact format
  const concreteExample =
    "338,958 kr profit at 99.7% margin. 14-month runway. 750 kr outstanding from Acme Corp.";

  return `<examples>
<concrete_example>${concreteExample}</concrete_example>
${weekExamples!.map((ex) => `<pattern_example>${ex}</pattern_example>`).join("\n")}
</examples>`;
}
