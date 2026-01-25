/**
 * Title prompt - executive summary headline
 *
 * Uses Anthropic best practices:
 * - XML tags for structure
 * - Clear role assignment
 * - Few-shot examples
 * - Direct, specific instructions
 */
import { type InsightSlots, getNotableContext, getToneGuidance } from "./slots";

/**
 * Build the title generation prompt
 */
export function buildTitlePrompt(slots: InsightSlots): string {
  const { weekType, isFirstInsight } = slots;

  const data = buildDataSection(slots);
  const examples = buildExamples(weekType, isFirstInsight);
  const tone = getToneGuidance(weekType);

  const firstInsightNote = isFirstInsight
    ? "\n- This is their FIRST insight - welcome them warmly, no 'vs last week' comparisons"
    : "";

  return `<role>
You write the headline for a weekly business insight that appears in a dashboard widget.
This is the FIRST thing users see — it must feel personal and make them want to read more.
Sound like a trusted CFO giving a quick verbal update, not a dashboard generating a report.
</role>

<voice>
${tone}
</voice>

<data>
${data}
</data>

<constraints>
Word count: 15-30 words
WHY: Under 15 feels incomplete. Over 30 won't fit the widget and loses punch.

Must use "your" or "you": Speak directly to the business owner.
WHY: "Your profit" feels personal. "Profit of X" feels like a spreadsheet.

Lead with context, not numbers: Start with streak/milestone/situation, then the figures.
WHY: "Third straight profitable week" hooks attention. "117k profit" is just data.

Include runway naturally: Mention it as reassurance, not as a metric.
WHY: Runway tells them they're safe. It should feel like comfort, not a data point.

Match currency format exactly: Copy the format from data (e.g., "338,958 kr" not "SEK 338958").
WHY: Consistency with their familiar format builds trust.
</constraints>

<banned_words>
solid, healthy, strong, great, robust, excellent, remarkable, impressive, amazing, outstanding, significant
WHY: These are filler words that add no meaning. Plain language sounds more genuine.
</banned_words>

<additional_rules>
- NEVER start with a number — always start with context or "Your"
- NEVER use "Weekly Summary:" or similar prefixes${firstInsightNote}
</additional_rules>

${examples}

<output>
Write ONE headline (15-30 words). Begin directly — no preamble.
</output>`;
}

function buildDataSection(slots: InsightSlots): string {
  const lines: string[] = [];

  // Currency context - tell AI to match the format shown in data values
  lines.push(
    `currency: ${slots.currency} (use same format as amounts below, e.g., "${slots.profit}")`,
  );
  lines.push("");

  // Period context for personalization
  lines.push(`period: ${slots.periodLabel}`);
  lines.push("");

  // Notable context for leading the title (most important!)
  if (!slots.isFirstInsight) {
    const notable = getNotableContext(slots);
    if (notable) {
      lines.push(`notable_context: ${notable}`);
      lines.push(
        "(LEAD with this context - it's what makes this week interesting)",
      );
      lines.push("");
    }
  }

  // Streak info for personalization
  if (slots.streak && slots.streak.count >= 2) {
    lines.push(`streak: ${slots.streak.count} ${slots.streak.type}`);
  }

  // Core financials
  lines.push(`profit: ${slots.profit}`);
  lines.push(`margin: ${slots.margin}%`);
  lines.push(`runway: ${slots.runway} months`);

  if (slots.revenueRaw > 0) {
    lines.push(`revenue: ${slots.revenue}`);
  }

  if (slots.profitRaw <= 0) {
    lines.push(`expenses: ${slots.expenses}`);
  }

  // Pending money (helps paint the full picture)
  if (slots.largestOverdue) {
    lines.push(
      `overdue: ${slots.largestOverdue.amount} from ${slots.largestOverdue.company} (${slots.largestOverdue.daysOverdue} days)`,
    );
  }

  if (slots.hasDrafts) {
    lines.push(`drafts_ready: ${slots.draftsTotal}`);
  }

  return lines.join("\n");
}

function buildExamples(weekType: string, isFirstInsight: boolean): string {
  // Personal examples that lead with context, use "your/you", and feel conversational
  const examples: Record<string, string[]> = {
    great: [
      "Your best profit week ever — [amount] at [X]% margin with a comfortable [X]-month runway ahead",
      "Best week since [month] — [amount] profit caps off a strong run, and your [X]-month runway gives you options",
      "Your [X]th consecutive week above [threshold] — [amount] profit with [X]% margin and [X] months of runway",
    ],
    good: [
      "Third straight week above [threshold] — [month] is shaping up well, and your [X]-month runway gives you room",
      "Another profitable week for you — [amount] at [X]% margin, with [amount] pending from [Company] to chase",
      "Your [month] is on track — [amount] profit this week, [X]% margin, and a [X]-month runway buffer",
    ],
    quiet: [
      "Quiet week on the revenue side, but your [X]-month runway and the [amount] pending from [Company] keep things stable",
      "Slower week for you — [amount] profit, but your [X]-month runway means no pressure",
      "Not much movement this week, though your [X]-month runway and [X]% margin give you flexibility",
    ],
    challenging: [
      "No revenue landed this week — payment timing gap, but your [X]-month runway means there's no rush",
      "Tough week with [amount] in expenses — your [X]-month buffer gives you time to work with",
      "Payment gap this week — [amount] sitting with [Company] overdue, but your [X]-month runway provides cushion",
    ],
  };

  const weekExamples = examples[weekType] ?? examples.good;

  // Concrete examples showing the personal, conversational format
  const concreteExamples: Record<string, string> = {
    great:
      "Your best profit week ever — 338,958 kr at 99% margin with a comfortable 14-month runway ahead",
    good: "Third straight week above 100k — January is shaping up well, and your 8-month runway gives you room",
    quiet:
      "Quiet week on the revenue side, but your 8-month runway and the 24,300 kr pending from Klarna keep things stable",
    challenging:
      "No revenue landed this week — payment timing gap, but your 14-month runway means there's no rush",
  };

  const concreteExample = concreteExamples[weekType] ?? concreteExamples.good;

  return `<examples>
<concrete_example>${concreteExample}</concrete_example>
${weekExamples!.map((ex) => `<pattern_example>${ex}</pattern_example>`).join("\n")}
</examples>`;
}
