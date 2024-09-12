import type { Result } from "@internal/error";

import type { CacheError } from "./errors";

interface CacheNamespace<TValue> {
  /**
   * Return the cached value
   *
   * The response will be `undefined` for cache misses or `null` when the key was not found in the origin
   *
   */
  get: (key: string) => Promise<Result<TValue | undefined, CacheError>>;

  /**
   * Sets the value for the given key.
   */
  set: (
    key: string,
    value: TValue,
    opts?: {
      fresh: number;
      stale: number;
    },
  ) => Promise<Result<void, CacheError>>;

  /**
   * Removes one or multiple keys from the cache.
   */
  remove: (key: string | string[]) => Promise<Result<void, CacheError>>;

  /**
   * Pull through cache
   */
  swr(
    key: string,
    refreshFromOrigin: (key: string) => Promise<TValue | undefined>,
  ): Promise<Result<TValue | undefined, CacheError>>;
}

export type Cache<TNamespaces extends Record<string, unknown>> = {
  [TName in keyof TNamespaces]: CacheNamespace<TNamespaces[TName]>;
};
