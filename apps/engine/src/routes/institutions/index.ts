import { ErrorSchema } from "@/common/schema";
import { Provider } from "@/providers";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { SearchSchema } from "./schema";

const app = new OpenAPIHono();

const indexRoute = createRoute({
  method: "get",
  path: "/search",
  summary: "Search Institutions",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SearchSchema,
        },
      },
      description: "Search insitutions",
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

  const data = await api.getHealthCheck({
    fetcher: c.env.TELLER_CERT,
    envs,
  });

  const isHealthy = Object.values(data).every((service) => service.healthy);

  return c.json(data, isHealthy ? 200 : 400);
});

export default app;
