import { ErrorSchema } from "@/common/schema";
import { Provider } from "@/providers";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { TransactionsParamsSchema, TransactionsSchema } from "./schema";

const app = new OpenAPIHono();

const indexRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    query: TransactionsParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionsSchema,
        },
      },
      description: "Retrieve transactions",
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
  const { provider, ...rest } = c.req.query();

  console.log(rest);

  const api = new Provider({
    provider,
    envs,
  });

  const data = await api.getTransactions(rest);

  return c.json(
    {
      data,
    },
    200
  );
});

export default app;
