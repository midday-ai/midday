import { env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

// Illustrative example for `isolatedStorage` option

// Get the current list stored in a KV namespace
async function get(): Promise<string[]> {
  return (await env.KV_NAMESPACE.get("list", "json")) ?? [];
}
// Add an item to the end of the list
async function append(item: string) {
  const value = await get();
  value.push(item);
  await env.KV_NAMESPACE.put("list", JSON.stringify(value));
}

beforeAll(() => append("all"));
beforeEach(() => append("each"));

test("one", async () => {
  // Each test gets its own storage environment copied from the parent
  await append("one");
  expect(await get()).toStrictEqual(["all", "each", "one"]);
});
// `append("each")` and `append("one")` undone
test("two", async () => {
  await append("two");
  expect(await get()).toStrictEqual(["all", "each", "two"]);
});
// `append("each")` and `append("two")` undone

describe("describe", async () => {
  beforeAll(() => append("describe all"));
  beforeEach(() => append("describe each"));

  test("three", async () => {
    await append("three");
    expect(await get()).toStrictEqual([
      // All `beforeAll()`s run before `beforeEach()`s
      "all",
      "describe all",
      "each",
      "describe each",
      "three",
    ]);
  });
  // `append("each")`, `append("describe each")` and `append("three")` undone
  test("four", async () => {
    await append("four");
    expect(await get()).toStrictEqual([
      "all",
      "describe all",
      "each",
      "describe each",
      "four",
    ]);
  });
  // `append("each")`, `append("describe each")` and `append("four")` undone
});
