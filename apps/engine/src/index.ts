import type { Bindings } from "@/common/bindings";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "hono";
import { env } from "hono/adapter";
import { bearerAuth } from "hono/bearer-auth";
import { cache } from "hono/cache";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import accountRoutes from "./routes/accounts";
import authRoutes from "./routes/auth";
import healthRoutes from "./routes/health";
import institutionRoutes from "./routes/institutions";
import transactionsRoutes from "./routes/transactions";
import { syncInstitutions } from "./scheduled";
import { logger as customLogger } from "./utils/logger";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const PUBLIC_PATHS = ["/", "/openapi", "/health"];

app.use(
  (c, next) => {
    if (PUBLIC_PATHS.includes(c.req.path)) {
      return next();
    }

    const { API_SECRET_KEY } = env(c);
    const bearer = bearerAuth({ token: API_SECRET_KEY });

    return bearer(c, next);
  },
  (c, next) => {
    if (PUBLIC_PATHS.includes(c.req.path)) {
      return next();
    }

    return cache({
      cacheName: "engine",
      cacheControl: "max-age=3600",
    })(c, next);
  },
  secureHeaders(),
  logger(customLogger),
);

app
  .route("/transactions", transactionsRoutes)
  .route("/accounts", accountRoutes)
  .route("/institutions", institutionRoutes)
  .route("/auth", authRoutes);

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

app.get(
  "/",
  swaggerUI({
    url: "/openapi",
  }),
);

app.doc("/openapi", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "Midday Engine API",
  },
});

app.route("/health", healthRoutes);

export default {
  scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(syncInstitutions(env));
  },
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
};
