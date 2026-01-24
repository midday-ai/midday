import type { InsightSlots } from "./slots";

/**
 * Build the story generation prompt
 */
export function buildStoryPrompt(slots: InsightSlots): string {
  const { isFirstInsight } = slots;

  if (isFirstInsight) {
    return buildFirstInsightStoryPrompt(slots);
  }

  const highlight = getHighlight(slots);
  const actionableContext = getActionableContext(slots);

  return `<role>
You write ONE forward-looking or actionable sentence that adds value beyond the summary.
</role>

<currency>${slots.currency} (use same format as amounts in actionable_items)</currency>

<highlight>
${highlight}
</highlight>

<actionable_items>
${actionableContext}
</actionable_items>

<rules>
- MUST be EXACTLY 1 sentence, maximum 15 words
- NEVER restate metrics or facts from the summary
- MUST reference SPECIFIC amounts AND company names from actionable_items
- MUST use the exact currency format shown in actionable_items (copy the format, not the ISO code)
- MUST tie the action to THIS week's context using APPROPRIATE framing:
  - For GOOD weeks (profit up, best week, etc.): "to lock in gains", "to build on momentum", "to capitalize on success"
  - For CHALLENGING weeks (loss, no revenue): "to offset the loss", "to address cash needs"
  - NEVER use negative framing ("financial strain", "mitigate") for positive weeks
- MUST use direct verbs: "Send", "Collect", "Bill", "Follow up on"
- NEVER use generic benefits: "enhance cash flow", "improve profitability", "reduce receivables"
- NEVER use speculation words: "suggests", "may reflect", "potentially", "could indicate"
- ZERO ACTIVITY: If no financial activity this period, focus ONLY on actionable items (overdue, drafts, unbilled)
</rules>

<examples>
<good_week_example>
"Collect the 750 kr overdue from Acme Corp to build on this week's strong results."
</good_week_example>
<challenging_week_example>
"Collect the 750 kr overdue from Acme Corp to offset this week's loss."
</challenging_week_example>
<good>
- "Send the [amount] draft to [customer] to lock in this week's gains." (good week)
- "Bill the [amount] unbilled work to capitalize on momentum." (good week)
- "Collect the [amount] overdue from [company] to offset the loss." (challenging week)
- "Follow up on [company]'s [X]-day overdue to address cash needs." (challenging week)
</good>
<bad>
- "Collect the 750 kr to mitigate financial strain" (negative framing on positive week - WRONG)
- "Collect the overdue invoice to enhance immediate cash flow" (generic benefit)
- "Profit increased due to higher revenue" (restates summary)
</bad>
</examples>

<output>
Write exactly 1 forward-looking or actionable sentence (max 15 words). Begin directly - no preamble.
</output>`;
}

function buildFirstInsightStoryPrompt(_slots: InsightSlots): string {
  // For first insight, explain the value of ongoing tracking
  // The summary already covers all the metrics - story adds utility context
  return `<role>
You write ONE professional sentence explaining the purpose of weekly financial tracking.
</role>

<banned_phrases>
- "off to a great start"
- "can't wait to see"
- "excited"
- "looking forward"
- "keep it up"
- "great job"
- Any encouragement or cheerleading
</banned_phrases>

<rules>
- MUST be EXACTLY 1 sentence
- MUST use professional and informative tone
- NEVER use encouragement or excitement
- Explain utility: trend analysis, pattern recognition, variance tracking
- MUST be factual and direct
</rules>

<pick_one>
- Subsequent reports will include week-over-week comparisons and trend analysis.
- This establishes baseline metrics for tracking performance variance.
- Future insights will highlight patterns and deviations from typical performance.
</pick_one>

<output>
Pick one of the above or write something equally professional and informative. Begin directly - no preamble.
</output>`;
}

function getActionableContext(slots: InsightSlots): string {
  const items: string[] = [];

  if (slots.hasOverdue && slots.largestOverdue) {
    items.push(
      `overdue: ${slots.overdueTotal} from ${slots.largestOverdue.company} (${slots.largestOverdue.daysOverdue} days)`,
    );
  }
  if (slots.hasDrafts) {
    items.push(`drafts ready: ${slots.draftsTotal}`);
  }
  if (slots.hasUnbilled) {
    items.push(`unbilled work: ${slots.unbilledTotal}`);
  }

  if (items.length === 0) {
    return "No pending action items.";
  }

  return items.join("\n");
}

/**
 * Convert pre-computed highlight to string for prompt
 * Falls back to additional logic for cases not covered by slots.highlight
 */
function getHighlight(slots: InsightSlots): string {
  // First, try to use the pre-computed highlight from slots
  const highlight = slots.highlight;

  switch (highlight.type) {
    case "personal_best":
      return highlight.description;
    case "recovery":
      return highlight.description;
    case "streak":
      return highlight.description;
    case "profit_multiplier":
      return `Profit ${highlight.multiplier}x vs last week`;
    case "yoy_growth":
      return highlight.description;
    case "big_payment":
      return `${highlight.customer} paid ${highlight.amount}`;
    case "vs_average":
      return highlight.description;
    case "milestone":
      return highlight.description;
    case "none":
      // Fall through to additional logic below
      break;
  }

  // Additional highlights not covered by pre-computed highlight

  // Strong profit growth (20%+)
  if (slots.profitChange >= 20 && slots.profitDirection === "up") {
    return `Profit up ${Math.round(slots.profitChange)}% vs last week`;
  }

  // Strong revenue growth (20%+)
  if (slots.revenueChange >= 20 && slots.revenueDirection === "up") {
    return `Revenue up ${Math.round(slots.revenueChange)}% vs last week`;
  }

  // High margin week
  if (
    slots.expensesRaw > 0 &&
    slots.profitDirection === "up" &&
    slots.marginRaw >= 50
  ) {
    return `${slots.margin}% margin this week`;
  }

  // Challenging week - focus on actionable next steps
  if (slots.weekType === "challenging") {
    if (slots.hasOverdue || slots.hasDrafts || slots.hasUnbilled) {
      const pendingAmount = slots.hasOverdue
        ? slots.overdueTotal
        : slots.hasDrafts
          ? slots.draftsTotal
          : slots.unbilledTotal;
      return `Pending receivables (${pendingAmount}) available to accelerate. ${slots.runway} months runway.`;
    }
    return "Payment timing gap. Focus on accelerating pending invoices.";
  }

  // Steady week (small changes)
  if (Math.abs(slots.profitChange) < 10 && Math.abs(slots.revenueChange) < 10) {
    return "Steady week";
  }

  // Default: mention the profit
  return `${slots.profit} profit this week`;
}
