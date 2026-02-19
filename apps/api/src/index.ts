// Import Sentry instrumentation first, before any other modules
import "./instrument";

import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { closeSharedRedisClient } from "@midday/cache/shared-redis";
import { closeDb } from "@midday/db/client";
import {
  buildDependenciesResponse,
  buildReadinessResponse,
  checkDependencies,
} from "@midday/health/checker";
import { apiDependencies } from "@midday/health/probes";
import { logger } from "@midday/logger";
import { Scalar } from "@scalar/hono-api-reference";
import * as Sentry from "@sentry/bun";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { routers } from "./rest/routers";
import type { Context } from "./rest/types";
import { createTRPCContext } from "./trpc/init";
import { appRouter } from "./trpc/routers/_app";
import { httpLogger } from "./utils/logger";

const app = new OpenAPIHono<Context>();

app.use(httpLogger());
app.use(
  secureHeaders({
    crossOriginResourcePolicy: "cross-origin",
  }),
);

app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_API_ORIGINS?.split(",") ?? [],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Authorization",
      "Content-Type",
      "User-Agent",
      "accept-language",
      "x-trpc-source",
      "x-user-locale",
      "x-user-timezone",
      "x-user-country",
      "x-force-primary",
      // Slack webhook headers
      "x-slack-signature",
      "x-slack-request-timestamp",
    ],
    exposeHeaders: [
      "Content-Length",
      "Content-Type",
      "Cache-Control",
      "Cross-Origin-Resource-Policy",
    ],
    maxAge: 86400,
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ error, path, input }) => {
      logger.error(`[tRPC] ${path}`, {
        message: error.message,
        code: error.code,
        cause: error.cause instanceof Error ? error.cause.message : undefined,
        stack: error.stack,
      });

      // Send to Sentry (skip client errors like NOT_FOUND, UNAUTHORIZED)
      if (error.code === "INTERNAL_SERVER_ERROR") {
        Sentry.captureException(error, {
          tags: { source: "trpc", path: path ?? "unknown" },
          extra: {
            input:
              typeof input === "object" ? JSON.stringify(input) : undefined,
          },
        });
      }
    },
  }),
);

app.get("/favicon.ico", (c) => c.body(null, 204));
app.get("/robots.txt", (c) => c.body(null, 204));

app.get("/health", (c) => {
  return c.json({ status: "ok" }, 200);
});

app.get("/health/ready", async (c) => {
  const results = await checkDependencies(apiDependencies(), 1);
  const response = buildReadinessResponse(results);
  return c.json(response, response.status === "ok" ? 200 : 503);
});

app.get("/health/dependencies", async (c) => {
  const results = await checkDependencies(apiDependencies());
  const response = buildDependenciesResponse(results);
  return c.json(response, response.status === "ok" ? 200 : 503);
});

app.doc("/openapi", {
  openapi: "3.1.0",
  info: {
    version: "0.0.1",
    title: "Midday API",
    description:
      "Midday is a platform for Invoicing, Time tracking, File reconciliation, Storage, Financial Overview & your own Assistant.",
    contact: {
      name: "Midday Support",
      email: "engineer@midday.ai",
      url: "https://midday.ai",
    },
    license: {
      name: "AGPL-3.0 license",
      url: "https://github.com/midday-ai/midday/blob/main/LICENSE",
    },
  },
  servers: [
    {
      url: "https://api.midday.ai",
      description: "Production API",
    },
  ],
  security: [
    {
      oauth2: [],
    },
    { token: [] },
  ],
});

// Register security scheme
app.openAPIRegistry.registerComponent("securitySchemes", "token", {
  type: "http",
  scheme: "bearer",
  description: "Default authentication mechanism",
  "x-speakeasy-example": "MIDDAY_API_KEY",
});

app.get(
  "/",
  Scalar({ url: "/openapi", pageTitle: "Midday API", theme: "saturn" }),
);

app.route("/", routers);

// Global error handler — captures unhandled route errors to Sentry
app.onError((err, c) => {
  Sentry.captureException(err, {
    tags: { source: "hono", path: c.req.path, method: c.req.method },
  });
  logger.error(`[Hono] ${c.req.method} ${c.req.path}`, {
    message: err.message,
    stack: err.stack,
  });
  return c.json({ error: "Internal Server Error" }, 500);
});

/**
 * Graceful shutdown handlers
 * Close database connections cleanly on process termination (e.g. Railway deploys)
 */
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  const SHUTDOWN_TIMEOUT = 12_000; // 12s — fits within Railway's 15s draining window

  const shutdownPromise = (async () => {
    try {
      logger.info("Closing database connections...");
      await closeDb();

      logger.info("Closing Redis connection...");
      closeSharedRedisClient();

      logger.info("Flushing Sentry events...");
      await Sentry.close(2000);

      logger.info("Graceful shutdown complete");
    } catch (error) {
      logger.error("Error during shutdown", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      logger.warn("Shutdown timeout reached, forcing exit");
      resolve();
    }, SHUTDOWN_TIMEOUT);
  });

  await Promise.race([shutdownPromise, timeoutPromise]);
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/**
 * Unhandled exception and rejection handlers
 */
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  Sentry.captureException(err, {
    tags: { errorType: "uncaught_exception" },
  });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  Sentry.captureException(
    reason instanceof Error ? reason : new Error(String(reason)),
    {
      tags: { errorType: "unhandled_rejection" },
    },
  );
});

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000,
  fetch: app.fetch,
  host: "0.0.0.0", // Listen on all interfaces
  idleTimeout: 60,
};
