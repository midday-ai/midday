// Import Sentry instrumentation first, before any other modules
import "./instrument";

import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { routers } from "./rest/routers";
import type { Context } from "./rest/types";
import { createTRPCContext } from "./trpc/init";
import { appRouter } from "./trpc/routers/_app";
import { getSharedRedisClient } from "@midday/cache/shared-redis";
import { db } from "@midday/db/client";
import { logger } from "@midday/logger";
import { sql } from "drizzle-orm";
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
    onError: ({ error, path }) => {
      logger.error(`[tRPC] ${path}`, {
        message: error.message,
        code: error.code,
        cause: error.cause instanceof Error ? error.cause.message : undefined,
        stack: error.stack,
      });
    },
  }),
);

app.get("/health", (c) => {
  return c.json({ status: "ok" }, 200);
});

/**
 * Region diagnostics endpoint
 * Verifies multi-region deployment: which region is serving the request,
 * which DB replica is selected, and Redis connectivity.
 */
app.get("/health/region", async (c) => {
  const region = process.env.RAILWAY_REPLICA_REGION ?? "unknown";
  const environment = process.env.RAILWAY_ENVIRONMENT ?? "unknown";

  const regionToReplica: Record<string, string> = {
    "europe-west4-drams3a": "fra (Frankfurt)",
    "us-east4-eqdc4a": "iad (N. Virginia)",
    "us-west2": "sjc (San Jose)",
  };

  // Check Redis connectivity
  let redisStatus = "unknown";
  let redisLatencyMs: number | null = null;
  try {
    const redis = getSharedRedisClient();
    const start = performance.now();
    await redis.send("PING", []);
    redisLatencyMs = Math.round((performance.now() - start) * 100) / 100;
    redisStatus = "connected";
  } catch (err) {
    redisStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Check DB replica connectivity using executeOnReplica (db.execute always hits primary)
  let replicaServerAddr: string | null = null;
  let dbReplicaStatus = "unknown";
  let dbReplicaLatencyMs: number | null = null;
  try {
    const replicaDb = db as unknown as {
      executeOnReplica: <T>(query: unknown) => Promise<T[]>;
    };
    const start = performance.now();
    const rows = await replicaDb.executeOnReplica<{
      server_addr: string;
    }>(sql`SELECT inet_server_addr() as server_addr`);
    dbReplicaLatencyMs = Math.round((performance.now() - start) * 100) / 100;
    dbReplicaStatus = "connected";
    replicaServerAddr = rows[0]?.server_addr ?? null;
  } catch (err) {
    dbReplicaStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Check DB primary connectivity
  let primaryServerAddr: string | null = null;
  let dbPrimaryStatus = "unknown";
  let dbPrimaryLatencyMs: number | null = null;
  try {
    const start = performance.now();
    const result = await db.execute(
      sql`SELECT inet_server_addr() as server_addr`,
    );
    dbPrimaryLatencyMs = Math.round((performance.now() - start) * 100) / 100;
    dbPrimaryStatus = "connected";
    const rows = (result as unknown as { rows?: { server_addr: string }[] })
      .rows;
    primaryServerAddr = rows?.[0]?.server_addr ?? null;
  } catch (err) {
    dbPrimaryStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return c.json(
    {
      status: "ok",
      region,
      environment,
      railwayReplicaRegion: process.env.RAILWAY_REPLICA_REGION ?? null,
      replica: regionToReplica[region] ?? "unknown (defaulting to fra)",
      timestamp: new Date().toISOString(),
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs,
      },
      database: {
        replicaStatus: dbReplicaStatus,
        replicaLatencyMs: dbReplicaLatencyMs,
        replicaServerAddr,
        primaryStatus: dbPrimaryStatus,
        primaryLatencyMs: dbPrimaryLatencyMs,
        primaryServerAddr,
        sameServer: replicaServerAddr === primaryServerAddr,
        hasPrimary: Boolean(process.env.DATABASE_PRIMARY_URL),
        hasReplicas: Boolean(
          process.env.DATABASE_FRA_URL &&
            process.env.DATABASE_SJC_URL &&
            process.env.DATABASE_IAD_URL,
        ),
        envVars: {
          DATABASE_PRIMARY_URL: Boolean(process.env.DATABASE_PRIMARY_URL),
          DATABASE_FRA_URL: Boolean(process.env.DATABASE_FRA_URL),
          DATABASE_IAD_URL: Boolean(process.env.DATABASE_IAD_URL),
          DATABASE_SJC_URL: Boolean(process.env.DATABASE_SJC_URL),
        },
      },
    },
    200,
  );
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
  host: "0.0.0.0", // Listen on all interfaces
  idleTimeout: 60,
};
