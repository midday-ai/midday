// Import Sentry instrumentation first, before any other modules
import "./instrument";

import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { closeSharedRedisClient } from "@midday/cache/shared-redis";
import { closeDb, getPoolStats } from "@midday/db/client";
import {
  buildDependenciesResponse,
  buildReadinessResponse,
  checkDependencies,
} from "@midday/health/checker";
import { apiDependencies } from "@midday/health/probes";
import { createLoggerWithContext, logger } from "@midday/logger";
import { Scalar } from "@scalar/hono-api-reference";
import * as Sentry from "@sentry/bun";

import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { routers } from "./rest/routers";
import { wellKnownRouter } from "./rest/routers/well-known";
import type { Context } from "./rest/types";
import { createTRPCContext } from "./trpc/init";
import { appRouter } from "./trpc/routers/_app";
import { httpLogger } from "./utils/logger";
import { getRequestTrace } from "./utils/request-trace";

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
      "cf-ray",
      "trpc-accept",
      "x-request-id",
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
      "Server-Timing",
    ],
    maxAge: 86400,
  }),
);

// Always emit Server-Timing so the browser Network tab shows server-side duration.
// When DEBUG_PERF is on, also log structured details to stdout.
const debugPerf = process.env.DEBUG_PERF === "true";
const perfLoggerHono = debugPerf ? createLoggerWithContext("perf:trpc") : null;

app.use("/trpc/*", async (c, next) => {
  const start = performance.now();
  await next();
  const elapsed = performance.now() - start;
  const procedures = c.req.path.replace("/trpc/", "").split(",");

  c.header(
    "Server-Timing",
    `total;dur=${elapsed.toFixed(1)},procedures;desc="${procedures.join(",")}"`,
  );

  if (perfLoggerHono) {
    const { requestId, cfRay } = getRequestTrace(c.req);
    perfLoggerHono.info("request", {
      totalMs: +elapsed.toFixed(2),
      procedureCount: procedures.length,
      procedures,
      status: c.res.status,
      pool: getPoolStats(),
      requestId,
      cfRay,
    });
  }
});

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

app.route("/.well-known", wellKnownRouter);

app.get("/health", (c) => {
  const start = performance.now();
  c.header(
    "Server-Timing",
    `app;dur=${(performance.now() - start).toFixed(2)}`,
  );
  c.header("X-Server-Timestamp", Date.now().toString());
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

const openAPIConfig = {
  openapi: "3.1.0",
  info: {
    version: "0.0.1",
    title: "Midday API",
    description:
      "Midday is a platform for Invoicing, Time tracking, File reconciliation, Storage & Financial Overview.",
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
  ] as Record<string, string[]>[],
  tags: [
    { name: "Bank Accounts", description: "Manage bank accounts" },
    { name: "Customers", description: "Manage customers" },
    { name: "Desktop", description: "Desktop app endpoints" },
    { name: "Documents", description: "Manage documents" },
    { name: "Files", description: "File operations" },
    { name: "Inbox", description: "Manage inbox items" },
    { name: "Integrations", description: "Integration endpoints" },
    { name: "Invoice Payments", description: "Invoice payment processing" },
    { name: "Invoices", description: "Manage invoices" },
    { name: "Notifications", description: "Manage notifications" },
    { name: "OAuth", description: "OAuth authorization flow" },
    { name: "Reports", description: "Financial reports" },
    { name: "Search", description: "Search endpoints" },
    { name: "Tags", description: "Manage tags" },
    { name: "Teams", description: "Manage teams" },
    { name: "Tracker Entries", description: "Manage time tracker entries" },
    { name: "Tracker Projects", description: "Manage tracker projects" },
    { name: "Tracker Timer", description: "Timer operations" },
    { name: "Transactions", description: "Manage transactions" },
    { name: "Users", description: "Manage users" },
    { name: "Webhooks", description: "Webhook endpoints" },
  ],
  "x-speakeasy-retries": {
    strategy: "backoff",
    backoff: {
      initialInterval: 500,
      maxInterval: 60000,
      maxElapsedTime: 300000,
      exponent: 1.5,
    },
    statusCodes: ["5XX"],
    retryConnectionErrors: true,
  },
};

app.get("/openapi", (c) => {
  const spec = app.getOpenAPI31Document(openAPIConfig);

  // Ensure every operation has at least one error response for SDK generation
  const defaultErrorResponse = {
    description: "An error occurred",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ErrorResponse",
        },
      },
    },
  };

  for (const methods of Object.values(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods as object)) {
      if (
        method === "parameters" ||
        typeof operation !== "object" ||
        !operation
      )
        continue;
      const op = operation as { responses?: Record<string, unknown> };
      if (!op.responses) continue;
      const hasError = Object.keys(op.responses).some(
        (code) => code >= "400" || code === "default",
      );
      if (!hasError) {
        op.responses.default = defaultErrorResponse;
      }
    }
  }

  if (!spec.components) spec.components = {};
  if (!spec.components.schemas) spec.components.schemas = {};
  (spec.components.schemas as Record<string, unknown>).ErrorResponse = {
    type: "object",
    properties: {
      error: {
        type: "string",
        description: "Error message",
        example: "Internal Server Error",
      },
      code: {
        type: "integer",
        description: "HTTP status code",
        example: 500,
      },
    },
    required: ["error"],
  };

  return c.json(spec);
});

