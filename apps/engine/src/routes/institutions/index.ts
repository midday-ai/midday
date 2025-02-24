import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import type { Providers } from "@/providers/types";
import { createErrorResponse } from "@/utils/error";
import { SearchClient } from "@/utils/search";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
  InstitutionParamsSchema,
  InstitutionsSchema,
  UpdateUsageParamsSchema,
  UpdateUsageSchema,
} from "./schema";
import { excludedInstitutions } from "./utils";

type Document = {
  id: string;
  name: string;
  logo: string | null;
  available_history: number | null;
  provider: Providers;
  popularity: number;
};

type SearchResult = {
  hits: {
    document: Document;
  }[];
};

const app = new OpenAPIHono<{ Bindings: Bindings }>()
  .openapi(
    createRoute({
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
    }),
    async (c) => {
      const envs = env(c);
      const { countryCode, q = "*", limit = "50" } = c.req.valid("query");

      const typesense = SearchClient(envs);

      const searchParameters = {
        q,
        query_by: "name",
        filter_by: `countries:=[${countryCode}]`,
        limit: +limit,
        sort_by: "popularity:desc",
      };

      try {
        const result = await typesense
          .collections("institutions")
          .documents()
          .search(searchParameters);

        const resultString: string =
          typeof result === "string" ? result : JSON.stringify(result);

        const data: SearchResult = JSON.parse(resultString);

        const filteredInstitutions = data.hits.filter(
          ({ document }) => !excludedInstitutions.includes(document.id),
        );

        return c.json(
          {
            data: filteredInstitutions.map(({ document }) => ({
              id: document.id,
              name: document.name,
              logo: document.logo ?? null,
              popularity: document.popularity,
              available_history: document.available_history
                ? +document.available_history
                : null,
              provider: document.provider,
            })),
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
      method: "put",
      path: "/{id}/usage",
      summary: "Update Institution Usage",
      request: {
        params: UpdateUsageParamsSchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: UpdateUsageSchema,
            },
          },
          description: "Update institution usage",
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
      const id = c.req.param("id");

      const typesense = SearchClient(envs);

      try {
        const original = await typesense
          .collections("institutions")
          .documents(id)
          .retrieve();

        const result = await typesense
          .collections("institutions")
          .documents(id)
          .update({
            // @ts-ignore
            popularity: (original?.popularity ?? 0) + 1,
          });

        const data: Document =
          typeof result === "string" ? JSON.parse(result) : [];

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
