import { ErrorSchema } from "@/common/schema";
import { Provider } from "@/providers";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
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
  const { provider, accountId, accountType, latest, accessToken } =
    c.req.query();

  const api = new Provider({
    provider,
    fetcher: c.env.TELLER_CERT,
    kv: c.env.KV,
    envs,
  });

  try {
    const data = await api.getTransactions({
      accountId,
      accessToken,
      accountType,
      latest,
    });

    return c.json(
      {
        data,
      },
      200
    );
  } catch (error) {
    console.log(error);

    return c.json(
      {
        message: error.message,
      },
      400
    );
  }
});

export default app;
