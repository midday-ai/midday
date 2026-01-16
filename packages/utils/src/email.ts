/**
 * Email validation utilities for comma-separated email lists
 */

/**
 * Validates a single email address using a non-backtracking approach
 * to prevent ReDoS vulnerabilities
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();

  // Length limits per RFC 5321
  if (trimmed.length === 0 || trimmed.length > 254) return false;

  const atIndex = trimmed.indexOf("@");

  // Must have exactly one @ with content on both sides
  if (atIndex < 1 || atIndex !== trimmed.lastIndexOf("@")) return false;

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  // Local part validation
  if (local.length > 64 || /\s/.test(local)) return false;

  // Domain validation: must have content, no spaces, and a valid TLD
  if (domain.length === 0 || domain.length > 253 || /\s/.test(domain))
    return false;

  // Domain must have at least one dot with content on both sides
  const lastDotIndex = domain.lastIndexOf(".");
  if (lastDotIndex < 1 || lastDotIndex >= domain.length - 1) return false;

  return true;
}

/**
 * Parses a comma-separated email string into an array of trimmed emails
 */
export function parseEmailList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * Validates a comma-separated email string
 * Returns true if empty/null or if all emails are valid and unique (case-insensitive)
 */
export function isValidEmailList(value: string | null | undefined): boolean {
  if (!value) return true;
  const emails = parseEmailList(value);

  // Check all emails are valid
  if (!emails.every((email) => isValidEmail(email))) return false;

  // Check for duplicates (case-insensitive)
  const uniqueEmails = new Set(emails.map((e) => e.toLowerCase()));
  return uniqueEmails.size === emails.length;
}
