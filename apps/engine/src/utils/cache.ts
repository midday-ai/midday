/**
 * Shared caching utilities for bank providers
 */

// Standard cache TTLs (in seconds)
export const CACHE_TTL = {
  ONE_HOUR: 3600,
  FOUR_HOURS: 14400,
} as const;

/**
 * Hash a token to create a safe cache key
 * Uses first 16 hex chars of SHA-256 hash
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Cache wrapper that handles get/set with JSON serialization
 */
export async function withCache<T>(
  kv: KVNamespace,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await kv.get(key);

  if (cached) {
    return JSON.parse(cached) as T;
  }

  const result = await fetcher();

  // Only cache non-null/undefined results
  if (result !== null && result !== undefined) {
    await kv.put(key, JSON.stringify(result), {
      expirationTtl: ttl,
    });
  }

  return result;
}
