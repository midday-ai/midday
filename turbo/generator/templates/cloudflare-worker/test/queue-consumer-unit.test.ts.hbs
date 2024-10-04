import { randomBytes } from "node:crypto";
import {
  createExecutionContext,
  createMessageBatch,
  env,
  getQueueResult,
} from "cloudflare:test";
import { expect, it } from "vitest";
import worker from "../src/index";

it("consumes queue messages", async () => {
  // Call `queue()` handler directly
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
  const batch = createMessageBatch("queue", messages);
  const ctx = createExecutionContext();
  await worker.queue?.(batch, env, ctx);

  // `getQueueResult()` implicitly calls `waitOnExecutionContext()`
  const result = await getQueueResult(batch, ctx);
  expect(result.outcome).toBe("ok");
  expect(result.retryBatch.retry).toBe(false); // `true` if `batch.retryAll()` called
  expect(result.ackAll).toBe(false); // `true` if `batch.ackAll()` called
  expect(result.retryMessages).toStrictEqual([]);
  expect(result.explicitAcks).toStrictEqual([messages[0].id, messages[1].id]);

  expect(await env.QUEUE_RESULTS.get("/1")).toBe("ONE");
  expect(await env.QUEUE_RESULTS.get("/2")).toBe("TWO");
});
