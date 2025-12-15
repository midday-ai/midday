import { decrypt, encrypt } from "@midday/encryption";
import type { AccountingProviderId } from "./types";

/**
 * OAuth state payload for accounting providers
 */
export interface AccountingOAuthStatePayload {
  teamId: string;
  userId: string;
  provider: AccountingProviderId;
  source: "apps" | "settings";
}

/**
 * Encrypts OAuth state to prevent tampering.
 * The state contains sensitive info like teamId that must be protected.
 */
export function encryptAccountingOAuthState(
  payload: AccountingOAuthStatePayload
): string {
  return encrypt(JSON.stringify(payload));
}

/**
 * Decrypts and validates OAuth state from callback.
 * Returns null if state is invalid or tampered with.
 */
export function decryptAccountingOAuthState(
  encryptedState: string
): AccountingOAuthStatePayload | null {
  try {
    const decrypted = decrypt(encryptedState);
    const parsed = JSON.parse(decrypted);

    // Validate required fields
    if (
      typeof parsed.teamId !== "string" ||
      typeof parsed.userId !== "string" ||
      !["xero", "quickbooks", "fortnox", "visma"].includes(parsed.provider) ||
      !["apps", "settings"].includes(parsed.source)
    ) {
      return null;
    }

    return parsed as AccountingOAuthStatePayload;
  } catch {
    return null;
  }
}

