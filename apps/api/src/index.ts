import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getConnectionPoolStats } from "@midday/db/client";
import { db } from "@midday/db/client";
import { Scalar } from "@scalar/hono-api-reference";
import { sql } from "drizzle-orm";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { routers } from "./rest/routers";
import type { Context } from "./rest/types";
import { createTRPCContext } from "./trpc/init";
import { appRouter } from "./trpc/routers/_app";
import { checkHealth } from "./utils/health";

const app = new OpenAPIHono<Context>();

app.use(secureHeaders());

app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_API_ORIGINS?.split(",") ?? [],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Authorization",
      "Content-Type",
      "accept-language",
      "x-trpc-source",
      "x-user-locale",
      "x-user-timezone",
      "x-user-country",
    ],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: createTRPCContext,
  }),
);

app.get("/health", async (c) => {
  try {
    await checkHealth();

    return c.json({ status: "ok" }, 200);
  } catch (error) {
    return c.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Connection pool health check
app.get("/health/pools", async (c) => {
  try {
    const stats = getConnectionPoolStats();

    // Determine health status with proper priority
    let status = "healthy";
    const issues = [];

    // Check for degraded conditions (highest priority)
    if (stats.summary.hasExhaustedPools) {
      status = "degraded";
      issues.push("Connection pools exhausted");
    }

    if (stats.summary.totalWaiting > 0) {
      status = "degraded";
      issues.push(`${stats.summary.totalWaiting} connections waiting`);
    }

    // Only set warning if not already degraded
    if (status !== "degraded" && stats.summary.utilizationPercent >= 80) {
      status = "warning";
      issues.push(
        `High connection usage: ${stats.summary.utilizationPercent}%`,
      );
    }

    const exhaustedPools = Object.values(stats.pools)
      .filter((p) => (p.active || 0) >= (p.total || 0))
      .map((p) => p.name);

    const waitingPools = Object.values(stats.pools)
      .filter((p) => (p.waiting || 0) > 0)
      .map((p) => p.name);

    return c.json({
      status,
      issues,
      exhaustedPools,
      waitingPools,
      ...stats,
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});

// Database connection test with timing
app.get("/health/db", async (c) => {
  const startTime = Date.now();

  try {
    // Test with a simple query
    const testStart = Date.now();
    await db.execute(sql`SELECT 1 as test`);
    const queryTime = Date.now() - testStart;

    const totalTime = Date.now() - startTime;
    const poolStats = getConnectionPoolStats();

    return c.json({
      status: "healthy",
      timing: {
        connectionTime: `${testStart - startTime}ms`,
        queryTime: `${queryTime}ms`,
        total: `${totalTime}ms`,
      },
      poolSummary: poolStats.summary,
      region: process.env.FLY_REGION,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const poolStats = getConnectionPoolStats();

    return c.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timing: {
          failedAfter: `${totalTime}ms`,
        },
        poolSummary: poolStats.summary,
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
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

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,
  fetch: app.fetch,
  host: "::", // Listen on all interfaces
};