// Register security schemes
app.openAPIRegistry.registerComponent("securitySchemes", "token", {
  type: "http",
  scheme: "bearer",
  description: "Default authentication mechanism",
  "x-speakeasy-example": "MIDDAY_API_KEY",
});

const dashboardUrl =
  process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";
const apiUrl = process.env.MIDDAY_API_URL || "https://api.midday.ai";

app.openAPIRegistry.registerComponent("securitySchemes", "oauth2", {
  type: "oauth2",
  description: "OAuth 2.0 Authorization Code flow",
  flows: {
    authorizationCode: {
      authorizationUrl: `${dashboardUrl}/oauth/authorize`,
      tokenUrl: `${apiUrl}/oauth/token`,
      scopes: {
        "bank-accounts.read": "Read bank accounts",
        "bank-accounts.write": "Write bank accounts",
        "customers.read": "Read customers",
        "customers.write": "Write customers",
        "documents.read": "Read documents",
        "documents.write": "Write documents",
        "inbox.read": "Read inbox",
        "inbox.write": "Write inbox",
        "invoices.read": "Read invoices",
        "invoices.write": "Write invoices",
        "reports.read": "Read reports",
        "search.read": "Read search",
        "tags.read": "Read tags",
        "tags.write": "Write tags",
        "teams.read": "Read teams",
        "teams.write": "Write teams",
        "tracker-entries.read": "Read tracker entries",
        "tracker-entries.write": "Write tracker entries",
        "tracker-projects.read": "Read tracker projects",
        "tracker-projects.write": "Write tracker projects",
        "transactions.read": "Read transactions",
        "transactions.write": "Write transactions",
        "users.read": "Read users",
        "users.write": "Write users",
        "notifications.read": "Read notifications",
        "notifications.write": "Write notifications",
      },
    },
  },
});

app.get(
  "/",
  Scalar({ url: "/openapi", pageTitle: "Midday API", theme: "saturn" }),
);

app.route("/", routers);

const poolStatsIntervalMsRaw = process.env.DB_POOL_STATS_INTERVAL_MS;
const parsedPoolStatsIntervalMs = Number.parseInt(
  poolStatsIntervalMsRaw ?? "60000",
  10,
);
const poolStatsIntervalMs = Number.isFinite(parsedPoolStatsIntervalMs)
  ? parsedPoolStatsIntervalMs
  : 60000;
const poolStatsInterval =
  poolStatsIntervalMs > 0
    ? setInterval(() => {
        logger.info("API DB pool stats", {
          pool: getPoolStats(),
        });
      }, poolStatsIntervalMs)
    : null;

if (poolStatsIntervalMs <= 0) {
  logger.info("API DB pool stats logging disabled", {
    configuredIntervalMs: poolStatsIntervalMsRaw ?? "0",
  });
}

// Global error handler — captures unhandled route errors to Sentry
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

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
      if (poolStatsInterval) {
        clearInterval(poolStatsInterval);
      }

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

// Pre-warm the chat tool index in the background so the first request is fast.
import { warmToolIndex } from "./chat/tools";

warmToolIndex();

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000,
  fetch: app.fetch,
  host: "0.0.0.0", // Listen on all interfaces
  idleTimeout: 60,
};
