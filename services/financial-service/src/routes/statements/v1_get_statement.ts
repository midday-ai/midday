import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { Provider } from "@/providers";
import { createErrorResponse } from "@/utils/error";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { StatementsParamsSchema, StatementsSchema } from "./schema";

/**
 * Route definition for retrieving statements.
 * @description This route handles GET requests to fetch statements based on the provided query parameters.
 */
const route = createRoute({
    tags: ["api", "statements"],
    operationId: "getStatementsApi",
    method: "get",
    security: [{ bearerAuth: [] }],
    path: "/v1/api.statements",
    summary: "Get Statements",
    request: {
        query: StatementsParamsSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: StatementsSchema,
                },
            },
            description: "Retrieve statements",
        },
        ...ErrorResponses
    },
});

export type GetStatementsApiRoute = typeof route;
export type GetStatementsApiRequest = z.infer<
    (typeof route.request.query)
>;
export type GetStatementsApiResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the Get Statements API route with the application.
 * 
 * This function sets up an OpenAPI route that allows clients to search for and retrieve
 * statement data based on specified criteria.
 *
 * @param {App} app - The Hono application instance to register the route with.
 * 
 * @throws {Error} If there's an issue with the Typesense search or data processing.
 * 
 * @example
 * const app = new Hono();
 * registerGetStatementsApi(app);
 */
export const registerGetStatementsApi = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);
        const { provider, accessToken, accountId, userId, teamId } =
            c.req.valid("query");

        const api = new Provider({
            provider,
            kv: c.env.KV,
            fetcher: c.env.TELLER_CERT,
            r2: c.env.BANK_STATEMENTS,
            envs,
        });

        try {
            const { statements } = await api.getStatements({
                accessToken,
                accountId,
                userId,
                teamId,
            });

            return c.json({
                data: statements.map(statement => ({
                    account_id: statement.account_id,
                    statement_id: statement.statement_id,
                    month: statement.month,
                    year: statement.year
                })),
            }, 200);
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
}