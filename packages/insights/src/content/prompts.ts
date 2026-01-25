/**
 * Fallback content for when AI generation fails
 */
import type { InsightActivity, PeriodType } from "../types";

/**
 * Get fallback content when AI generation fails
 */
export function getFallbackContent(
  periodLabel: string,
  _periodType: PeriodType,
  activity?: InsightActivity,
): {
  title: string;
  summary: string;
  story: string;
  actions: Array<{ text: string }>;
} {
  // If there's money on the table, mention it even in fallback
  const moneyOnTable = activity?.moneyOnTable;
  if (moneyOnTable && moneyOnTable.totalAmount > 0) {
    const hasOverdue = moneyOnTable.overdueInvoices.length > 0;
    const topOverdue = moneyOnTable.overdueInvoices[0];

    return {
      title:
        hasOverdue && topOverdue
          ? `${topOverdue.customerName} owes you - check your summary.`
          : `${periodLabel} summary ready.`,
      summary:
        hasOverdue && topOverdue
          ? `You have outstanding invoices to follow up on. ${topOverdue.customerName} owes you - check your ${periodLabel} summary for details.`
          : `${periodLabel} summary is ready. Check the dashboard for your detailed metrics.`,
      story:
        "Your weekly numbers are ready for review. Check the dashboard for detailed metrics and any items needing attention.",
      actions: hasOverdue
        ? [{ text: "Review overdue invoices" }]
        : [{ text: "Review your dashboard" }],
    };
  }

  return {
    title: `${periodLabel} summary ready.`,
    summary: `Your ${periodLabel} summary is ready. Check the dashboard for detailed numbers and any items needing attention.`,
    story:
      "Check your dashboard for the detailed numbers and any items needing attention.",
    actions: [],
  };
}
