import { createWhatsAppClient } from "../client";

export type MatchNotificationParams = {
  phoneNumber: string;
  inboxId: string;
  transactionId: string;
  inboxName: string;
  transactionName: string;
  amount: number;
  currency: string;
  confidence: number;
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
 * Send a match notification via WhatsApp with Confirm/Decline buttons
 */
export async function sendMatchNotification(params: MatchNotificationParams) {
  const client = createWhatsAppClient();

  const body = [
    "Match found!",
    "",
    `Receipt: ${params.inboxName}`,
    `Transaction: ${params.transactionName}`,
    `Amount: ${formatCurrency(params.amount, params.currency)}`,
    `Confidence: ${Math.round(params.confidence * 100)}%`,
  ].join("\n");

  await client.sendInteractiveButtons(params.phoneNumber, body, [
    {
      id: `confirm_${params.inboxId}_${params.transactionId}`,
      title: "Confirm",
    },
    {
      id: `decline_${params.inboxId}_${params.transactionId}`,
      title: "Decline",
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
