import type { Attachments } from "./types";

export const allowedMimeTypes = [
  "image/heic",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/octet-stream",
];

export function getAllowedAttachments(attachments?: Attachments) {
  return attachments?.filter((attachment) =>
    allowedMimeTypes.includes(attachment.ContentType),
  );
}

export function getDomainFromEmail(email?: string | null): string | null {
  const emailPattern = /^[^\s@]+@([^\s@]+)$/;
  const match = email?.match(emailPattern);
  const domain = match?.at(1);

  if (!domain) return null;

  const domainParts = domain.split(".");

  if (domainParts.length > 2) {
    return domainParts.slice(-2).join(".");
  }

  return domain;
}

export function removeProtocolFromDomain(domain: string | null): string | null {
  if (!domain) return null;

  return domain.replace(/^(https?:\/\/)/, "");
}

export function getDocumentTypeFromMimeType(mimetype: string): string {
  switch (mimetype) {
    case "application/pdf":
    case "application/octet-stream":
      return "invoice";
    default:
      return "receipt";
  }
}
