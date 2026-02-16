import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison that is safe against timing attacks.
 * Compares byte lengths (not character lengths) before calling timingSafeEqual
 * to avoid RangeError when inputs contain multi-byte UTF-8 characters.
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
