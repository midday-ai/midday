import { ErrorSchema } from "@/common/schema";
import { app } from "@/index";
import { Provider } from "@/providers";
import { createRoute } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { HealthSchema } from "./schema";

const indexRoute = createRoute({
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
});

app.openapi(indexRoute, async (c) => {
  const envs = env(c);

  const api = new Provider();

  try {
    const data = await api.getHealthCheck({
      fetcher: c?.env?.TELLER_CERT,
      envs,
    });

    const isHealthy = Object.values(data).every((service) => service.healthy);

    if (isHealthy) {
      return c.json(data, 200);
    }

    return c.json(
      {
        message: error.message,
        code: 400,
      },
      400
    );
  } catch (error) {
    return c.json(
      {
        message: error.message,
        code: 400,
      },
      400
    );
  }
});

export default app;
