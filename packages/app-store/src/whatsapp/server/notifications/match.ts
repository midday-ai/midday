import { parseISO } from "date-fns";
import { createWhatsAppClient } from "../client";
import { formatMatchNotification } from "../messages";

export type MatchNotificationParams = {
  phoneNumber: string;
  inboxId: string;
  transactionId: string;
  inboxName: string;
  transactionName: string;
  amount: number;
  currency: string;
  confidence: number;
  transactionDate?: string;
};

/**
 * Format currency amount for display
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString?: string): string | undefined {
  if (!dateString) return undefined;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parseISO(dateString));
  } catch {
    return undefined;
  }
}

/**
 * Send a match notification via WhatsApp with Confirm/Decline buttons
 */
export async function sendMatchNotification(params: MatchNotificationParams) {
  const client = createWhatsAppClient();

  const formattedAmount = formatCurrency(params.amount, params.currency);
  const formattedDate = formatDate(params.transactionDate);

  // Extract numeric amount for display
  const amountValue = formattedAmount.replace(/[^\d.,]/g, "");

  const body = formatMatchNotification({
    receiptName: params.inboxName,
    transactionName: params.transactionName,
    amount: amountValue,
    currency: params.currency,
    transactionDate: formattedDate,
  });

  await client.sendInteractiveButtons(params.phoneNumber, body, [
    {
      id: `confirm_${params.inboxId}_${params.transactionId}`,
      title: "Confirm Match",
    },
    {
      id: `decline_${params.inboxId}_${params.transactionId}`,
      title: "Decline Match",
    },
  ]);
}

/**
 * Parse a button ID from match notification
 */
export function parseMatchButtonId(buttonId: string): {
  action: "confirm" | "decline";
  inboxId: string;
  transactionId: string;
} | null {
  const match = buttonId.match(/^(confirm|decline)_([^_]+)_(.+)$/);
  if (!match?.[1] || !match[2] || !match[3]) {
    return null;
  }

  return {
    action: match[1] as "confirm" | "decline",
    inboxId: match[2],
    transactionId: match[3],
  };
}
