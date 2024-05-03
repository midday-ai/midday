export function getInboxIdFromEmail(email: string) {
  return email.split("@").at(0);
}

export function getInboxEmail(inboxId: string) {
  if (process.env.NODE_ENV !== "production") {
    return `${inboxId}@inbox.staging.midday.ai`;
  }

  return `${inboxId}@inbox.midday.ai`;
}
