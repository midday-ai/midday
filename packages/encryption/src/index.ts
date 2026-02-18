import crypto from "node:crypto";
import * as jose from "jose";

// ============================================================================
// URL-Safe Base64 Utilities
// ============================================================================

/**
 * Converts standard base64 to URL-safe base64.
 * Replaces + with -, / with _, and removes = padding.
 * This is necessary because some OAuth providers don't properly
 * encode + characters in query strings, which corrupts standard base64.
 *
 * @param base64 - Standard base64 encoded string
 * @returns URL-safe base64 string
 */
export function toUrlSafeBase64(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Converts URL-safe base64 back to standard base64.
 * Replaces - with +, _ with /, and adds = padding.
 *
 * @param urlSafeBase64 - URL-safe base64 string
 * @returns Standard base64 string
 */
export function fromUrlSafeBase64(urlSafeBase64: string): string {
  let base64 = urlSafeBase64.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return base64;
}

/**
 * Encrypts an OAuth state payload for use in URL parameters.
 * Uses AES-256-GCM encryption with URL-safe base64 encoding.
 *
 * @param payload - The state object to encrypt (must be JSON-serializable)
 * @returns Encrypted, URL-safe string
 *
 * @example
 * const state = encryptOAuthState({ teamId: "123", userId: "456", source: "settings" });
 * // Use in OAuth redirect URL: `?state=${state}`
 */
export function encryptOAuthState<T>(payload: T): string {
  const encrypted = encrypt(JSON.stringify(payload));
  return toUrlSafeBase64(encrypted);
}

/**
 * Decrypts and validates an OAuth state from a callback URL.
 * Returns null if decryption fails or validation doesn't pass.
 *
 * @param encryptedState - The encrypted state string from the OAuth callback
 * @param validate - Optional validation function to verify the payload structure
 * @returns The decrypted payload, or null if invalid
 *
 * @example
 * const state = decryptOAuthState(params.state, (parsed) =>
 *   typeof parsed.teamId === "string" && typeof parsed.userId === "string"
 * );
 */
export function decryptOAuthState<T>(
  encryptedState: string,
  validate?: (parsed: unknown) => parsed is T,
): T | null {
  try {
    const standardBase64 = fromUrlSafeBase64(encryptedState);
    const decrypted = decrypt(standardBase64);
    const parsed = JSON.parse(decrypted);

    if (validate && !validate(parsed)) {
      return null;
    }

    return parsed as T;
  } catch {
    return null;
  }
}

// ============================================================================
// Encryption Utilities
// ============================================================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.MIDDAY_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("MIDDAY_ENCRYPTION_KEY environment variable is not set.");
  }
  if (Buffer.from(key, "hex").length !== 32) {
    throw new Error(
      "MIDDAY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).",
    );
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @returns A string containing the IV, auth tag, and encrypted text, concatenated and base64 encoded.
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Concatenate IV, auth tag, and encrypted data
  const encryptedPayload = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]).toString("base64");

  return encryptedPayload;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * @param encryptedPayload The base64 encoded string containing the IV, auth tag, and encrypted text.
 * @returns The original plaintext string.
 */
export function decrypt(encryptedPayload: string): string {
  const key = getKey();

  if (!encryptedPayload || typeof encryptedPayload !== "string") {
    throw new Error("Invalid encrypted payload: must be a non-empty string");
  }

  const dataBuffer = Buffer.from(encryptedPayload, "base64");
  const minLength = IV_LENGTH + AUTH_TAG_LENGTH;

  if (dataBuffer.length < minLength) {
    throw new Error(
      `Invalid encrypted payload: too short. Expected at least ${minLength} bytes, got ${dataBuffer.length}`,
    );
  }

  // Extract IV, auth tag, and encrypted data
  const iv = dataBuffer.subarray(0, IV_LENGTH);
  const authTag = dataBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encryptedText = dataBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(
      `Invalid auth tag length: expected ${AUTH_TAG_LENGTH} bytes, got ${authTag.length}`,
    );
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function hash(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * Generates a compact JWT file key for a team.
 * This key is used for proxy/download access to team files.
 * The token expires after 30 days. A grace period in verification
 * allows recently-expired tokens to still be accepted.
 * @param teamId The team ID to generate the key for
 * @returns A compact JWT token containing the teamId
 */
export async function generateFileKey(teamId: string): Promise<string> {
  const secret = process.env.FILE_KEY_SECRET;
  if (!secret) {
    throw new Error("FILE_KEY_SECRET environment variable is not set.");
  }
  const secretKey = new TextEncoder().encode(secret);
  const token = await new jose.SignJWT({ teamId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secretKey);
  return token;
}

/**
 * Verifies a file key JWT token and extracts the teamId.
 * Accepts tokens up to 7 days past their expiry to handle
 * edge cases where cached keys haven't been refreshed yet.
 * @param token The JWT token to verify
 * @returns The teamId if valid, null if invalid/expired beyond grace period
 */
export async function verifyFileKey(token: string): Promise<string | null> {
  try {
    const secret = process.env.FILE_KEY_SECRET;
    if (!secret) {
      return null;
    }
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey, {
      clockTolerance: 7 * 24 * 60 * 60,
    });
    return (payload.teamId as string) || null;
  } catch {
    return null;
  }
}
