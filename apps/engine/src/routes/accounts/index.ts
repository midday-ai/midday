import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { Provider } from "@/providers";
import { createErrorResponse } from "@/utils/error";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
  AccountBalanceParamsSchema,
  AccountBalanceSchema,
  AccountsParamsSchema,
  AccountsSchema,
  DeleteAccountsParamsSchema,
  DeleteSchema,
} from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>()
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      summary: "Get Accounts",
      request: {
        query: AccountsParamsSchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: AccountsSchema,
            },
          },
          description: "Retrieve accounts",
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

      const { provider, accessToken, institutionId, id } = c.req.valid("query");

      const api = new Provider({
        provider,
        kv: c.env.KV,
        fetcher: c.env.TELLER_CERT,
        envs,
      });

      try {
        const data = await api.getAccounts({
          id,
          accessToken,
          institutionId,
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
    },
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/",
      summary: "Delete Accounts",
      request: {
        query: DeleteAccountsParamsSchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: DeleteSchema,
            },
          },
          description: "Retrieve accounts",
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
      const { provider, accountId, accessToken } = c.req.valid("query");

      const api = new Provider({
        provider,
        fetcher: c.env.TELLER_CERT,
        kv: c.env.KV,
        envs,
      });

      try {
        await api.deleteAccounts({
          accessToken,
          accountId,
        });

        return c.json(
          {
            success: true,
          },
          200,
        );
      } catch (error) {
        const errorResponse = createErrorResponse(error, c.get("requestId"));

        return c.json(errorResponse, 400);
      }
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/balance",
      summary: "Get Account Balance",
      request: {
        query: AccountBalanceParamsSchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: AccountBalanceSchema,
            },
          },
          description: "Retrieve account balance",
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
      const { provider, accessToken, id } = c.req.valid("query");

      const api = new Provider({
        provider,
        fetcher: c.env.TELLER_CERT,
        kv: c.env.KV,
        envs,
      });

      try {
        const data = await api.getAccountBalance({
          accessToken,
          accountId: id,
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
    },
  );

export default app;
