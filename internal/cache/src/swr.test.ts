import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, test } from "vitest";

import { DefaultStatefulContext } from "./context";
import { MemoryStore } from "./stores";
import { SwrCache } from "./swr";

const fresh = 1000;
const stale = 2000;
const namespace = "namespace";
const key = "key";
const value = randomUUID();

let cache: SwrCache<string, string>;

beforeEach(() => {
  const memoryStore = new MemoryStore({ persistentMap: new Map() });
  cache = new SwrCache(new DefaultStatefulContext(), memoryStore, fresh, stale);
});

test("should store value in the cache", async () => {
  await cache.set(namespace, key, value);
  expect(await cache.get(namespace, key)).toEqual({ val: value });
});

test("should return undefined if key does not exist in cache", async () => {
  expect(await cache.get(namespace, "doesnotexist")).toEqual({
    val: undefined,
  });
});

test("should remove value from cache", async () => {
  await cache.set(namespace, key, value);
  await cache.remove(namespace, key);
  expect(await cache.get(namespace, key)).toEqual({ val: undefined });
});

test("evicts outdated data", async () => {
  await cache.set(namespace, key, value);
  await new Promise((r) => setTimeout(r, 3000));
  const res = await cache.get(namespace, key);
  expect(res).toEqual({ val: undefined });
});

test("returns stale data", async () => {
  await cache.set(namespace, key, value);
  await new Promise((r) => setTimeout(r, 1500));
  const res = await cache.get(namespace, key);
  expect(res).toEqual({ val: value });
});

describe("with fresh data", () => {
  test("does not fetch from origin", async () => {
    await cache.set(namespace, key, value);
    await new Promise((r) => setTimeout(r, 500));

    let fetchedFromOrigin = false;
    const stale = await cache.swr(namespace, key, () => {
      fetchedFromOrigin = true;
      return Promise.resolve("fresh_data");
    });
    expect(stale).toEqual({ val: value });

    await new Promise((r) => setTimeout(r, 500));
    const res = await cache.get(namespace, key);
    expect(res).toEqual({ val: value });
    expect(fetchedFromOrigin).toBe(false);
  });
});

describe("with stale data", () => {
  test("fetches from origin", async () => {
    await cache.set(namespace, key, value);
    await new Promise((r) => setTimeout(r, 1500));
    const stale = await cache.swr(namespace, key, () =>
      Promise.resolve("fresh_data"),
    );
    expect(stale).toEqual({ val: value });

    await new Promise((r) => setTimeout(r, 1500));
    const res = await cache.get(namespace, key);
    expect(res).toEqual({ val: "fresh_data" });
  });
});
