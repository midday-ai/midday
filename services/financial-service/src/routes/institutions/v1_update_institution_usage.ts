import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { createErrorResponse } from "@/utils/error";
import { SearchClient } from "@/utils/search";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { UpdateUsageParamsSchema, UpdateUsageSchema } from "./schema";
import { Document } from "./types";
import { Routes } from "@/route-definitions/routes";

/**
 * Creates the OpenAPI route configuration for updating institution usage.
 */
export const route = createRoute({
  tags: [...Routes.Institutions.updateUsage.tags],
  operationId: Routes.Institutions.updateUsage.operationId,
  security: [{ bearerAuth: [] }],
  method: Routes.Institutions.updateUsage.method,
  path: Routes.Institutions.updateUsage.path,
  summary: Routes.Institutions.updateUsage.summary,
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
    ...ErrorResponses,
  },
});

export type V1UpdateInstitutionApiRoute = typeof route;
export type V1UpdateInstitutionApiRequest = z.infer<
  typeof route.request.params
>;
export type V1UpdateInstitutionApiResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the Update Institution Usage API route with the application.
 *
 * @param app - The OpenAPIHono application instance.
 */
export const registerUpdateInstitutionUsageRoute = (app: App) => {
  app.openapi(route, async (c) => {
    const envs = env(c);
    const id = c.req.param("id");

    const typesense = SearchClient(envs);

    try {
      const original = await typesense
        .collections("institutions")
        .documents(id)
        .retrieve();

      const originalData: Document =
        typeof original === "string" && JSON.parse(original);

      const result = await typesense
        .collections("institutions")
        .documents(id)
        .update({
          popularity: originalData?.popularity + 1 || 0,
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
      const { message, code } = createErrorResponse(error, c.get("requestId"));
      return c.json(
        {
          error: {
            message,
            docs: "https://engineering-docs.solomon-ai.app/errors",
            requestId: c.get("requestId"),
            code,
          },
        },
        400,
      );
    }
  });
};
