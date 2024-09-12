import type { MiddlewareHandler } from "hono";

import type { HonoEnv } from "../hono/env";

export function ratelimit(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const key = c.req.header("Authorization") ?? "anonymous";

    const { success } = await c.env.RL_FREE.limit({ key });

    if (!success) {
      return new Response("ratelimited, please try again alter", {
        status: 429,
      });
    }

    return await next();
  };
}
