import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from "cloudflare:test";
import { afterEach, expect, it, vi } from "vitest";
import worker from "../src/index";

// This will improve in the next major version of `@cloudflare/workers-types`,
// but for now you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

afterEach(() => {
  vi.restoreAllMocks();
});

it("produces queue message with mocked send", async () => {
  // Intercept calls to `QUEUE_PRODUCER.send()`
  const sendSpy = vi
    .spyOn(env.QUEUE_PRODUCER, "send")
    .mockImplementation(async () => {});

  // Enqueue job on queue
  const request = new IncomingRequest("https://example.com/queue", {
    method: "POST",
    body: "value",
  });
  const ctx = createExecutionContext();
  const response = await worker.fetch?.(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response?.status).toBe(202);
  expect(await response?.text()).toBe("Accepted");

  // Check `QUEUE_PRODUCER.send()` was called
  expect(sendSpy).toBeCalledTimes(1);
  expect(sendSpy).toBeCalledWith({ key: "/queue", value: "value" });
});

it("produces queue message with mocked consumer", async () => {
  // Intercept calls to `worker.queue()`. Note the runner worker has a queue
  // consumer configured that gets its handler from the `main` option in
  // `vitest.config.mts`. Importantly, this uses the exact `worker` instance
  // we're spying on here.
  const consumerSpy = vi
    .spyOn(worker, "queue")
    .mockImplementation(async () => {});

  // Enqueue job on queue
  const request = new IncomingRequest("https://example.com/queue", {
    method: "POST",
    body: "another value",
  });
  const ctx = createExecutionContext();
  const response = await worker.fetch?.(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response?.status).toBe(202);
  expect(await response?.text()).toBe("Accepted");

  // Wait for consumer to be called
  await vi.waitUntil(() => consumerSpy.mock.calls.length > 0);
  expect(consumerSpy).toBeCalledTimes(1);
  const batch = consumerSpy.mock.lastCall?.[0];
  expect(batch).toBeDefined();
  expect(batch?.messages[0].body).toStrictEqual({
    key: "/queue",
    value: "another value",
  });
});
