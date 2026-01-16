/**
 * Email validation utilities for comma-separated email lists
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a single email address
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
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
 * Returns true if empty/null or if all emails are valid
 */
export function isValidEmailList(value: string | null | undefined): boolean {
  if (!value) return true;
  const emails = parseEmailList(value);
  return emails.every((email) => isValidEmail(email));
}
