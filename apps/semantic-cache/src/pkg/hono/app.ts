import { Hono, type Context as GenericContext } from "hono";

import type { HonoEnv } from "./env";

export function newApp() {
  const app = new Hono<HonoEnv>();

  app.use("*", (c, next) => {
    c.set(
      "location",
      c.req.header("True-Client-IP") ?? c.req.header("CF-Connecting-IP") ?? "",
    );
    c.set("userAgent", c.req.header("User-Agent"));

    return next();
  });

  return app;
}

export type App = ReturnType<typeof newApp>;
export type Context = GenericContext<HonoEnv>;
