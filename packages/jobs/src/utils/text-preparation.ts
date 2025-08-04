export function prepareTransactionText(transaction: {
  name: string;
  counterpartyName?: string | null;
  description?: string | null;
  merchantName?: string | null;
}): string {
  // Prioritize enriched merchant name if available
  const primaryText =
    transaction.merchantName ||
    transaction.counterpartyName ||
    transaction.name;
  const parts = [primaryText];

  // Only include description if it's different from the primary text
  if (transaction.description && transaction.description !== primaryText) {
    parts.push(transaction.description);
  }

  return parts.filter(Boolean).join(" ").trim();
}

export function prepareInboxText(inbox: {
  displayName?: string | null;
  website?: string | null;
}): string {
  const parts = [inbox.displayName, inbox.website].filter(Boolean);

  return parts.join(" ").trim();
}
