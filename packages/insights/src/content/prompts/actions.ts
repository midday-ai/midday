import type { InsightSlots } from "./slots";

/**
 * Build the actions prompt
 */
export function buildActionsPrompt(slots: InsightSlots): string | null {
  const hasUrgentActions =
    slots.hasOverdue ||
    slots.hasDrafts ||
    slots.hasExpenseSpikes ||
    !!slots.concentrationWarning;

  // Check for proactive actions on quiet weeks
  const hasProactiveActions =
    slots.hoursTracked > 0 || // Has tracked time that could be billed
    slots.runway < 6 || // Low runway - should focus on revenue
    (slots.weekType === "quiet" && slots.revenueRaw === 0); // Quiet week with no revenue

  // No actions at all
  if (!hasUrgentActions && !hasProactiveActions) {
    return null;
  }

  const data = buildActionData(slots, hasUrgentActions);

  // Use different prompt for proactive vs urgent actions
  if (!hasUrgentActions) {
    return buildProactiveActionsPrompt(slots, data);
  }

  return `<role>
You provide recommended actions for business owners based on financial data.
Professional advisory tone - clear, direct, concise.
</role>

<data>
${data}
</data>

<rules>
- MUST include ALL overdue invoices (priority 1 - never skip any)
- After overdue: include up to 2 more from drafts/expense spikes/concentration
- Total actions: 3-5 max
- MUST use the exact currency format shown in data values (copy the format, not the ISO code)
- Keep each action SHORT - one line, no extra explanation needed
</rules>

<format>
For overdue: "Collect [amount with currency] from [Company]"
For UNUSUAL overdue: "Collect [amount] from [Company] — unusual delay, they typically pay faster"
For drafts: "Send [amount with currency] invoice to [Company]"
For expense spikes: "Review [category] (+[X]%)"
For concentration: "Diversify - [X]% revenue from [Company]"

Example: If data shows "7,500 kr", write "Collect 7,500 kr from [Company]"
Example unusual: "Collect 7,500 kr from [Company] — unusual delay, they typically pay faster"
</format>

<verify>
- ALL overdue invoices included? (critical)
- Amounts match data format exactly?
</verify>

<output>
Write actions. Begin directly - no preamble.
</output>`;
}

function buildActionData(slots: InsightSlots, includeUrgent = true): string {
  const lines: string[] = [];

  // Currency context - tell AI to match the format shown in data values
  lines.push(`currency: ${slots.currency} (use same format as amounts below)`);
  lines.push("");

  if (includeUrgent) {
    if (slots.hasOverdue) {
      lines.push("overdue (priority 1):");
      for (const inv of slots.overdue) {
        if (inv.isUnusual && inv.unusualReason) {
          // Flag unusual - this customer typically pays faster, worth escalating
          lines.push(
            `  - ${inv.company}: ${inv.amount} (${inv.daysOverdue} days) - UNUSUAL: ${inv.unusualReason}`,
          );
        } else {
          lines.push(
            `  - ${inv.company}: ${inv.amount} (${inv.daysOverdue} days)`,
          );
        }
      }
    }

    if (slots.hasDrafts) {
      lines.push("drafts ready to send (priority 2):");
      for (const draft of slots.drafts) {
        lines.push(`  - ${draft.company}: ${draft.amount}`);
      }
    }

    if (slots.hasExpenseSpikes) {
      lines.push("expense spikes (priority 3):");
      for (const spike of slots.expenseSpikes) {
        lines.push(
          `  - ${spike.category}: ${spike.amount} (+${spike.change}%)`,
        );
      }
    }

    if (slots.concentrationWarning) {
      lines.push("concentration risk (priority 4):");
      lines.push(
        `  - ${slots.concentrationWarning.percentage}% of revenue from ${slots.concentrationWarning.customerName} (${slots.concentrationWarning.amount})`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Build proactive actions prompt for quiet weeks
 */
function buildProactiveActionsPrompt(
  slots: InsightSlots,
  _data: string,
): string {
  const context: string[] = [];

  context.push(`currency: ${slots.currency}`);
  context.push(`runway: ${slots.runway} months`);
  context.push(`hours tracked this week: ${slots.hoursTracked}`);
  context.push(`revenue this week: ${slots.revenue}`);
  context.push(`week type: ${slots.weekType}`);

  return `<role>
You provide proactive suggestions for business owners during quiet weeks.
Focus on forward-looking actions to maintain momentum.
Professional advisory tone - helpful, not pushy.
</role>

<context>
${context.join("\n")}
</context>

<rules>
- MUST be 1-2 suggestions maximum
- Focus on practical, forward-looking actions
- If hours tracked but no revenue: suggest reviewing unbilled time
- If runway < 6 months: suggest revenue focus
- For quiet weeks: suggest reviewing upcoming client needs or follow-ups
- Keep suggestions brief and actionable
- NEVER invent specific client names or amounts - keep it general
</rules>

<examples>
<low_runway>"With ${slots.runway} months of runway, prioritize closing any pending deals or following up with prospects this week."</low_runway>
<tracked_hours>"Review ${slots.hoursTracked} hours tracked this week for any unbilled work that could be invoiced."</tracked_hours>
<quiet_week>"Quiet week - good time to reach out to past clients or review your pipeline for upcoming opportunities."</quiet_week>
</examples>

<output>
Write 1-2 proactive suggestions. Begin directly - no preamble.
</output>`;
}
