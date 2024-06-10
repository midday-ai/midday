import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { bearerAuth } from "hono/bearer-auth";
import { cache } from "hono/cache";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import accountRoutes from "./routes/accounts";
import healthRoutes from "./routes/health";
import institutionRoutes from "./routes/institutions";
import transactionsRoutes from "./routes/transactions";

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
  (c, next) => {
    const { API_SECRET_KEY } = env<{ API_SECRET_KEY: string }>(c);
    const bearer = bearerAuth({ token: API_SECRET_KEY });

    return bearer(c, next);
  },
  secureHeaders(),
  logger(),
  cache({
    cacheName: "engine",
    cacheControl: "max-age=3600",
  }),
  prettyJSON()
);

app.route("/v1/transactions", transactionsRoutes);
app.route("/v1/accounts", accountRoutes);
app.route("/v1/institutions", institutionRoutes);
app.route("/v1/health", healthRoutes);

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Midday Engine API",
  },
});

export default app;
