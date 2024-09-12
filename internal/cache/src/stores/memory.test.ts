import { beforeEach, describe, expect, test } from "vitest";

import { MemoryStore } from "./memory";

describe("MemoryStore", () => {
  let memoryStore: MemoryStore<string, { name: string }>;

  beforeEach(() => {
    memoryStore = new MemoryStore({ persistentMap: new Map() });
  });

  test("should store value in the cache", async () => {
    const namespace = "namespace";
    const key = "key";
    const entry = {
      value: { name: "name" },
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    };
    await memoryStore.set(namespace, key, entry);
    expect(await memoryStore.get(namespace, key)).toEqual({ val: entry });
  });

  test("should return undefined if key does not exist in cache", async () => {
    expect(await memoryStore.get("name", "doesnotexist")).toEqual({
      val: undefined,
    });
  });

  test("should remove value from cache", async () => {
    memoryStore.set("name", "key", {
      value: { name: "name" },
      freshUntil: Date.now() + 10000000,
      staleUntil: Date.now() + 12312412512515,
    });
    memoryStore.remove("name", "key");
    expect(await memoryStore.get("name", "key")).toEqual({ val: undefined });
  });
});
