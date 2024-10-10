import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { PlaidApi } from "@/providers/plaid/plaid-api";
import { createErrorResponse } from "@/utils/error";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { PlaidLinkBodySchema, PlaidLinkSchema } from "./schema";

/**
 * OpenAPI route configuration for the Plaid Link API.
 * This route handles the creation of a Plaid link for user authentication.
 *
 * @remarks
 * The route uses bearer token authentication and expects a JSON payload.
 * It returns a Plaid link object on success.
 */
const route = createRoute({
    tags: ["apis"],
    operationId: "plaidLinkApi",
    security: [{ bearerAuth: [] }],
    method: "post",
    path: "/plaid/link",
    summary: "Auth Link (Plaid)",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: PlaidLinkBodySchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: PlaidLinkSchema,
                },
            },
            description: "Retrieve Link",
        },
        ...ErrorResponses
    },
});

/**
 * Type representing the Plaid Link API route configuration.
 * This type is derived from the `route` object and can be used for type checking and inference.
 */
export type V1ApisPlaidLinkApiRoute = typeof route;

/**
 * Type representing the request body for the Plaid Link API.
 * This type is inferred from the request body schema defined in the route configuration.
 *
 * @typedef {z.infer<(typeof route.request.body)["content"]["application/json"]["schema"]>} V1ApisPlaidLinkApiRequest
 */
export type V1ApisPlaidLinkApiRequest = z.infer<
    (typeof route.request.body)["content"]["application/json"]["schema"]
>;

/**
 * Type representing the response for the Plaid Link API.
 * This type is inferred from the 200 OK response schema defined in the route configuration.
 *
 * @typedef {z.infer<(typeof route.responses)[200]["content"]["application/json"]["schema"]>} V1ApisPlaidLinkApiApiResponse
 */
export type V1ApisPlaidLinkApiResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the Plaid Link API route with the application.
 * 
 * @param {App} app - The Hono application instance.
 * @returns {void}
 * 
 * @remarks
 * This function sets up the OpenAPI route for creating a Plaid link token.
 * It handles the incoming request, interacts with the Plaid API, and returns the link token data.
 * 
 * @example
 * ```typescript
 * const app = new App();
 * registerV1ApisPlaidLinkccountsApi(app);
 * ```
 */
export const registerV1ApisPlaidLinkAccountsApi = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);

        // Extract request body parameters
        const { userId, language, accessToken } = await c.req.json();

        // Initialize Plaid API client
        const api = new PlaidApi({
            kv: c.env.KV,
            r2: c.env.STORAGE,
            envs,
        });

        try {
            // Create Plaid link token
            const { data } = await api.linkTokenCreate({
                userId,
                language,
                accessToken,
            });

            // Return the link token data
            return c.json(
                {
                    data,
                },
                200,
            );
        } catch (error) {
            const { message, code } = createErrorResponse(error, c.get("requestId"));
            return c.json({
                error: {
                    message,
                    docs: "https://api.example.com/docs/errors",
                    requestId: c.get("requestId"),
                    code,
                }
            }, 400);
        }
    });
}

