import crypto from "node:crypto";

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
  const dataBuffer = Buffer.from(encryptedPayload, "base64");

  // Extract IV, auth tag, and encrypted data
  const iv = dataBuffer.subarray(0, IV_LENGTH);
  const authTag = dataBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encryptedText = dataBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
