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
 * Automatically invalidates cache on error to allow fresh retry
 *
 * @param options.skipCache - If true, bypasses cache read but still writes result to cache
 */
export async function withCache<T>(
  kv: KVNamespace | undefined,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  options?: { skipCache?: boolean },
): Promise<T> {
  // If KV is not available, just call the fetcher directly
  if (!kv) {
    return fetcher();
  }

  // Only read from cache if not skipping
  if (!options?.skipCache) {
    const cached = await kv.get(key);

    if (cached) {
      return JSON.parse(cached) as T;
    }
  }

  try {
    const result = await fetcher();

    // Always cache non-null/undefined results (even when skipCache is true)
    if (result !== null && result !== undefined) {
      await kv.put(key, JSON.stringify(result), {
        expirationTtl: ttl,
      });
    }

    return result;
  } catch (error) {
    // Invalidate any stale cache on error so next attempt fetches fresh
    await kv.delete(key);
    throw error;
  }
}
