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

export function getContentSample(text: string, maxTokens = 1200): string {
  const words = text.split(/\s+/);
  const approxWordsPerToken = 0.75; // Rough estimate
  const maxWords = Math.floor(maxTokens / approxWordsPerToken);
  return words.slice(0, maxWords).join(" ");
}

const supportedMimeTypesForProcessing = new Set([
  "application/pdf",
  "application/x-pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/docx",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/pptx",
  "application/rtf",
  "text/markdown",
  "application/vnd.oasis.opendocument.text",
  "image/heic", // Handled via conversion
  // "application/vnd.apple.pages",
  // "application/x-iwork-pages-sffpages",
  // "applicatiosn/epub+zip",
]);

/**
 * Checks if a given MIME type is supported for document or image processing.
 * This includes types loadable by `loadDocument` and image types handled by `classifyImage`.
 * @param mimetype The MIME type string to check.
 * @returns True if the MIME type is supported, false otherwise.
 */
export function isMimeTypeSupportedForProcessing(mimetype: string): boolean {
  // Check exact matches first
  if (supportedMimeTypesForProcessing.has(mimetype)) {
    return true;
  }

  // Check if it's any other image type (handled by classifyImage)
  if (mimetype.startsWith("image/")) {
    return true;
  }

  return false;
}

export function limitWords(text: string, maxWords: number): string {
  if (!text) return "";

  const words = text.split(/\s+/); // Split by any whitespace

  if (words.length <= maxWords) {
    return text;
  }

  return words.slice(0, maxWords).join(" ");
}
