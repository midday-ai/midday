import { MiddlewareHandler } from "hono";
import { newId } from "../analytics/generate";
import { DatabaseManager } from "../database/client";
import { HonoEnv } from "../hono";
import { LoggerSingleton, LogSchema } from "../logger";
import { Metrics, NoopMetrics } from "../metrics";
import { LogdrainMetrics } from "../metrics/logdrain";

/**
 * These maps persist between worker executions and are used for caching
 */
const rlMap = new Map();

/**
 * workerId and coldStartAt are used to track the lifetime of the worker
 * and are set once when the worker is first initialized.
 *
 * subsequent requests will use the same workerId and coldStartAt
 */
let isolateId: string | undefined = undefined;

/**
 * Initialize all services.
 *
 * Call this once before any hono handlers run.
 */
export function init(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    if (!isolateId) {
      isolateId = crypto.randomUUID();
    }
    c.set("isolateId", isolateId);
    c.set("isolateCreatedAt", Date.now());
    const requestId = newId("request");
    c.set("requestId", requestId);

    c.res.headers.set("API-Request-Id", requestId);

    const logger = LoggerSingleton.getInstance(requestId, {
      environment: c.env.ENVIRONMENT as LogSchema["environment"],
      application: "api",
      defaultFields: { environment: c.env.ENVIRONMENT },
    });

    const db = await DatabaseManager.getInstance(c.env.DB);

    const metrics: Metrics = c.env.EMIT_METRICS_LOGS
      ? new LogdrainMetrics({
          requestId,
          environment: c.env.ENVIRONMENT,
          isolateId,
        })
      : new NoopMetrics();

    c.set("services", {
      db,
      metrics,
      logger,
    });

    await next();
  };
}
