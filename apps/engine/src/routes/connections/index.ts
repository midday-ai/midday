import type { Bindings } from "@/common/bindings";
import { ErrorSchema, Providers } from "@/common/schema";
import { Provider } from "@/providers";
import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { createErrorResponse } from "@/utils/error";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
  ConnectionByReferenceParamsSchema,
  ConnectionByReferenceSchema,
  ConnectionDeletedSchema,
  ConnectionStatusQuerySchema,
  ConnectionStatusSchema,
  DeleteConnectionBodySchema,
  GoCardLessConnectionsSchema,
} from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>()
  .openapi(
    createRoute({
      method: "get",
      path: "/status",
      summary: "Get Connection Status",
      request: {
        query: ConnectionStatusQuerySchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: ConnectionStatusSchema,
            },
          },
          description: "Retrieve connection status",
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

      const { id, provider, accessToken } = c.req.valid("query");

      const api = new Provider({
        provider,
        kv: c.env.KV,
        fetcher: c.env.TELLER_CERT,
        envs,
      });

      try {
        const data = await api.getConnectionStatus({
          id,
          accessToken,
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
      path: "/delete",
      summary: "Delete Connection",
      request: {
        body: {
          content: {
            "application/json": {
              schema: DeleteConnectionBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: ConnectionDeletedSchema,
            },
          },
          description: "Connection deleted successfully",
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
      const { id, provider, accessToken } = await c.req.json();

      const api = new Provider({
        provider,
        kv: c.env.KV,
        fetcher: c.env.TELLER_CERT,
        envs,
      });

      try {
        await api.deleteConnection({
          id,
          accessToken,
        });

        return c.json(
          {
            data: {
              success: true,
            },
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
      path: "/gocardless",
      summary: "Get GoCardless Connections",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GoCardLessConnectionsSchema,
            },
          },
          description: "Retrieve GoCardless connections",
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

      const api = new GoCardLessApi({
        kv: c.env.KV,
        envs,
      });

      try {
        const data = await api.getRequisitions();

        return c.json(
          {
            count: data.count,
            next: data.next,
            previous: data.previous,
            results: data.results,
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
      path: "/:reference",
      summary: "Get Connection by Reference",
      request: {
        params: ConnectionByReferenceParamsSchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: ConnectionByReferenceSchema,
            },
          },
          description: "Retrieve connection by reference",
        },
        404: {
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
          description: "Connection not found",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
          description: "Connection not found",
        },
      },
    }),
    async (c) => {
      const envs = env(c);
      const { reference } = c.req.valid("param");
      const requestId = c.get("requestId");

      const api = new GoCardLessApi({
        kv: c.env.KV,
        envs,
      });

      try {
        const data = await api.getRequiestionByReference(reference);

        if (!data) {
          return c.json(
            {
              code: "NOT_FOUND",
              message: "Connection not found",
              requestId,
            },
            404,
          );
        }

        return c.json({ data: { id: data.id, accounts: data.accounts } }, 200);
      } catch (error) {
        const errorResponse = createErrorResponse(error, requestId);
        return c.json(errorResponse, 400);
      }
    },
  );

export default app;
