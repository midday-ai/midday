export function prepareTransactionText(transaction: {
  name: string;
  counterpartyName?: string | null;
  description?: string | null;
}): string {
  const parts = [
    transaction.counterpartyName || transaction.name,
    transaction.description,
  ].filter(Boolean);

  return parts.join(" ").trim();
}

export function prepareInboxText(inbox: {
  displayName?: string | null;
  website?: string | null;
  description?: string | null;
}): string {
  const parts = [inbox.displayName, inbox.website, inbox.description].filter(
    Boolean,
  );

  return parts.join(" ").trim();
}
