import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../hono/env";
import { Metric } from "../metrics/metric";

type DiscriminateMetric<T, M = Metric> = M extends { metric: T } ? M : never;

export function metrics(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const { metrics, logger } = c.get("services");
    // logger.info("request", {
    //   method: c.req.method,
    //   path: c.req.path,
    // });
    //
    const start = performance.now();
    const isolateCreatedAt = c.get("isolateCreatedAt");
    const m = {
      isolateId: c.get("isolateId"),
      isolateLifetime: isolateCreatedAt ? Date.now() - isolateCreatedAt : 0,
      metric: "metric.http.request",
      path: c.req.path,
      host: new URL(c.req.url).host,
      method: c.req.method,
      // @ts-ignore - this is a bug in the types
      continent: c.req.raw?.cf?.continent,
      // @ts-ignore - this is a bug in the types
      country: c.req.raw?.cf?.country,
      // @ts-ignore - this is a bug in the types
      colo: c.req.raw?.cf?.colo,
      // @ts-ignore - this is a bug in the types
      city: c.req.raw?.cf?.city,
      userAgent: c.req.header("user-agent"),
      fromAgent: c.req.header("Solomon-AI-Redirect"),
      context: {},
    } as DiscriminateMetric<"metric.http.request">;

    try {
      const telemetry = {
        runtime: c.req.header("Solomon-AI-Telemetry-Runtime"),
        platform: c.req.header("Solomon-AI-Telemetry-Platform"),
        versions: c.req.header("Solomon-AI-Telemetry-SDK")?.split(","),
      };
      if (
        telemetry.runtime &&
        telemetry.platform &&
        telemetry.versions &&
        telemetry.versions.length > 0
      ) {
        const event = {
          runtime: telemetry.runtime || "unknown",
          platform: telemetry.platform || "unknown",
          versions: telemetry.versions || [],
          requestId: c.get("requestId"),
          time: Date.now(),
        };

        // c.executionCtx.waitUntil(
        //   analytics.ingestSdkTelemetry(event).catch((err) => {
        //     logger.error("Error ingesting SDK telemetry", {
        //       method: c.req.method,
        //       path: c.req.path,
        //       error: err.message,
        //       telemetry,
        //       event,
        //     });
        //   }),
        // );

        // TODO: emit the event to tinybird
        logger.info("sdk-telemetry", event);
      }

      await next();
    } catch (e) {
      m.error = (e as Error).message;
      c.get("services").logger.error("request", {
        method: c.req.method,
        path: c.req.path,
        error: e,
      });
      throw e;
    } finally {
      m.status = c.res.status;
      m.context = c.get("metricsContext") ?? {};
      m.serviceLatency = performance.now() - start;
      c.res.headers.append(
        "Solomon-AI-Latency",
        `service=${m.serviceLatency}ms`,
      );
      c.res.headers.append("Solomon-AI-Version", c.env.VERSION);
      metrics.emit(m);
      c.executionCtx.waitUntil(metrics.flush());
    }
  };
}
