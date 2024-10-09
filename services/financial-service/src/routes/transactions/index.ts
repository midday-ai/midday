import type { Bindings } from "@/common/bindings";
import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { HonoEnv } from "@/hono/env";
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

/**
 * OpenAPI Hono application for handling transaction-related routes.
 */
const app = new OpenAPIHono<HonoEnv>();

/**
 * Route configuration for retrieving transactions.
 */
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
       ...ErrorResponses

  },
});

/**
 * Route configuration for retrieving recurring transactions.
 */
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
       ...ErrorResponses

  },
});

/**
 * Handler for the index route to retrieve transactions.
 * @param c - The context object containing request and environment information.
 * @returns A JSON response with transaction data or an error.
 */
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

/**
 * Handler for the recurring transactions route.
 * @param c - The context object containing request and environment information.
 * @returns A JSON response with recurring transaction data or an error.
 */
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
