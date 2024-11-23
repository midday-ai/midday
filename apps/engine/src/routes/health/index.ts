import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { Provider } from "@/providers";
import { getHealthCheck } from "@/utils/search";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { HealthSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Health",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: HealthSchema,
          },
        },
        description: "Retrieve health",
      },
      400: {
        content: {
          "application/json": {
            schema: ErrorSchema,
          },
        },
        description: "Returns an error",
      },
    },
  }),
  async (c) => {
    const envs = env(c);

    const api = new Provider();

    const providers = await api.getHealthCheck({
      kv: c.env.KV,
      fetcher: c.env.TELLER_CERT,
      envs,
    });

    const search = await getHealthCheck(envs);

    const allServices = {
      ...providers,
      search,
    };

    const isHealthy = Object.values(allServices).every(
      (service) => service.healthy,
    );

    if (isHealthy) {
      return c.json(
        {
          data: allServices,
        },
        200,
      );
    }

    return c.json(
      {
        requestId: c.get("requestId"),
        message: "Service unhelthy",
        code: "bad_request",
      },
      400,
    );
  },
);

export default app;
