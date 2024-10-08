import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { Provider } from "@/providers";
import { AccountType } from "@/utils/account";
import { createErrorResponse } from "@/utils/error";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
  GetRecurringTransactionsResponseSchema,
  RecurringTransactionsParamsSchema,
  TransactionsParamsSchema,
  TransactionsSchema,
} from "./schema";

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

const recurringTransactionsRoute = createRoute({
  method: "get",
  path: "/recurring",
  summary: "Get recurring transactions",
  request: {
    query: RecurringTransactionsParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GetRecurringTransactionsResponseSchema,
        },
      },
      description: "Retrieve recurring transactions",
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
      accountType: accountType as AccountType,
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

app.openapi(recurringTransactionsRoute, async (c) => {
  const envs = env(c);
  const { provider, accessToken, accountId } = c.req.valid("query");

  if (provider !== "plaid") {
    return c.json(
      createErrorResponse(
        new Error("Recurring transactions are only supported for Plaid"),
        c.get("requestId"),
      ),
      400,
    ) as any; // Type assertion to bypass strict type checking
  }

  const api = new Provider({
    provider,
    kv: c.env.KV,
    envs,
    r2: c.env.STORAGE,
  });

  try {
    const data = await api.getRecurringTransactions({
      accessToken,
      accountId,
    });

    return c.json(
      {
        data: {
          inflow: data.inflow || [],
          outflow: data.outflow || [],
          last_updated_at: data.last_updated_at || new Date().toISOString(),
        },
      },
      200,
    );
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

export default app;
