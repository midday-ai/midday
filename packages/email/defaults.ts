/**
 * Shared default email copy for invoice emails.
 *
 * These are the canonical fallback strings used when the user hasn't
 * customized the email content in their invoice template. Both the
 * dashboard email-preview component and the actual email template
 * import from here so the two can never drift out of sync.
 */

export function defaultEmailSubject(teamName: string) {
  return `${teamName} sent you an invoice`;
}

export function defaultEmailHeading(teamName: string) {
  return `Invoice from ${teamName}`;
}

export function defaultEmailBody(teamName: string) {
  return `If you have any questions, just reply to this email.\n\nThanks,\n${teamName}`;
}

export const DEFAULT_EMAIL_BUTTON_TEXT = "View invoice";
