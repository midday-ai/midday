import { Analytics, newId } from "@/analytics";
import { ServiceCache } from "@/cache";
import { APIKeyRepository } from "@/data/apiKeyRepository";
import { UserRepository } from "@/data/userRepository";
import { DatabaseClient } from "@/db/client";
import { ConsoleLogger } from "@/logger";
import { LogdrainMetrics } from "@/metric/logdrain";
import { formatPlatformPrefix } from "@/utils/formatters";
import type { MiddlewareHandler } from "hono";
import type { HonoEnv, Repository } from "../hono/env";

/**
 * workerId and coldStartAt are used to track the lifetime of the worker
 * and are set once when the worker is first initialized.
 *
 * subsequent requests will use the same workerId and coldStartAt
 */
let isolateId: string | undefined = undefined;
let isolateCreatedAt: number | undefined = undefined;
/**
 * Initialize all services.
 *
 * This middleware function sets up the necessary context and services for each request.
 * It should be called once before any Hono handlers run.
 *
 * @returns {MiddlewareHandler<HonoEnv>} A Hono middleware handler function.
 *
 * @remarks
 * This function performs the following tasks:
 * 1. Initializes and sets the isolate ID and creation time if not already set.
 * 2. Generates and sets a unique request ID.
 * 3. Sets the request start time.
 * 4. Formats the platform prefix and sets a custom request ID header.
 * 5. Initializes a logger, database connection, and cache service.
 * 6. Sets up the context object with these services.
 *
 * The function uses persistent variables (isolateId and isolateCreatedAt) to track
 * the lifetime of the worker across multiple executions.
 */
export function init(): MiddlewareHandler<HonoEnv> {
    return async (c, next) => {
        if (!isolateId) {
            isolateId = crypto.randomUUID();
        }
        if (!isolateCreatedAt) {
            isolateCreatedAt = Date.now();
        }
        c.set("isolateId", isolateId);
        c.set("isolateCreatedAt", isolateCreatedAt);
        const requestId = newId("request");
        c.set("requestId", requestId);

        c.set("requestStartedAt", Date.now());

        // format the platform prefix
        const platformPrefix = c.env.PLATFORM_PREFIX;
        const formattedPlatformPrefix = formatPlatformPrefix(platformPrefix);

        // define request id header
        const requestIdKey = `${formattedPlatformPrefix}-Request-Id`;
        c.res.headers.set(requestIdKey, requestId);

        const logger = new ConsoleLogger({
            requestId,
            application: "api",
            environment: c.env.ENVIRONMENT,
            defaultFields: { environment: c.env.ENVIRONMENT },
        });

        const db = new DatabaseClient(c.env.DB).getDB(c);

        const cache = new ServiceCache(c.env, c.env.PLATFORM_PREFIX);

        const analyticsClient = new Analytics({
            requestId,
            environment: c.env.ENVIRONMENT,
        });

        const metricsClient = new LogdrainMetrics({
            requestId,
            environment: c.env.ENVIRONMENT,
        });

        const dataRepository: Repository = {
            apiKey: new APIKeyRepository(db),
            user: new UserRepository(db),
        }

        /**
         * The context object containing initialized services.
         * @property {ReturnType<typeof initDB>} db - The database connection.
         * @property {ConsoleLogger} logger - The logger instance.
         * @property {ServiceCache} cache - The cache service instance.
         * @property {LogdrainMetrics} metrics - The metrics service instance.
         * @property {Analytics} analytics - The analytics service instance.
         */
        c.set("ctx", {
            db: db,
            logger: logger,
            cache: cache,
            metrics: metricsClient,
            analytics: analyticsClient,
        });

        c.set("repo", dataRepository);

        await next();
    };
}