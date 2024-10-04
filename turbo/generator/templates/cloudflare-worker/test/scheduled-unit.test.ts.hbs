import {
  createExecutionContext,
  createScheduledController,
  env,
  waitOnExecutionContext,
} from "cloudflare:test";
import { it } from "vitest";
import worker from "../src/index";

it("dispatches scheduled event", async () => {
  const controller = createScheduledController({
    scheduledTime: new Date(1000),
    cron: "30 * * * *",
  });
  const ctx = createExecutionContext();
  await worker.scheduled?.(controller, env, ctx);
  await waitOnExecutionContext(ctx);
});
