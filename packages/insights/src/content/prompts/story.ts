import {
  getToneGuidance,
  type InsightSlots,
  selectPrimaryAction,
} from "./slots";

/**
 * Build the story generation prompt
 */
export function buildStoryPrompt(slots: InsightSlots): string {
  const { isFirstInsight, weekType } = slots;

  if (isFirstInsight) {
    return buildFirstInsightStoryPrompt(slots);
  }

  const highlight = getHighlight(slots);
  const primaryAction = selectPrimaryAction(slots);
  const tone = getToneGuidance(weekType);

  // If no action to recommend, return null (skip story generation)
  if (!primaryAction) {
    return buildNoActionStoryPrompt(slots, highlight, tone);
  }

  return `<role>
You write ONE sentence that connects this week's performance to a clear next action.
Sound like a trusted advisor giving practical guidance, not a report generator.
</role>

<voice>
${tone}
</voice>

<currency>${slots.currency} (use same format as amounts below)</currency>

<this_week>
${highlight}
</this_week>

<primary_action>
${primaryAction.description}
${primaryAction.company ? `Company: ${primaryAction.company}` : ""}
${primaryAction.daysOverdue ? `Days overdue: ${primaryAction.daysOverdue}` : ""}
Amount: ${primaryAction.amount}
</primary_action>

<runway>${slots.runway} months${slots.runway < 3 ? " — SHORT RUNWAY, use urgent language" : ""}</runway>

<rules>
- MUST be 1-2 sentences, 15-25 words total
- MUST focus on the ONE primary action above — don't list multiple things
- Connect the action to this week's context naturally
- Use the company name and amount specifically
- MUST use the exact currency format shown above
- Frame appropriately for the week type:
  - Good/great weeks: "With X going well...", "Now's a good time to...", "Lock in the momentum by..."
  - Challenging weeks: "To get things moving...", "While waiting for revenue...", "Your next step is..."
  - Quiet weeks: "One thing to keep moving...", "Worth following up on..."
- CRITICAL RUNWAY: If runway < 3 months, use URGENT language:
  - "Collecting X is urgent to extend your runway"
  - "Priority: chase the X from Y to strengthen cash position"
  - AVOID soft language like "now's a good time" when runway is critical
- NEVER use generic phrases: "enhance cash flow", "improve profitability", "optimize receivables"
- NEVER restate the summary — this adds a forward action
- CRITICAL: If profit is NEGATIVE, never say "doubled", "strong momentum", or imply growth. A smaller loss is progress, not success.
</rules>

<examples>
<great_week>
"With January going well, now's a good time to chase [Company]'s 24,300 kr — it's been sitting there 45 days."
</great_week>
<good_week>
"One thing to keep this momentum: follow up on [Company]'s 8,000 kr that's been overdue since December."
</good_week>
<quiet_week>
"Quiet week, but worth sending that 12,000 kr draft to [Company] to get some revenue queued up."
</quiet_week>
<challenging_week>
"While waiting for payments to land, chase the 5,000 kr from [Company] — it's been 30 days."
</challenging_week>
</examples>

<output>
Write 1-2 sentences (15-25 words). Connect this week to the action naturally. Begin directly.
</output>`;
}

function buildNoActionStoryPrompt(
  slots: InsightSlots,
  highlight: string,
  tone: string,
): string {
  // When there's no primary action, provide a forward-looking observation
  return `<role>
You write ONE sentence that looks forward or provides useful context.
No action to recommend, so focus on what this week means for them.
</role>

<voice>
${tone}
</voice>

<this_week>
${highlight}
</this_week>

<runway>${slots.runway} months</runway>

<rules>
- MUST be 1 sentence, 10-20 words
- Provide forward-looking context or reassurance
- Reference runway if relevant (especially for quiet/challenging weeks)
- NEVER use generic business speak
- Sound like a colleague, not a report
</rules>

<examples>
<great_week>
"Keep this up and you'll have a great quarter to look back on."
</great_week>
<good_week>
"Steady progress — your runway gives you room to keep building."
</good_week>
<quiet_week>
"Quiet weeks happen. Your ${slots.runway}-month runway means no pressure."
</quiet_week>
</examples>

<output>
Write 1 sentence (10-20 words). Begin directly.
</output>`;
}

function buildFirstInsightStoryPrompt(slots: InsightSlots): string {
  const primaryAction = selectPrimaryAction(slots);

  // If there's an action, focus on that
  if (primaryAction) {
    return `<role>
You write ONE sentence pointing them to their first action item.
</role>

<primary_action>
${primaryAction.description}
Amount: ${primaryAction.amount}
${primaryAction.company ? `Company: ${primaryAction.company}` : ""}
</primary_action>

<rules>
- MUST be 1 sentence, 10-20 words
- Point them to the action naturally
- Welcoming but practical tone
- Use company name and amount
</rules>

<examples>
"First thing to tackle: the 750 kr overdue from [Company] — it's been sitting there a while."
"One item needs attention: send that 12,000 kr draft to [Company] to get things moving."
</examples>

<output>
Write 1 sentence (10-20 words). Begin directly.
</output>`;
  }

  // No action — explain what to expect going forward
  return `<role>
You write ONE sentence explaining what future insights will provide.
</role>

<rules>
- MUST be 1 sentence, 10-15 words
- Professional and informative
- Explain the value: comparisons, trends, patterns
- No cheerleading or excitement
</rules>

<pick_one>
- Next week you'll see how this compares — trends and patterns will emerge.
- Future insights will show week-over-week changes and spot unusual patterns.
- As data builds up, you'll see trends and get earlier warnings on changes.
</pick_one>

<output>
Pick one or write something similar. Begin directly.
</output>`;
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

  // Strong profit change (20%+) - use pre-computed description
  if (Math.abs(slots.profitChange) >= 20) {
    return slots.profitChangeDescription;
  }

  // Strong revenue growth (20%+) - but only if there's actual revenue
  if (
    slots.revenueChange >= 20 &&
    slots.revenueDirection === "up" &&
    slots.revenueRaw > 0
  ) {
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
    if (slots.hasOverdue || slots.hasDrafts) {
      const pendingAmount = slots.hasOverdue
        ? slots.overdueTotal
        : slots.draftsTotal;
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
