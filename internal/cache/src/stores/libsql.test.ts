import fs from "node:fs";
import { createClient } from "@libsql/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { LibSQLStore } from "./libsql";

describe("LibsqlStore", () => {
  const dbFile = "test.db";
  let store: LibSQLStore<string, { name: string }>;

  beforeEach(async () => {
    const client = createClient({
      url: `file:${dbFile}`,
    });
    store = new LibSQLStore({ client });

    await client.execute(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        freshUntil INTEGER NOT NULL,
        staleUntil INTEGER NOT NULL
      )
    `);
  });

  afterEach(async () => {
    fs.unlinkSync(dbFile);
  });

  test("should store and retrieve value from the cache", async () => {
    const namespace = "test";
    const key = "testKey";
    const entry = {
      value: { name: "Test Name" },
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 2000000,
    };

    await store.set(namespace, key, entry);
    const result = await store.get(namespace, key);

    expect(result.val).toEqual(entry);
  });

  test("should return undefined if key does not exist in cache", async () => {
    const result = await store.get("test", "nonexistentKey");
    expect(result.val).toBeUndefined();
  });

  test("should remove value from cache", async () => {
    const namespace = "test";
    const key = "removeKey";
    const entry = {
      value: { name: "Remove Me" },
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 2000000,
    };

    await store.set(namespace, key, entry);
    await store.remove(namespace, key);

    const result = await store.get(namespace, key);
    expect(result.val).toBeUndefined();
  });
});
