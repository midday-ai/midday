import { ApiAnalyticsEvent, SdkAnalyticsEvent } from "@/analytics";
import type { Metric } from "@/metric/metric-schema";
import { formatPlatformPrefix } from "@/utils/formatters";
import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../hono/env";

type DiscriminateMetric<T, M = Metric> = M extends { metric: T } ? M : never;

export function metrics(): MiddlewareHandler<HonoEnv> {
    return async (c, next) => {
        const { metrics, analytics } = c.get("ctx");

        const platformPrefix = c.env.PLATFORM_PREFIX;
        const formattedPlatformPrefix = formatPlatformPrefix(platformPrefix);
        let requestBody = await c.req.raw.clone().text();
        requestBody = requestBody.replaceAll(/"key":\s*"[a-zA-Z0-9_]+"/g, '"key": "<REDACTED>"');
        const start = performance.now();
        const m = {
            isolateId: c.get("isolateId"),
            isolateLifetime: Date.now() - c.get("isolateCreatedAt"),
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
            fromAgent: c.req.header(`${formattedPlatformPrefix}-Redirect`),
            context: {},
        } as DiscriminateMetric<"metric.http.request">;

        try {
            const telemetry = {
                runtime: c.req.header(`${formattedPlatformPrefix}-Telemetry-Runtime`),
                platform: c.req.header(`${formattedPlatformPrefix}-Telemetry-Platform`),
                versions: c.req.header(`${formattedPlatformPrefix}-Telemetry-SDK`)?.split(","),
            };
            if (
                telemetry.runtime &&
                telemetry.platform &&
                telemetry.versions &&
                telemetry.versions.length > 0
            ) {
                const event: SdkAnalyticsEvent = {
                    runtime: telemetry.runtime || "unknown",
                    platform: telemetry.platform || "unknown",
                    versions: telemetry.versions || [],
                    requestId: c.get("requestId"),
                    time: Date.now(),
                };

                c.executionCtx.waitUntil(
                    analytics
                        .insertSdkTelemetry({
                            event: event,
                            requestID: event.requestId,
                        })
                );
            }

            await next();
        } catch (e) {
            m.error = (e as Error).message;
            c.get("ctx").logger.error("request", {
                method: c.req.method,
                path: c.req.path,
                error: e,
            });
            throw e;
        } finally {
            m.status = c.res.status;
            m.context = c.get("metricsContext") ?? {};
            m.serviceLatency = performance.now() - start;
            c.res.headers.append(`${formattedPlatformPrefix}-Latency`, `service=${m.serviceLatency}ms`);
            c.res.headers.append(`${formattedPlatformPrefix}-Version`, c.env.VERSION);
            metrics.emit(m);
            c.executionCtx.waitUntil(metrics.flush());

            const responseHeaders: Array<string> = [];
            c.res.headers.forEach((v, k) => {
                responseHeaders.push(`${k}: ${v}`);
            });

            const apiAnalyticsEvent: ApiAnalyticsEvent = {
                request_id: c.get("requestId"),
                time: c.get("requestStartedAt"),
                host: new URL(c.req.url).host,
                method: c.req.method,
                path: c.req.path,
                request_headers: Object.entries(c.req.header()).map(([k, v]) => {
                    if (k.toLowerCase() === "authorization") {
                        return `${k}: <REDACTED>`;
                    }
                    return `${k}: ${v}`;
                }),
                request_body: requestBody,
                response_status: c.res.status,
                response_headers: responseHeaders,
                response_body: await c.res.clone().text(),
                error: m.error ?? "",
                service_latency: Date.now() - c.get("requestStartedAt"),
                ip_address: c.req.header("True-Client-IP") ?? c.req.header("CF-Connecting-IP") ?? "",
                user_agent: c.req.header("User-Agent") ?? "",
            };

            c.executionCtx.waitUntil(
                analytics.insertApiRequest(apiAnalyticsEvent),
            );
        }
    };
}