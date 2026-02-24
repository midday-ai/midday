import type { Database } from "../client";

/**
 * Creates an in-flight promise deduplication wrapper for database query functions.
 *
 * When multiple concurrent requests call the same query with identical parameters,
 * only the first call executes the actual query — subsequent callers receive the
 * same promise. The cached promise is removed as soon as it settles, so this is
 * purely for in-flight dedup, not a cache.
 *
 * Promises are scoped per `db` instance (via WeakMap) so that primary and replica
 * connections never share results. This preserves read-after-write consistency
 * when `withPrimaryReadAfterWrite` middleware swaps the db instance.
 *
 * @example
 * ```ts
 * const getRevenue = dedupeByDb(
 *   (params: GetReportsParams) =>
 *     `${params.teamId}:${params.from}:${params.to}`,
 *   getRevenueImpl,
 * );
 *
 * // Both calls resolve to the same promise (single DB round-trip)
 * const [a, b] = await Promise.all([
 *   getRevenue(db, params),
 *   getRevenue(db, params),
 * ]);
 * ```
 */
export function dedupeByDb<TParams, TResult>(
  keyFn: (params: TParams) => string,
  queryFn: (db: Database, params: TParams) => Promise<TResult>,
): (db: Database, params: TParams) => Promise<TResult> {
  const inflight = new WeakMap<Database, Map<string, Promise<TResult>>>();

  return (db: Database, params: TParams): Promise<TResult> => {
    const key = keyFn(params);

    let byDb = inflight.get(db);
    if (!byDb) {
      byDb = new Map();
      inflight.set(db, byDb);
    }

    const existing = byDb.get(key);
    if (existing) return existing;

    const promise = queryFn(db, params).finally(() => {
      byDb.delete(key);
    });
    byDb.set(key, promise);
    return promise;
  };
}
