import { SELF } from "cloudflare:test";
import { expect, it } from "vitest";

it("dispatches scheduled event", async () => {
  // `SELF` here points to the worker running in the current isolate.
  // This gets its handler from the `main` option in `vitest.config.mts`.
  // Importantly, it uses the exact `import("../src").default` instance we could
  // import in this file as its handler. Note the `SELF.scheduled()` method
  // is experimental, and requires the `service_binding_extra_handlers`
  // compatibility flag to be enabled.
  const result = await SELF.scheduled({
    scheduledTime: new Date(1000),
    cron: "30 * * * *",
  });
  expect(result).toMatchObject({
    outcome: "ok",
    noRetry: false,
  });
});
