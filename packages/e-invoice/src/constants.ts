/**
 * Default e-invoice provider identifier.
 * Used across the codebase to avoid typos in string literals.
 */
export const E_INVOICE_PROVIDER_PEPPOL = "peppol" as const;

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
