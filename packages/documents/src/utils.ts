import type { Attachments } from "./types";
import { lookupDomainByCompanyName } from "./utils/domain-lookup";

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

/**
 * Extract domain from email address
 * Handles various email formats and extracts root domain
 */
export function getDomainFromEmail(email?: string | null): string | null {
  if (!email) return null;

  // Clean email - remove any whitespace and angle brackets
  const cleanedEmail = email.trim().replace(/[<>]/g, "");

  const emailPattern = /^[^\s@]+@([^\s@]+)$/;
  const match = cleanedEmail.match(emailPattern);
  const domain = match?.at(1);

  if (!domain) return null;

  // Handle common email service domains (keep as-is)
  const commonEmailServices = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "protonmail.com",
  ];
  if (commonEmailServices.includes(domain.toLowerCase())) {
    return domain.toLowerCase();
  }

  // Extract root domain (remove subdomains)
  const domainParts = domain.toLowerCase().split(".");

  // Handle special cases like .co.uk, .com.au, etc.
  const twoPartTLDs = [
    "co.uk",
    "com.au",
    "co.nz",
    "co.za",
    "com.br",
    "com.mx",
    "co.jp",
    "com.cn",
  ];

  // Check if it's a two-part TLD
  if (domainParts.length >= 3) {
    const lastTwo = domainParts.slice(-2).join(".");
    if (twoPartTLDs.includes(lastTwo)) {
      // Return domain with two-part TLD (e.g., example.co.uk)
      return domainParts.slice(-3).join(".");
    }
  }

  // Standard case: return last two parts (e.g., example.com)
  if (domainParts.length > 2) {
    return domainParts.slice(-2).join(".");
  }

  return domain.toLowerCase();
}

/**
 * Remove protocol and clean domain/URL
 * Handles various URL formats and extracts clean domain
 */
export function removeProtocolFromDomain(domain: string | null): string | null {
  if (!domain) return null;

  // Remove protocol (http://, https://, www.)
  let cleaned = domain
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?/i, "")
    .toLowerCase();

  // Remove trailing slash
  cleaned = cleaned.replace(/\/$/, "");

  // Remove path, query params, and fragments
  cleaned = cleaned.split("/")[0]?.split("?")[0]?.split("#")[0] || cleaned;

  // Extract root domain (remove subdomains)
  const domainParts = cleaned.split(".");

  // Handle special cases like .co.uk, .com.au, etc.
  const twoPartTLDs = [
    "co.uk",
    "com.au",
    "co.nz",
    "co.za",
    "com.br",
    "com.mx",
    "co.jp",
    "com.cn",
  ];

  if (domainParts.length >= 3) {
    const lastTwo = domainParts.slice(-2).join(".");
    if (twoPartTLDs.includes(lastTwo)) {
      return domainParts.slice(-3).join(".");
    }
  }

  // Standard case: return last two parts
  if (domainParts.length > 2) {
    return domainParts.slice(-2).join(".");
  }

  return cleaned;
}

/**
 * Intelligently extract website from invoice/receipt data
 * Tries multiple sources: explicit website, email domain, vendor name lookup
 */
