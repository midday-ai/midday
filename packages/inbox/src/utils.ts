import type { Attachment } from "./schema";

export function getInboxIdFromEmail(email: string) {
  return email.split("@").at(0);
}

export function getInboxEmail(inboxId: string) {
  if (process.env.NODE_ENV !== "production") {
    return `${inboxId}@inbox.staging.midday.ai`;
  }

  return `${inboxId}@inbox.midday.ai`;
}

export const allowedMimeTypes = [
  "image/heic",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/octet-stream",
];

export function getAllowedAttachments(attachments?: Attachment[]) {
  return attachments?.filter((attachment) =>
    allowedMimeTypes.includes(attachment.ContentType),
  );
}
