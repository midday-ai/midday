import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { createErrorResponse } from "@/utils/error";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { GoCardLessAgreementBodySchema, GoCardLessAgreementSchema } from "./schema";

/**
 * OpenAPI route configuration for the GoCardLess Agreement API.
 * This route handles the creation of a GoCardLess agreement.
 *
 * @remarks
 * The route expects a JSON payload and returns a GoCardLess agreement object on success.
 */
const route = createRoute({
    tags: ["gocardless"],
    operationId: "gocardlessAgreementApi",
    security: [{ bearerAuth: [] }],
    method: "post",
    path: "/v1/api.gocardless/agreement",
    summary: "Agreement (GoCardLess)",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: GoCardLessAgreementBodySchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: GoCardLessAgreementSchema,
                },
            },
            description: "Retrieve Agreement",
        },
        ...ErrorResponses
    },
});

/**
 * Type representing the GoCardLess Agreement API route configuration.
 */
export type V1GoCardLessAgreementApiRoute = typeof route;

/**
 * Type representing the request body for the GoCardLess Agreement API.
 */
export type V1GoCardLessAgreementApiRequest = z.infer<
    (typeof route.request.body)["content"]["application/json"]["schema"]
>;

/**
 * Type representing the response for the GoCardLess Agreement API.
 */
export type V1GoCardLessAgreementApiResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the GoCardLess Agreement API route with the application.
 * 
 * @param {App} app - The Hono application instance.
 * @returns {void}
 * 
 * @remarks
 * This function sets up the OpenAPI route for creating a GoCardLess agreement.
 * It handles the incoming request, interacts with the GoCardLess API, and returns the agreement data.
 */
export const registerV1GoCardLessAgreementApi = (app: App) => {
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