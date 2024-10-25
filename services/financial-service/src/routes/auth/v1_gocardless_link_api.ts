import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { createErrorResponse } from "@/utils/error";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { GoCardLessLinkBodySchema, GoCardLessLinkSchema } from "./schema";
import { Routes } from "@/route-definitions/routes";

/**
 * OpenAPI route configuration for the GoCardLess Link API.
 * This route handles the creation of a GoCardLess link for user authentication.
 *
 * @remarks
 * The route expects a JSON payload and returns a GoCardLess link object on success.
 */
const route = createRoute({
  tags: [...Routes.Auth.gocardlessLink.tags],
  operationId: Routes.Auth.gocardlessLink.operationId,
  security: [{ bearerAuth: [] }],
  method: Routes.Auth.gocardlessLink.method,
  path: Routes.Auth.gocardlessLink.path,
  summary: Routes.Auth.gocardlessLink.summary,
  request: {
    body: {
      content: {
        "application/json": {
          schema: GoCardLessLinkBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GoCardLessLinkSchema,
        },
      },
      description: "Retrieve Link",
    },
    ...ErrorResponses,
  },
});

/**
 * Type representing the GoCardLess Link API route configuration.
 */
export type V1GoCardLessLinkApiRoute = typeof route;

/**
 * Type representing the request body for the GoCardLess Link API.
 */
export type V1GoCardLessLinkApiRequest = z.infer<
  (typeof route.request.body)["content"]["application/json"]["schema"]
>;

/**
 * Type representing the response for the GoCardLess Link API.
 */
export type V1GoCardLessLinkApiResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the GoCardLess Link API route with the application.
 *
 * @param {App} app - The Hono application instance.
 * @returns {void}
 *
 * @remarks
 * This function sets up the OpenAPI route for creating a GoCardLess link.
 * It handles the incoming request, interacts with the GoCardLess API, and returns the link data.
 */
export const registerV1GoCardLessLinkApi = (app: App) => {
  app.openapi(route, async (c) => {
    const envs = env(c);
    const { institutionId, agreement, redirect } = await c.req.json();

    const api = new GoCardLessApi({
      kv: c.env.KV,
      r2: c.env.STORAGE,
      envs,
    });

    try {
      const data = await api.buildLink({
        institutionId,
        agreement,
        redirect,
      });

      return c.json({ data }, 200);
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
