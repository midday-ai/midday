import crypto from "node:crypto";
import * as jose from "jose";

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
 * The token expires after 7 days.
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
    .setExpirationTime("7d")
    .sign(secretKey);
  return token;
}

/**
 * Verifies a file key JWT token and extracts the teamId.
 * @param token The JWT token to verify
 * @returns The teamId if valid, null if invalid
 */
export async function verifyFileKey(token: string): Promise<string | null> {
  try {
    const secret = process.env.FILE_KEY_SECRET;
    if (!secret) {
      return null;
    }
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return (payload.teamId as string) || null;
  } catch {
    return null;
  }
}
