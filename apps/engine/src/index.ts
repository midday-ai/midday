import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "hono";
import { env } from "hono/adapter";
import { bearerAuth } from "hono/bearer-auth";
import { cache } from "hono/cache";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import accountRoutes from "./routes/accounts";
import healthRoutes from "./routes/health";
import institutionRoutes from "./routes/institutions";
import transactionsRoutes from "./routes/transactions";
import { logger as customLogger } from "./utils/logger";

type Bindings = {
  KV: KVNamespace;
  TELLER_CERT: Fetcher;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          ok: false,
          source: "error",
        },
        422
      );
    }
  },
});

app.use(
  "/v1/*",
  (c, next) => {
    const { API_SECRET_KEY } = env<{ API_SECRET_KEY: string }>(c);
    const bearer = bearerAuth({ token: API_SECRET_KEY });

    return bearer(c, next);
  },
  secureHeaders(),
  logger(customLogger),
  cache({
    cacheName: "engine",
    cacheControl: "max-age=3600",
  })
);

const apiRoutes = app
  .basePath("/v1")
  .route("/transactions", transactionsRoutes)
  .route("/accounts", accountRoutes)
  .route("/institutions", institutionRoutes);

app.route("/health", healthRoutes);
app.get("/ui", swaggerUI({ url: "/doc" }));
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Midday Engine API",
  },
});

export type ApiRoutes = typeof apiRoutes;

export default {
  scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // const delayedProcessing = async () => {
    //   // await cronTask(env);
    // };
    // ctx.waitUntil(delayedProcessing());
  },
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
};
