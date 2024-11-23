import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { Provider } from "@/providers";
import { createErrorResponse } from "@/utils/error";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { ConnectionStatusQuerySchema, ConnectionStatusSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
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
);

export default app;
