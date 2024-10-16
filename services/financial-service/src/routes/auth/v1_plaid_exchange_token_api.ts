import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { PlaidApi } from "@/providers/plaid/plaid-api";
import { createErrorResponse } from "@/utils/error";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { PlaidExchangeBodySchema, PlaidExchangeSchema } from "./schema";

/**
 * OpenAPI route configuration for the Plaid token exchange endpoint.
 * This route handles the exchange of a public token for an access token.
 */
const route = createRoute({
    tags: ["plaid"],
    operationId: "plaidExchangeTokenApi",
    security: [{ bearerAuth: [] }],
    method: "post",
    path: "/v1/api.plaid/exchange",
    summary: "Exchange token (Plaid)",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: PlaidExchangeBodySchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: PlaidExchangeSchema,
                },
            },
            description: "Retrieve Exchange",
        },
        ...ErrorResponses
    },
});

export type V1ApisPlaidExchangeTokenApiRoute = typeof route;
export type V1ApisPlaidExchangeTokenApiRequest = z.infer<
    (typeof route.request.body)["content"]["application/json"]["schema"]
>;
export type V1ApisPlaidExchangeTokenApiResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the Plaid token exchange API route with the application.
 * 
 * This function sets up an OpenAPI route that handles the exchange of a Plaid
 * public token for an access token. It uses the PlaidApi to perform the exchange
 * and handles both successful and error responses.
 * 
 * @param app - The Hono application instance to register the route with.
 */
export const registerV1ApisPlaidExchangeTokenApi = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);

        // Extract the public token from the request body
        const { token } = await c.req.json();

        // Initialize the PlaidApi with necessary dependencies
        const api = new PlaidApi({
            kv: c.env.KV,
            r2: c.env.STORAGE,
            envs,
        });

        try {
            // Attempt to exchange the public token for an access token
            const data = await api.itemPublicTokenExchange({
                publicToken: token,
            });

            // Return the successful response
            return c.json(data, 200);
        } catch (error) {
            // Handle any errors that occur during the token exchange
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
}
