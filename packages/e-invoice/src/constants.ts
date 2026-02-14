/**
 * Default e-invoice provider identifier.
 * Used across the codebase to avoid typos in string literals.
 */
export const E_INVOICE_PROVIDER_PEPPOL = "peppol" as const;

/**
 * Regex for validating Peppol participant IDs in `scheme:code` format.
 *
 * - **Scheme**: exactly 4 digits (ISO 6523 ICD, e.g. `0208` for Belgium, `0007` for Sweden)
 * - **Separator**: colon `:`
 * - **Code**: one or more non-whitespace characters (format varies per scheme)
 *
 * Examples: `0208:0316597904`, `0007:5567321707`, `0192:987654321`
 */
export const PEPPOL_ID_REGEX = /^\d{4}:[^\s:]+$/;

/**
 * Validate that a string is a well-formed Peppol participant ID (`scheme:code`).
 * Returns `true` for valid IDs, `false` otherwise.
 */
export function isValidPeppolId(value: string): boolean {
  return PEPPOL_ID_REGEX.test(value);
}

/**
 * Map known Invopop fault codes to user-friendly messages.
 * Grows over time as we encounter real errors in production.
 * Unknown codes gracefully fall back to the raw message.
 */
const FAULT_MESSAGES: Record<string, string> = {
  // Peppol delivery
  "recipient-not-found": "Recipient not found on the Peppol network",
  "recipient-not-registered":
    "Recipient is not registered on the Peppol network",
  "document-rejected": "Document was rejected by the recipient",
  "validation-error": "Invoice data did not pass validation",
  "schema-error": "Invoice format is not valid",
  // Registration
  "already-registered": "This company is already registered",
  "approval-rejected": "Verification documents were rejected",
  "approval-timeout": "Verification timed out, please try again",
};

/**
 * Convert an Invopop fault to a user-friendly message.
 * Checks `code` against known mappings first, then falls back
 * to the raw `message`, then `code`, then a generic fallback.
 */
export function friendlyFaultMessage(
  fault: { code?: string; message?: string } | undefined | null,
): string {
  if (!fault) return "Unknown error";
  const mapped = fault.code ? FAULT_MESSAGES[fault.code] : undefined;
  if (mapped) return mapped;
  return fault.message ?? fault.code ?? "Unknown error";
}
