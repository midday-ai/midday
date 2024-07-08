import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { Provider } from "@/providers";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { InstitutionsSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const indexRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get Institutions",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: InstitutionsSchema,
        },
      },
      description: "Retrieve institutions",
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
  // const { countryCode } =
  //   c.req.valid("query");

  // const api = new Provider({
  //   provider,
  //   fetcher: c.env.TELLER_CERT,
  //   kv: c.env.KV,
  //   envs,
  // });

  // const data = await api.getTransactions({
  //   accountId,
  //   accessToken,
  //   accountType,
  //   latest,
  // });

  return c.json(
    {
      data: [],
    },
    200
  );
});

export default app;
