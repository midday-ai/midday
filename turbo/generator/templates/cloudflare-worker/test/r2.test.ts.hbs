import {
  createExecutionContext,
  env,
  SELF,
  waitOnExecutionContext,
} from "cloudflare:test";
import { expect, it } from "vitest";
import { handleR2Request } from "../src"; // Note we can import any function

it("stores in R2 bucket", async () => {
  let response = await SELF.fetch("https://example.com/r2/key", {
    method: "PUT",
    headers: { "Cache-Control": "max-age=3600" },
    body: "value",
  });
  expect(response.status).toBe(204);

  const request = new Request("https://example.com/r2/key");
  let ctx = createExecutionContext();
  response = await handleR2Request(request, env, ctx);
  await waitOnExecutionContext(ctx); // Wait for `caches.default.put()`
  expect(response.status).toBe(200);
  expect(response.headers.get("CF-Cache-Status")).toBe(null);
  expect(await response.text()).toBe("value");

  // Check 2nd request to the same resource is cached
  ctx = createExecutionContext();
  response = await handleR2Request(request, env, ctx);
  await waitOnExecutionContext(ctx);
  expect(response.status).toBe(200);
  expect(response.headers.get("CF-Cache-Status")).toBe("HIT");
  expect(await response.text()).toBe("value");
});

it("uses isolated storage for each test", async () => {
  // Check write in previous test undone
  const response = await SELF.fetch("https://example.com/r2/key");
  expect(response.status).toBe(204);
});
