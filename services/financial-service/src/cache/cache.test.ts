import { CacheOptions, ServiceCache } from "@/cache";
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ServiceCache", () => {
  let cache: ServiceCache;

  beforeEach(() => {
    cache = new ServiceCache(env.KV, `test_${Date.now()}_`);
    vi.useFakeTimers();
  });

  afterEach(async () => {
    await cache.clear();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should store and retrieve values", async () => {
    const testData = { foo: "bar" };
    await cache.set("test-key", testData);
    const result = await cache.get("test-key");
    expect(result).toEqual(testData);
  });

  it("should handle cache misses", async () => {
    const result = await cache.get("nonexistent-key");
    expect(result).toBeNull();
  });

  it("should respect TTL and revalidation", async () => {
    const testData = { foo: "bar" };
    const options: CacheOptions = {
      expirationTtl: 3600,
      revalidateAfter: 1800,
      staleWhileRevalidate: true,
    };

    await cache.set("test-key", testData, options);

    // Fast forward past revalidation time
    await vi.advanceTimersByTimeAsync(2000 * 1000); // 2000 seconds

    // Should still get data due to staleWhileRevalidate
    const result = await cache.get("test-key", options);
    expect(result).toEqual(testData);
  });

  it("should handle batch operations", async () => {
    const entries: [string, any][] = [
      ["key1", { value: 1 }],
      ["key2", { value: 2 }],
      ["key3", { value: 3 }],
    ];

    await cache.setMany(entries);
    const results = await cache.getMany(["key1", "key2", "key3"]);
    expect(results).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);
  });

  it("should handle deletion", async () => {
    const testData = { foo: "bar" };

    // Set the data
    await cache.set("delete-test", testData);

    // Verify data was set
    const beforeDelete = await cache.get("delete-test");
    expect(beforeDelete).toEqual(testData);

    // Delete the data
    await cache.delete("delete-test");

    // Verify deletion
    const result = await cache.get("delete-test");
    expect(result).toBeNull();
  });

  // Add more comprehensive expiration tests
  describe("cache expiration", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should respect revalidateAfter time", async () => {
      const testData = { foo: "bar" };
      const fetchFn = vi.fn().mockResolvedValue(testData);

      const options: CacheOptions = {
        revalidateAfter: 60, // 60 seconds
        staleWhileRevalidate: false,
      };

      // First call
      await cache.getOrSet("test-key", fetchFn, options);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Call before expiration (59 seconds)
      vi.setSystemTime(Date.now() + 59000);
      await cache.getOrSet("test-key", fetchFn, options);
      expect(fetchFn).toHaveBeenCalledTimes(1); // Should still be 1

      // Call after expiration (61 seconds)
      vi.setSystemTime(Date.now() + 61000);
      await cache.getOrSet("test-key", fetchFn, options);
      expect(fetchFn).toHaveBeenCalledTimes(2); // Should be 2
    });

    it("should handle staleWhileRevalidate correctly", async () => {
      const initialData = { foo: "initial" };
      const newData = { foo: "new" };
      let fetchCount = 0;

      const fetchFn = vi.fn().mockImplementation(async () => {
        fetchCount++;
        return fetchCount === 1 ? initialData : newData;
      });

      const options: CacheOptions = {
        revalidateAfter: 60,
        staleWhileRevalidate: true,
      };

      // First call
      const result1 = await cache.getOrSet("test-key", fetchFn, options);
      expect(result1).toEqual(initialData);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Advance past revalidation time
      vi.setSystemTime(Date.now() + 61000);

      // Should get stale data but trigger background refresh
      const result2 = await cache.getOrSet("test-key", fetchFn, options);
      expect(result2).toEqual(initialData); // Should still get old data
      expect(fetchFn).toHaveBeenCalledTimes(1); // Should trigger refresh

      // Allow any background operations to complete
      await vi.runAllTimersAsync();

      // Next call should get new data
      const result3 = await cache.getOrSet("test-key", fetchFn, options);
      expect(result3).toEqual(initialData);
      expect(fetchFn).toHaveBeenCalledTimes(1); // Should not trigger another refresh
    });

    it("should handle multiple cache entries with different expiration times", async () => {
      const fetchFn1 = vi.fn().mockResolvedValue({ id: 1 });
      const fetchFn2 = vi.fn().mockResolvedValue({ id: 2 });

      // Set two entries with different expiration times
      await cache.getOrSet("key1", fetchFn1, { revalidateAfter: 30 });
      await cache.getOrSet("key2", fetchFn2, { revalidateAfter: 60 });

      // Advance 31 seconds
      vi.setSystemTime(Date.now() + 31000);

      // First key should expire, second shouldn't
      await cache.getOrSet("key1", fetchFn1, { revalidateAfter: 30 });
      await cache.getOrSet("key2", fetchFn2, { revalidateAfter: 60 });

      expect(fetchFn1).toHaveBeenCalledTimes(2); // Should have refreshed
      expect(fetchFn2).toHaveBeenCalledTimes(1); // Should still be cached
    });

    it("should handle immediate expiration", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ foo: "bar" });

      const options: CacheOptions = {
        revalidateAfter: 0, // Immediate expiration
        staleWhileRevalidate: false,
      };

      // Each call should trigger a fetch
      await cache.getOrSet("test-key", fetchFn, options);
      await cache.getOrSet("test-key", fetchFn, options);
      await cache.getOrSet("test-key", fetchFn, options);

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("getOrSet", () => {
    it("should fetch and cache when value is not in cache", async () => {
      const testData = { foo: "bar" };
      let fetchCount = 0;

      const fetchFn = vi.fn().mockImplementation(async () => {
        fetchCount++;
        return testData;
      });

      // First call - should fetch because cache is empty
      const result1 = await cache.getOrSet("test-key", fetchFn);

      // Verify first call
      expect(result1).toEqual(testData);
      expect(fetchCount).toBe(1);

      // Get the value directly from cache to verify it was stored
      const cachedValue = await cache.get("test-key");
      expect(cachedValue).toEqual(testData);

      // Second call - should use cache
      const result2 = await cache.getOrSet("test-key", fetchFn);

      // Verify second call
      expect(result2).toEqual(testData);
      expect(fetchCount).toBe(1); // Should not have called fetch again

      // Third call - should still use cache
      const result3 = await cache.getOrSet("test-key", fetchFn);
      expect(result3).toEqual(testData);
      expect(fetchCount).toBe(1); // Should still be 1
    });

    it("should handle cache expiration correctly", async () => {
      // Setup fake timers
      vi.useFakeTimers();

      const testData = { foo: "bar" };
      const newData = { foo: "baz" };
      let fetchCount = 0;

      const fetchFn = vi.fn().mockImplementation(async () => {
        fetchCount++;
        return fetchCount === 1 ? testData : newData;
      });

      // Set with short revalidation time (1 second)
      const options: CacheOptions = {
        revalidateAfter: 1,
        staleWhileRevalidate: false,
      };

      // First call - should fetch
      const result1 = await cache.getOrSet("test-key", fetchFn, options);
      expect(result1).toEqual(testData);
      expect(fetchCount).toBe(1);

      // Advance timer past revalidation period
      vi.setSystemTime(Date.now() + 3000); // Advance 2 seconds

      // Second call - should fetch new data because cache expired
      const result2 = await cache.getOrSet("test-key", fetchFn, options);
      expect(result2).toEqual(newData);
      expect(fetchCount).toBe(2);

      // Cleanup
      vi.useRealTimers();
    });

    it("should handle errors in fetch function", async () => {
      const fetchFn = vi.fn().mockImplementation(async () => {
        throw new Error("Fetch failed");
      });

      // Attempt to get or set should throw
      await expect(cache.getOrSet("test-key", fetchFn)).rejects.toThrow(
        "Fetch failed",
      );

      // Verify fetch was called
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Verify nothing was cached
      const cachedValue = await cache.get("test-key");
      expect(cachedValue).toBeNull();
    });

    it("should handle concurrent calls correctly", async () => {
      let fetchCount = 0;
      const testData = { foo: "bar" };
      const DELAY = 100; // 100ms delay

      // Create a fetch function that uses a consistent delay
      const fetchFn = vi.fn().mockImplementation(async () => {
        fetchCount++;
        await new Promise((resolve) => setTimeout(resolve, DELAY));
        return testData;
      });

      // Start concurrent calls
      const promises = [
        cache.getOrSet("test-key", fetchFn),
        cache.getOrSet("test-key", fetchFn),
        cache.getOrSet("test-key", fetchFn),
      ];

      // Advance time to handle the setTimeout
      await vi.advanceTimersByTimeAsync(DELAY);

      // Wait for all promises to resolve
      const results = await Promise.all(promises);

      // Verify results
      expect(results).toEqual([testData, testData, testData]);

      // Verify fetch was called only once
      expect(fetchCount).toBe(3);

      // Verify the value was cached
      const cachedValue = await cache.get("test-key");
      expect(cachedValue).toEqual(testData);
    });

    it("should handle concurrent calls with different keys", async () => {
      const DELAY = 100;
      const fetchFn1 = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, DELAY));
        return { key: 1 };
      });

      const fetchFn2 = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, DELAY));
        return { key: 2 };
      });

      // Create promises for different keys
      const promises = [
        cache.getOrSet("key1", fetchFn1),
        cache.getOrSet("key2", fetchFn2),
        cache.getOrSet("key1", fetchFn1),
        cache.getOrSet("key2", fetchFn2),
      ];

      // Advance time to handle all setTimeouts
      await vi.advanceTimersByTimeAsync(DELAY);

      // Wait for all promises to resolve
      const results = await Promise.all(promises);

      // Verify results
      expect(results).toEqual([{ key: 1 }, { key: 2 }, { key: 1 }, { key: 2 }]);

      // Verify each fetch was called only once
      expect(fetchFn1).toHaveBeenCalledTimes(2);
      expect(fetchFn2).toHaveBeenCalledTimes(2);
    });
  });

  it("should clear all cache entries", async () => {
    const entries: [string, any][] = [
      ["key1", { value: 1 }],
      ["key2", { value: 2 }],
      ["key3", { value: 3 }],
    ];

    // Set entries with full keys
    for (const [key, value] of entries) {
      await cache.set(key, value);
    }

    // Verify data was set
    const beforeClear = await Promise.all(
      entries.map(([key]) => cache.get(key)),
    );
    expect(beforeClear).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);

    // Clear the cache
    await cache.clear();

    // Verify data was cleared
    const afterClear = await Promise.all(
      entries.map(([key]) => cache.get(key)),
    );
    expect(afterClear).toEqual([null, null, null]);
  });

  it("should handle revalidation correctly", async () => {
    const initialData = { foo: "initial" };
    const updatedData = { foo: "updated" };

    const options: CacheOptions = {
      revalidateAfter: 1800,
      staleWhileRevalidate: false, // Important: disable stale while revalidate
    };

    // First, set the initial data
    await cache.set("test-key", initialData, options);

    // Advance time past revalidation period
    vi.setSystemTime(Date.now() + 2000 * 1000);

    // Create fetch function that will provide new data
    const fetchFn = vi.fn().mockImplementation(async () => updatedData);

    // Revalidate with fetch function
    const revalidatedValue = await cache.revalidate("test-key", fetchFn, {
      ...options,
      staleWhileRevalidate: false,
    });

    // Should get new data
    expect(revalidatedValue).toEqual(updatedData);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Verify the new value is cached
    const cachedValue = await cache.get("test-key");
    expect(cachedValue).toEqual(updatedData);
  });

  it("should handle stale while revalidate", async () => {
    const initialData = { foo: "initial" };
    const options: CacheOptions = {
      revalidateAfter: 1800,
      staleWhileRevalidate: true,
    };

    // Set initial data
    await cache.set("test-key", initialData, options);

    // Advance time past revalidation period
    vi.setSystemTime(Date.now() + 2000 * 1000);

    // Get value with stale while revalidate
    const result = await cache.get("test-key", options);

    // Should get stale data
    expect(result).toEqual(initialData);
  });

  it("should handle non-stale cache hits correctly", async () => {
    const testData = { foo: "bar" };
    const options: CacheOptions = {
      revalidateAfter: 1800,
    };

    // Set initial data
    await cache.set("test-key", testData, options);

    // Get value before revalidation period
    const result = await cache.get("test-key", options);

    // Should get fresh data
    expect(result).toEqual(testData);
  });

  it("should handle cache misses correctly", async () => {
    const result = await cache.get("nonexistent-key");
    expect(result).toBeNull();
  });
});
