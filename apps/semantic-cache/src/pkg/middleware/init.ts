import { newId } from "@internal/id";
import { ConsoleLogger } from "@internal/worker-logging";
import type { MiddlewareHandler } from "hono";

import { Analytics } from "../analytics";
import type { HonoEnv } from "../hono/env";
import { NoopMetrics, type Metrics } from "../metrics";
import { LogdrainMetrics } from "../metrics/logdrain";

/**
 * Initialize all services.
 *
 * Call this once before any hono handlers run.
 */
export function init(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const requestId = newId("request");
    c.res.headers.set("Unkey-Request-Id", requestId);
    c.set("requestId", requestId);

    const platformType = c.get("platformType");
    if (!platformType) {
      // log error
      console.error("No platform type provided");
      return c.json({ error: "No platform type provided" }, 400);
    }

    // createConnection(c.env);

    const metrics: Metrics = c.env.EMIT_METRICS_LOGS
      ? new LogdrainMetrics({ requestId, environment: c.env.ENVIRONMENT })
      : new NoopMetrics();

    const logger = new ConsoleLogger({
      requestId,
      application: "semantic-cache",
      environment: c.env.ENVIRONMENT,
    });

    const tinybirdProxy =
      c.env.TINYBIRD_PROXY_URL && c.env.TINYBIRD_PROXY_TOKEN
        ? {
            url: c.env.TINYBIRD_PROXY_URL,
            token: c.env.TINYBIRD_PROXY_TOKEN,
          }
        : undefined;

    const analytics = new Analytics({
      tinybirdProxy,
      tinybirdToken: c.env.TINYBIRD_TOKEN,
    });

    c.set("services", {
      metrics,
      logger,
      analytics,
    });

    await next();
  };
}
