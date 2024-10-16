import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { createErrorResponse } from "@/utils/error";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { GoCardLessExchangeBodySchema, GoCardLessExchangeSchema } from "./schema";

/**
 * OpenAPI route configuration for the GoCardLess Exchange API.
 * This route handles the exchange of tokens for GoCardLess.
 *
 * @remarks
 * The route expects a JSON payload and returns a GoCardLess exchange object on success.
 */
const route = createRoute({
    tags: ["gocardless"],
    operationId: "gocardlessExchangeApi",
    security: [{ bearerAuth: [] }],
    method: "post",
    path: "/v1/api.gocardless/exchange",
    summary: "Exchange token (GoCardLess)",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: GoCardLessExchangeBodySchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: GoCardLessExchangeSchema,
                },
            },
            description: "Retrieve Exchange",
        },
        ...ErrorResponses
    },
});

/**
 * Type representing the GoCardLess Exchange API route configuration.
 */
export type V1GoCardLessExchangeApiRoute = typeof route;

/**
 * Type representing the request body for the GoCardLess Exchange API.
 */
export type V1GoCardLessExchangeApiRequest = z.infer<
    (typeof route.request.body)["content"]["application/json"]["schema"]
>;

/**
 * Type representing the response for the GoCardLess Exchange API.
 */
export type V1GoCardLessExchangeApiResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the GoCardLess Exchange API route with the application.
 * 
 * @param {App} app - The Hono application instance.
 * @returns {void}
 * 
 * @remarks
 * This function sets up the OpenAPI route for exchanging GoCardLess tokens.
 * It handles the incoming request, interacts with the GoCardLess API, and returns the exchange data.
 */
export const registerV1GoCardLessExchangeApi = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);
        const { institutionId, transactionTotalDays } = await c.req.json();

        const api = new GoCardLessApi({
            kv: c.env.KV,
            r2: c.env.STORAGE,
            envs,
        });

        try {
            const data = await api.createEndUserAgreement({
                institutionId,
                transactionTotalDays,
            });

            return c.json({ data }, 200);
        } catch (error) {
            const { message, code } = createErrorResponse(error, c.get("requestId"));
            return c.json({
                error: {
                    message,
                    docs: "https://engineering-docs.solomon-ai.app/errors",
                    requestId: c.get("requestId"),
                    code,
                }
            }, 400);
        }
    });
};