import { expect, test } from "vitest";

import { KeyV1 } from "./v1";

test("create v1 key", () => {
  const key = new KeyV1({ byteLength: 16 });
  expect(key.toString()).toMatch(/^[a-zA-Z0-9]+$/);
});

test("does not collide easily", () => {
  const n = 1_000_000;
  const keys = new Set<string>();
  for (let i = 0; i < n; i++) {
    keys.add(new KeyV1({ byteLength: 16 }).toString());
  }
  expect(keys.size).toEqual(n);
});

test("unmarshal", () => {
  const key = new KeyV1({ prefix: "prfx", byteLength: 16 });
  const key2 = KeyV1.fromString(key.toString());
  expect(key2.toString()).toEqual(key.toString());
  expect(key2.prefix).toEqual("prfx");
  expect(key2.random).toEqual(key.random);
});
