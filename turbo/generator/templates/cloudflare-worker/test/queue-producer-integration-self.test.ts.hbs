import { SELF } from "cloudflare:test";
import { expect, it, vi } from "vitest";

it("produces and consumers queue message", async () => {
  // Enqueue job on queue
  let response = await SELF.fetch("https://example.com/queue", {
    method: "POST",
    body: "value",
  });
  expect(response.status).toBe(202);
  expect(await response.text()).toBe("Accepted");

  // Wait for job to be processed
  const result = await vi.waitUntil(async () => {
    const response = await SELF.fetch("https://example.com/queue");
    const text = await response.text();
    if (response.ok) return text;
  });
  expect(result).toBe("VALUE");
});
