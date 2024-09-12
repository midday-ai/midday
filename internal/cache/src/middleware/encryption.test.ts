import { beforeEach, describe, test } from "vitest";

import type { Store } from "../stores";
import { MemoryStore } from "../stores/memory";
import { EncryptedStore, withEncryption } from "./encryption";

test("encrypts and decrypts", async (t) => {
  const map = new Map();
  const memory: Store<"namespace", string> = new MemoryStore({
    persistentMap: map,
  });

  // generated with `openssl rand -base64 32`
  const encryptionKey = "gVXaB49mnCZILHqXNpZ/cH22TsYoM5QbzjX3Nu15lKo=";
  const encryptionMiddleware = await withEncryption(encryptionKey);
  const store = encryptionMiddleware.wrap(memory);

  const key = "key";
  const value = "value";

  await store.set("namespace", key, {
    value,
    freshUntil: Date.now() + 1000000,
    staleUntil: Date.now() + 100000000,
  });

  const res = await store.get("namespace", key);
  t.expect(res.err).not.toBeDefined();
  t.expect(res.val!.value).toEqual(value);
});

describe("rolling the encryption key", () => {
  test("causes cache misses, not errors", async (t) => {
    const map = new Map();
    const memory: Store<"namespace", string> = new MemoryStore({
      persistentMap: map,
    });

    // generated with `openssl rand -base64 32`
    const encryptionKey = "gVXaB49mnCZILHqXNpZ/cH22TsYoM5QbzjX3Nu15lKo=";
    const store = (await EncryptedStore.fromBase64Key(encryptionKey)).wrap(
      memory,
    );

    const key = "key";
    const value = "value";

    await store.set("namespace", key, {
      value,
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    });

    t.expect(map.size).toBe(1);

    const newEncryptionKey = "Rd1ghtfwkcdlj5Kq2IPdPwWGrCCOBU1q9W+8ipYo3P8=";
    const newStore = (
      await EncryptedStore.fromBase64Key(newEncryptionKey)
    ).wrap(memory);

    // should miss the cache as the key has changed
    const res = await newStore.get("namespace", key);
    t.expect(res.err).not.toBeDefined();
    t.expect(res.val).not.toBeDefined();

    await newStore.set("namespace", key, {
      value,
      freshUntil: Date.now() + 1000000,
      staleUntil: Date.now() + 100000000,
    });

    t.expect(map.size).toBe(2);

    const res2 = await newStore.get("namespace", key);
    t.expect(res2.err).not.toBeDefined();
    t.expect(res2.val?.value).toBe(value);
  });
});
