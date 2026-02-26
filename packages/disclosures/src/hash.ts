import { createHash } from "node:crypto";

/**
 * Generate a SHA-256 hash of a buffer (e.g., a generated PDF).
 * Used for the immutable audit trail on disclosure documents.
 */
export function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Generate a SHA-256 hash of a string (e.g., JSON figures snapshot).
 */
export function hashString(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}
