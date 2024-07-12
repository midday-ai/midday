import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import type { Providers } from "@/providers/types";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import Typesense from "typesense";
import { InstitutionParamsSchema, InstitutionsSchema } from "./schema";

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

type SearchResult = {
  hits: {
    document: {
      id: string;
      name: string;
      logo: string | null;
      available_history: number | null;
      provider: Providers;
    };
  }[];
};

app.openapi(indexRoute, async (c) => {
  const envs = env(c);
  const { countryCode, q = "*", limit = "50" } = c.req.valid("query");

  const typesense = new Typesense.Client({
    nearestNode: {
      host: envs.TYPESENSE_ENDPOINT!,
      port: 443,
      protocol: "https",
    },
    nodes: [
      { host: envs.TYPESENSE_ENDPOINT_US!, port: 443, protocol: "https" },
      { host: envs.TYPESENSE_ENDPOINT_EU!, port: 443, protocol: "https" },
      { host: envs.TYPESENSE_ENDPOINT_AU!, port: 443, protocol: "https" },
    ],
    apiKey: envs.TYPESENSE_API_KEY,
    connectionTimeoutSeconds: 2,
  });

  const searchParameters = {
    q,
    query_by: "name",
    filter_by: `countries:=[${countryCode}]`,
    limit: +limit,
  };

  const result = await typesense
    .collections("institutions")
    .documents()
    .search(searchParameters);

  const resultString: string =
    typeof result === "string" ? result : JSON.stringify(result);

  const data: SearchResult = JSON.parse(resultString);

  return c.json(
    {
      data: data.hits?.map(({ document }) => ({
        id: document.id,
        name: document.name,
        logo: document.logo,
        available_history: document.available_history
          ? +document.available_history
          : null,
        provider: document.provider,
      })),
    },
    200,
  );
});

export default app;
