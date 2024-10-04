import { env, SELF } from "cloudflare:test";
import { randomBytes } from "node:crypto";
import { expect, it } from "vitest";

it("consumes queue messages", async () => {
  // `SELF` here points to the worker running in the current isolate.
  // This gets its handler from the `main` option in `vitest.config.mts`.
  // Importantly, it uses the exact `import("../src").default` instance we could
  // import in this file as its handler. Note the `SELF.queue()` method
  // is experimental, and requires the `service_binding_extra_handlers`
  // compatibility flag to be enabled.
  const messages: ServiceBindingQueueMessage<QueueJob>[] = [
    {
      id: randomBytes(16).toString("hex"),
      timestamp: new Date(1000),
      attempts: 1,
      body: { key: "/1", value: "one" },
    },
    {
      id: randomBytes(16).toString("hex"),
      timestamp: new Date(2000),
      attempts: 1,
      body: { key: "/2", value: "two" },
    },
  ];
  const result = await SELF.queue("queue", messages);
  expect(result.outcome).toBe("ok");
  expect(result.retryBatch.retry).toBe(false); // `true` if `batch.retryAll()` called
  expect(result.ackAll).toBe(false); // `true` if `batch.ackAll()` called
  expect(result.retryMessages).toStrictEqual([]);
  // expect(result.explicitAcks).toStrictEqual([messages[0].id, messages[1].id]);

  expect(await env.QUEUE_RESULTS.get("/1")).toBe("ONE");
  expect(await env.QUEUE_RESULTS.get("/2")).toBe("TWO");
});
