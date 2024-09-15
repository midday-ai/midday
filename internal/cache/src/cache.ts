import type { Cache } from "./interface";
import type { Namespace } from "./namespace";

export function createCache<
  TNamespaces extends Record<string, unknown>,
  TNamespace extends keyof TNamespaces = keyof TNamespaces,
>(
  namespaces: {
    [TName in keyof TNamespaces]: Namespace<TNamespaces[TName]>;
  },
): Cache<TNamespaces> {
  return Object.entries(namespaces).reduce(
    (acc, [n, c]) => {
      acc[n as TNamespace] = {
        get: (key) => c.get(n, key),
        set: (key, value, opts) => c.set(n, key, value, opts),
        remove: (key) => c.remove(n, key),
        swr: (key, loadFromOrigin) => c.swr(n, key, loadFromOrigin),
      };
      return acc;
    },
    {} as Cache<TNamespaces>,
  );
}
