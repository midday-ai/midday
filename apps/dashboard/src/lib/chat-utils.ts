import type { UIMessage } from "ai";

/**
 * Check if message parts indicate bank account is required
 */
export function extractBankAccountRequired(parts: UIMessage["parts"]): boolean {
  for (const part of parts) {
    if ((part.type as string).startsWith("tool-")) {
      const toolPart = part as Record<string, unknown>;
      const errorText = toolPart.errorText as string | undefined;

      if (errorText === "BANK_ACCOUNT_REQUIRED") {
        return true;
      }
    }
  }
  return false;
}
