import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { bearerAuth } from "hono/bearer-auth";
import { cache } from "hono/cache";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import accounts from "./routes/accounts";
import institutions from "./routes/institutions";
import transactions from "./routes/transactions";

const app = new OpenAPIHono({
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
    // NOTE: Use https://unkey.dev when we accept customers
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

app.route("/v1/transactions", transactions);
app.route("/v1/accounts", accounts);
app.route("/v1/institutions", institutions);

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Midday Engine API",
  },
});

export default app;
