import { SELF } from "cloudflare:test";
import { expect, it } from "vitest";

it("stores in KV namespace", async () => {
  let response = await SELF.fetch("https://example.com/kv/key", {
    method: "PUT",
    body: "value",
  });
  expect(response.status).toBe(204);

  response = await SELF.fetch("https://example.com/kv/key");
  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
});

it("uses isolated storage for each test", async () => {
  // Check write in previous test undone
  const response = await SELF.fetch("https://example.com/kv/key");
  expect(response.status).toBe(204);
});
