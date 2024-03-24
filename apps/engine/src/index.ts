import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { bearerAuth } from "hono/bearer-auth";
import { cache } from "hono/cache";
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
  "/*",
  (c, next) => {
    const { SECRET_KEY } = env<{ SECRET_KEY: string }>(c);
    const bearer = bearerAuth({ token: SECRET_KEY });
    return bearer(c, next);
  },
  cache({
    cacheName: "engine",
    cacheControl: "max-age=3600",
  })
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
