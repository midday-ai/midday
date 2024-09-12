import type { Context } from "./context";
import type { Store } from "./stores";
import { SwrCache } from "./swr";
import { TieredStore } from "./tiered";

export class Namespace<TValue> extends SwrCache<string, TValue> {
  constructor(
    ctx: Context,
    opts: {
      stores: Array<Store<string, TValue>>;
      fresh: number;
      stale: number;
    },
  ) {
    const tieredStore = new TieredStore<string, TValue>(ctx, opts.stores);

    super(ctx, tieredStore, opts.fresh, opts.stale);
  }
}
