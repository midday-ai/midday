import { decrypt, encrypt } from "@midday/encryption";
import type { AccountingProviderId } from "./types";

// ============================================================================
// URL-Safe Base64 Utilities
// ============================================================================

/**
 * Converts standard base64 to URL-safe base64.
 * Replaces + with -, / with _, and removes = padding.
 * This is necessary because some OAuth providers (like Fortnox) don't properly
 * encode + characters in query strings, which corrupts standard base64.
 */
function toUrlSafeBase64(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Converts URL-safe base64 back to standard base64.
 * Replaces - with +, _ with /, and adds = padding.
 */
function fromUrlSafeBase64(urlSafeBase64: string): string {
  let base64 = urlSafeBase64.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return base64;
}

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
 * Uses URL-safe base64 encoding to prevent issues with + characters in URLs.
 *
 * @param payload - The OAuth state data to encrypt
 * @returns Encrypted state string safe for URL parameters
 */
export function encryptAccountingOAuthState(
  payload: AccountingOAuthStatePayload,
): string {
  const encrypted = encrypt(JSON.stringify(payload));
  // Convert to URL-safe base64 to prevent issues with + characters
  return toUrlSafeBase64(encrypted);
}

/**
 * Decrypts and validates OAuth state from callback.
 * Returns null if state is invalid or tampered with.
 * Handles both URL-safe and standard base64 for backwards compatibility.
 *
 * @param encryptedState - The encrypted state from the OAuth callback
 * @returns Decrypted payload or null if invalid
 */
export function decryptAccountingOAuthState(
  encryptedState: string,
): AccountingOAuthStatePayload | null {
  try {
    // Convert from URL-safe base64 back to standard base64
    const standardBase64 = fromUrlSafeBase64(encryptedState);
    const decrypted = decrypt(standardBase64);
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
