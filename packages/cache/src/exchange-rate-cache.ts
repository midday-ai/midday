import { RedisCache } from "./redis-client";

// Rates update at most once/day — 4 hour TTL is safe and reduces DB hits
const cache = new RedisCache("fx", 4 * 60 * 60);

/**
 * Caches all exchange rates for a given target currency as a single key.
 * This matches the real access pattern: "convert N currencies → 1 base currency".
 * One Redis GET/SET instead of N, and one DB query on miss.
 */
export const exchangeRateCache = {
  getRatesForTarget: async (
    target: string,
  ): Promise<Record<string, number> | undefined> => {
    return cache.get<Record<string, number>>(target);
  },

  setRatesForTarget: async (
    target: string,
    rates: Record<string, number>,
  ): Promise<void> => {
    await cache.set(target, rates);
  },
};
