import type { InsightSlots } from "./slots";

/**
 * Build the actions prompt
 */
export function buildActionsPrompt(slots: InsightSlots): string | null {
  // No actionable data = no AI call needed
  if (
    !slots.hasOverdue &&
    !slots.hasDrafts &&
    !slots.hasUnbilled &&
    !slots.hasExpenseSpikes &&
    !slots.concentrationWarning
  ) {
    return null;
  }

  const data = buildActionData(slots);

  return `<role>
You provide recommended actions for business owners based on financial data.
Professional advisory tone - clear, direct, with brief business justification.
</role>

<data>
${data}
</data>

<rules>
- MUST be 1-3 actions maximum
- MUST follow priority order: overdue → drafts → unbilled → expense spikes → concentration warning
- MUST use professional, direct tone
- MUST use the exact currency format shown in data values (copy the format, not the ISO code)
- MUST include brief rationale where relevant (days overdue, percentage increase)
- For expense spikes, note the variance and suggest review
- For concentration risk, frame as a risk management consideration
</rules>

<examples>
<concrete_example>Follow up on 750 kr overdue from Acme Corp (71 days) - recommend escalation if unresolved this week</concrete_example>
<concrete_example>Invoice for Beta Inc (4,354 kr) is finalized and ready to send</concrete_example>
<pattern_example>Follow up on [amount] overdue from [Company] ([X] days) - recommend escalation if unresolved this week</pattern_example>
<pattern_example>Invoice for [Company] ([amount]) is finalized and ready to send</pattern_example>
<pattern_example>[X] hours of billable work for [Company] pending invoicing</pattern_example>
</examples>

<verify>
Before responding, check:
- All amounts use the same format as shown in data (e.g., if data shows "750 kr", use "kr" not "SEK")
- Company names match exactly as shown in data
- Days overdue match the data
- Maximum 3 actions
</verify>

<output>
Write 1-3 recommended actions. Begin directly with the first action - no preamble or introduction.
</output>`;
}

function buildActionData(slots: InsightSlots): string {
  const lines: string[] = [];

  // Currency context - tell AI to match the format shown in data values
  lines.push(`currency: ${slots.currency} (use same format as amounts below)`);
  lines.push("");

  if (slots.hasOverdue) {
    lines.push("overdue (priority 1):");
    for (const inv of slots.overdue) {
      lines.push(`  - ${inv.company}: ${inv.amount} (${inv.daysOverdue} days)`);
    }
  }

  if (slots.hasDrafts) {
    lines.push("drafts ready to send (priority 2):");
    for (const draft of slots.drafts) {
      lines.push(`  - ${draft.company}: ${draft.amount}`);
    }
  }

  if (slots.hasUnbilled) {
    lines.push("unbilled work (priority 3):");
    for (const work of slots.unbilled) {
      const who = work.customer || work.project;
      lines.push(`  - ${who}: ${work.hours}h = ${work.amount}`);
    }
  }

  if (slots.hasExpenseSpikes) {
    lines.push("expense spikes (priority 4):");
    for (const spike of slots.expenseSpikes) {
      lines.push(`  - ${spike.category}: ${spike.amount} (+${spike.change}%)`);
    }
  }

  if (slots.concentrationWarning) {
    lines.push("concentration risk (priority 5):");
    lines.push(
      `  - ${slots.concentrationWarning.percentage}% of revenue from ${slots.concentrationWarning.customerName} (${slots.concentrationWarning.amount})`,
    );
  }

  return lines.join("\n");
}