export async function extractWebsite(
  website: string | null | undefined,
  email: string | null | undefined,
  vendorName: string | null | undefined,
  logger?: ReturnType<typeof import("@midday/logger").createLoggerWithContext>,
): Promise<string | null> {
  // First priority: explicit website field
  if (website) {
    const cleaned = removeProtocolFromDomain(website);
    if (cleaned) return cleaned;
  }

  // Second priority: extract from email
  if (email) {
    const domain = getDomainFromEmail(email);
    if (domain) {
      // Skip common email service domains
      const commonEmailServices = [
        "gmail.com",
        "yahoo.com",
        "outlook.com",
        "hotmail.com",
        "icloud.com",
        "protonmail.com",
      ];
      if (!commonEmailServices.includes(domain)) {
        return domain;
      }
    }
  }

  // Third priority: lookup domain by company name using Gemini Grounding
  if (vendorName) {
    try {
      const lookedUpDomain = await lookupDomainByCompanyName(
        vendorName,
        logger,
      );
      if (lookedUpDomain) {
        return lookedUpDomain;
      }
    } catch (error) {
      // Log error but don't throw - graceful degradation
      logger?.warn("Domain lookup failed during website extraction", {
        vendorName,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return null;
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

export function extractTextFromRtf(buffer: Buffer): string {
  let rtfContent = buffer.toString("utf-8");

  // Remove font tables, color tables, and other metadata groups
  rtfContent = rtfContent.replace(
    /{\\(?:fonttbl|colortbl|stylesheet)[^}]*}/gi,
    "",
  );

  // Remove RTF header
  rtfContent = rtfContent.replace(/^{\\rtf1[^}]*}/i, "");

  // Remove embedded pictures, objects
  rtfContent = rtfContent.replace(/{\\\*\\shppict[^}]*}/gi, "");
  rtfContent = rtfContent.replace(/{\\object[^}]*}/gi, "");
  rtfContent = rtfContent.replace(/{\\pict[^}]*}/gi, "");

  // Remove Unicode characters like \u1234? (keep the fallback '?')
  rtfContent = rtfContent.replace(/\\u-?\d+\??/g, "");

  // Remove all other RTF control words
  rtfContent = rtfContent.replace(/\\[a-z]+\d* ?/gi, "");

  // Remove escaped hex like \'ab
  rtfContent = rtfContent.replace(/\\'[0-9a-f]{2}/gi, "");

  // Remove any leftover braces
  rtfContent = rtfContent.replace(/[{}]/g, "");

  // Replace known RTF newline/tab symbols
  rtfContent = rtfContent
    .replace(/\\par[d]?/gi, "\n")
    .replace(/\\tab/gi, "\t")
    .replace(/\\line/gi, "\n");

  // Collapse multiple spaces and newlines
  rtfContent = rtfContent.replace(/\r?\n\s*\r?\n/g, "\n"); // multiple newlines -> single
  rtfContent = rtfContent.replace(/[ \t]{2,}/g, " "); // multiple spaces/tabs -> single

  // Final clean trim§
  return rtfContent.trim();
}

export function cleanText(text: string): string {
  // Remove control characters (C0 and C1 controls)
  // Using Unicode escapes to avoid eslint `no-control-regex` error
  // \u0000-\u001F corresponds to \x00-\x1F
  // \u007F-\u009F corresponds to \x7F-\x9F
  // Remove control characters (C0 and C1 controls) using Unicode escapes to avoid eslint `no-control-regex` error
  let cleanedText = text.replace(
    new RegExp(
      [
        "[",
        "\\u0000-\\u001F", // C0 controls
        "\\u007F-\\u009F", // C1 controls
        "]",
      ].join(""),
      "g",
    ),
    "",
  );

  // Normalize spaces: replace multiple spaces, tabs, or line breaks with a single space
  cleanedText = cleanedText.replace(/\s+/g, " ").trim();

  // The previous version removed too many characters with /[^\x20-\x7E]/g
  // It also had potentially overly aggressive punctuation cleaning.
  // This simpler version focuses on removing control chars and normalizing space.

  // Optional: Further specific cleaning can be added here if needed,
  // for example, removing zero-width spaces:
  // cleanedText = cleanedText.replace(/[\u200B-\u200D\uFEFF]/g, '');

  return cleanedText;
}

export function limitWords(text: string, maxWords: number): string {
  if (!text) return "";

  const words = text.split(/\s+/); // Split by any whitespace

  if (words.length <= maxWords) {
    return text;
  }

  return words.slice(0, maxWords).join(" ");
}

export { mapLanguageCodeToPostgresConfig } from "./utils/language-mapping";
