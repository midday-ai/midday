import type { DocumentFieldOutput } from "@azure-rest/ai-document-intelligence";
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

export function getCurrency(field?: DocumentFieldOutput) {
  return field?.valueCurrency?.currencyCode ?? "USD";
}

export function extractRootDomain(content?: string) {
  const domainPattern =
    /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/|$)/g;

  const match = content?.match(domainPattern);

  if (!match) {
    return null;
  }

  const matchWithoutProtocol = match
    .at(0)
    ?.replace(/(?:https?:\/\/)?(?:www\.)?/, "");

  const rootDomain = matchWithoutProtocol?.split("/").at(0);

  return rootDomain;
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
