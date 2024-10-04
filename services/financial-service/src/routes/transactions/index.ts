import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { Provider } from "@/providers";
import { createErrorResponse } from "@/utils/error";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { TransactionsParamsSchema, TransactionsSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const indexRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get transactions",
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
    c.req.valid("query");

  const api = new Provider({
    provider,
    fetcher: c.env.TELLER_CERT,
    kv: c.env.KV,
    envs,
    r2: c.env.BANK_STATEMENTS,
  });

  try {
    const data = await api.getTransactions({
      accountId, // For Stripe, this will be the account holder reference
      accessToken,
      accountType,
      latest,
    });

    return c.json(
      {
        data,
      },
      200,
    );
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

export default app;
