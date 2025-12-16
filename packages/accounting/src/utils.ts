import { decrypt, encrypt } from "@midday/encryption";
import type { AccountingProviderId } from "./types";

// ============================================================================
// OAuth State Utilities
// ============================================================================

/**
 * OAuth state payload for accounting providers
 * Contains information needed to complete the OAuth flow securely
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
 *
 * @param payload - The OAuth state data to encrypt
 * @returns Encrypted state string safe for URL parameters
 */
export function encryptAccountingOAuthState(
  payload: AccountingOAuthStatePayload,
): string {
  return encrypt(JSON.stringify(payload));
}

/**
 * Decrypts and validates OAuth state from callback.
 * Returns null if state is invalid or tampered with.
 *
 * @param encryptedState - The encrypted state from the OAuth callback
 * @returns Decrypted payload or null if invalid
 */
export function decryptAccountingOAuthState(
  encryptedState: string,
): AccountingOAuthStatePayload | null {
  try {
    const decrypted = decrypt(encryptedState);
    const parsed = JSON.parse(decrypted);

    // Validate required fields
    // Note: Only currently implemented providers are allowed for OAuth
    if (
      typeof parsed.teamId !== "string" ||
      typeof parsed.userId !== "string" ||
      !["xero", "quickbooks", "fortnox"].includes(parsed.provider) ||
      !["apps", "settings"].includes(parsed.source)
    ) {
      return null;
    }

    return parsed as AccountingOAuthStatePayload;
  } catch {
    return null;
  }
}

// ============================================================================
// Stream/Buffer Utilities
// ============================================================================

/**
 * Converts a ReadableStream or Buffer to a Buffer.
 * Used for processing attachment content before uploading to providers.
 *
 * @param content - The content to convert (Buffer or ReadableStream)
 * @returns A Buffer containing the content
 */
export async function streamToBuffer(
  content: Buffer | ReadableStream,
): Promise<Buffer> {
  if (Buffer.isBuffer(content)) {
    return content;
  }

  const chunks: Uint8Array[] = [];
  const reader = content.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks);
}
