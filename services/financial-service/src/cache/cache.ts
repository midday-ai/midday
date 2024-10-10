import { withRetry } from '@/utils/retry';
import { Env } from '../env';

/**
 * Options for configuring cache behavior.
 */
export interface CacheOptions {
  /** Time-to-live in seconds for the cached item. */
  expirationTtl?: number;
  /** Time in seconds after which the cached item should be revalidated. */
  revalidateAfter?: number;
  /** Whether to return stale data while revalidating. */
  staleWhileRevalidate?: boolean;
}

/**
 * Structure of a cached value, including metadata.
 */
interface CachedValue<T> {
  /** The actual cached data. */
  value: T;
  /** Timestamp when the item was cached. */
  timestamp: number;
  /** Time in milliseconds after which the item should be revalidated. */
  revalidateAfter: number;
}

/**
 * A cache implementation using Cloudflare Workers KV storage.
 * Provides methods for getting, setting, and managing cached data with various options.
 */
export class ServiceCache {
  private kv: KVNamespace;
  private prefix: string;

  /**
   * Creates a new ServiceCache instance.
   * @param env - The environment object containing the KV namespace.
   * @param prefix - An optional prefix for all cache keys.
   */
  constructor(env: Env, prefix: string = '') {
    this.kv = env.KV as KVNamespace<any>;
    this.prefix = prefix;
  }

  /**
   * Generates a full key by combining the prefix and the provided key.
   * @param key - The original key.
   * @returns The full key with the prefix.
   */
  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Retrieves a value from the cache.
   * @param key - The key of the item to retrieve.
   * @param options - Cache options for this operation.
   * @returns The cached value, or null if not found or expired.
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const cachedData = await this.kv.get<CachedValue<T>>(fullKey, 'json');
    
    if (!cachedData) {
      return null;
    }

    const now = Date.now();
    if (now > cachedData.timestamp + cachedData.revalidateAfter) {
      if (options.staleWhileRevalidate) {
        // Return stale data and trigger revalidation in the background
        this.revalidate(key, async () => cachedData.value, options).catch(console.error);
        return cachedData.value;
      }
      // Data needs revalidation
      return null;
    }

    return cachedData.value;
  }

  /**
   * Stores a value in the cache.
   * @param key - The key under which to store the value.
   * @param value - The value to store.
   * @param options - Cache options for this operation.
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { expirationTtl = 86400, revalidateAfter = 3600 } = options;
    
    const cachedValue: CachedValue<T> = {
      value,
      timestamp: Date.now(),
      revalidateAfter: revalidateAfter * 1000, // Convert to milliseconds
    };

    const fullKey = this.getFullKey(key);
    await withRetry(() => this.kv.put(fullKey, JSON.stringify(cachedValue), { expirationTtl }));
  }

  /**
   * Deletes an item from the cache.
   * @param key - The key of the item to delete.
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);
    await withRetry(() => this.kv.delete(fullKey));
  }

  /**
   * Revalidates a cached item by fetching a new value and updating the cache.
   * @param key - The key of the item to revalidate.
   * @param fetchFn - A function that returns a Promise resolving to the new value.
   * @param options - Cache options for this operation.
   * @returns The new or existing value.
   */
  async revalidate<T>(key: string, fetchFn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const cachedValue = await this.get<T>(key, options);
    
    if (cachedValue !== null && !options.staleWhileRevalidate) {
      return cachedValue;
    }

    const newValue = await fetchFn();
    await this.set(key, newValue, options);
    return newValue;
  }

  /**
   * Retrieves multiple values from the cache.
   * @param keys - An array of keys to retrieve.
   * @returns An array of cached values or null for each key.
   */
  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    const fullKeys = keys.map(this.getFullKey.bind(this));
    const results = await Promise.all(fullKeys.map(key => this.kv.get<CachedValue<T>>(key, 'json')));
    return results.map(result => result ? result.value : null);
  }

  /**
   * Stores multiple key-value pairs in the cache.
   * @param entries - An array of key-value pairs to store.
   * @param options - Cache options for this operation.
   */
  async setMany<T>(entries: [string, T][], options: CacheOptions = {}): Promise<void> {
    const { expirationTtl = 86400, revalidateAfter = 3600 } = options;
    const now = Date.now();

    const setOperations = entries.map(([key, value]) => {
      const cachedValue: CachedValue<T> = {
        value,
        timestamp: now,
        revalidateAfter: revalidateAfter * 1000,
      };
      const fullKey = this.getFullKey(key);
      return withRetry(() => this.kv.put(fullKey, JSON.stringify(cachedValue), { expirationTtl }));
    });

    await Promise.all(setOperations);
  }

  /**
   * Deletes multiple items from the cache.
   * @param keys - An array of keys to delete.
   */
  async deleteMany(keys: string[]): Promise<void> {
    const fullKeys = keys.map(this.getFullKey.bind(this));
    await Promise.all(fullKeys.map(key => withRetry(() => this.kv.delete(key))));
  }

  /**
   * Clears all items from the cache with the current prefix.
   */
  async clear(): Promise<void> {
    let cursor: string | undefined;
    do {
      const result = await this.kv.list({ prefix: this.prefix, cursor });
      if (result.keys.length > 0) {
        const keysToDelete = result.keys.map(key => key.name);
        await this.deleteMany(keysToDelete);
      }
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);
  }

  /**
   * Retrieves a value from the cache, or sets it if not found.
   * @param key - The key of the item to retrieve or set.
   * @param fetchFn - A function that returns a Promise resolving to the value if not found in cache.
   * @param options - Cache options for this operation.
   * @returns The cached or newly fetched value.
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const cachedValue = await this.get<T>(key, options);
    if (cachedValue !== null) {
      return cachedValue;
    }

    const newValue = await fetchFn();
    await this.set(key, newValue, options);
    return newValue;
  }

  /**
   * Scans the cache for items matching a given prefix.
   * @param prefix - The prefix to scan for (in addition to the cache's own prefix).
   * @yields Pairs of [key, value] for each matching item.
   */
  async *scan<T>(prefix: string = ''): AsyncIterableIterator<[string, T]> {
    let cursor: string | undefined;
    const fullPrefix = this.getFullKey(prefix);
    
    do {
      const result = await this.kv.list({ prefix: fullPrefix, cursor });
      for (const { name } of result.keys) {
        const value = await this.kv.get<CachedValue<T>>(name, 'json');
        if (value !== null) {
          const key = name.slice(this.prefix.length);
          yield [key, value.value];
        }
      }
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);
  }
}
