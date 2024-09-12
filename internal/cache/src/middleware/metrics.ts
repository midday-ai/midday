import type { Result } from "@solomon-ai/error";

import type { CacheError } from "../errors";
import type { Metrics } from "../metrics";
import type { Entry, Store } from "../stores";
import type { StoreMiddleware } from "./interface";

type Metric =
  | {
      metric: "metric.cache.read";
      key: string;
      hit: boolean;
      status?: "fresh" | "stale";
      latency: number;
      tier: string;
      namespace: string;
    }
  | {
      metric: "metric.cache.write";
      key: string;
      latency: number;
      tier: string;
      namespace: string;
    }
  | {
      metric: "metric.cache.remove";
      key: string;
      latency: number;
      tier: string;
      namespace: string;
    };

export function withMetrics(
  metrics: Metrics<Metric>,
): StoreMiddleware<any, any> {
  function wrap<TNamespace extends string, TValue>(
    store: Store<TNamespace, TValue>,
  ): Store<TNamespace, TValue> {
    return new StoreWithMetrics({ store, metrics });
  }
  return { wrap };
}

class StoreWithMetrics<TNamespace extends string, TValue>
  implements Store<TNamespace, TValue>
{
  public name: string;
  private readonly store: Store<TNamespace, TValue>;

  private readonly metrics: Metrics;

  constructor(opts: { store: Store<TNamespace, TValue>; metrics: Metrics }) {
    this.name = opts.store.name;
    this.store = opts.store;
    this.metrics = opts.metrics;
  }

  public async get(
    namespace: TNamespace,
    key: string,
  ): Promise<Result<Entry<TValue> | undefined, CacheError>> {
    const start = performance.now();
    const res = await this.store.get(namespace, key);

    const now = Date.now();

    this.metrics.emit({
      metric: "metric.cache.read",
      hit: typeof res.val !== "undefined",
      status: res.val
        ? now <= res.val.freshUntil
          ? "fresh"
          : now <= res.val.staleUntil
            ? "stale"
            : undefined
        : undefined,
      latency: Math.round(performance.now() - start),
      tier: this.store.name,
      key,
      namespace,
    });

    return res;
  }

  public async set(
    namespace: TNamespace,
    key: string,
    value: Entry<TValue>,
  ): Promise<Result<void, CacheError>> {
    const start = performance.now();

    const res = await this.store.set(namespace, key, value);
    this.metrics.emit({
      metric: "metric.cache.write",
      latency: Math.round(performance.now() - start),
      tier: this.store.name,
      key,
      namespace,
    });
    return res;
  }

  public async remove(
    namespace: TNamespace,
    key: string,
  ): Promise<Result<void, CacheError>> {
    const start = performance.now();
    const res = this.store.remove(namespace, key);
    this.metrics.emit({
      metric: "metric.cache.remove",
      tier: this.store.name,
      latency: Math.round(performance.now() - start),
      key,
      namespace,
    });
    return res;
  }
}
