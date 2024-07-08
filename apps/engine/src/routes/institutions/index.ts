import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { InstitutionParamsSchema, InstitutionsSchema } from "./schema";
import { getInstitutions } from "./utils";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const indexRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get Institutions",
  request: {
    query: InstitutionParamsSchema,
  },
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
  const { countryCode } = c.req.valid("query");

  const data = await getInstitutions({
    kv: c.env.KV,
    fetcher: c.env.TELLER_CERT,
    storage: c.env.STORAGE.put,
    envs,
    countryCode,
  });

  return c.json(
    {
      data,
    },
    200
  );
});

export default app;
