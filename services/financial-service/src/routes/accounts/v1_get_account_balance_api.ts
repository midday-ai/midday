import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { Provider } from "@/providers";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
    AccountBalanceParamsSchema,
    AccountBalanceSchema
} from "./schema";

const route = createRoute({
    tags: ["financial-accounts"],
    operationId: "query.financial.accounts.balance",
    method: "get",
    path: "/v1/api.financial.accounts/balance",
    security: [{ bearerAuth: [] }],
    summary: "Get Account Balance",
    request: {
        query: AccountBalanceParamsSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: AccountBalanceSchema,
                },
            },
            description: "Retrieve account balance",
        },
        ...ErrorResponses
    },
});


export type V1ApisGetAccountsBalanceApiRoute = typeof route;
export type V1ApisGetAccountsBalanceRequest = z.infer<
    (typeof route.request.query)
>;
export type V1ApisGetAccountsBalanceResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the GET /v1/api.getAccountBalanceApi endpoint with the Hono app.
 * 
 * This endpoint retrieves the account balance for a specific account based on the provided query parameters.
 * It uses the Provider class to fetch the account balance data from the specified provider.
 * 
 * @param app - The Hono app instance to register the route with.
 * 
 * @throws {Error} If there's an issue with the Provider initialization or data retrieval.
 * @throws {ValidationError} If the query parameters fail validation.
 * 
 * @remarks
 * The function expects the following query parameters:
 * - provider: The name of the financial data provider.
 * - accessToken: The access token for authentication with the provider.
 * - id: The unique identifier of the account.
 * 
 * The function uses the following environment variables:
 * - TELLER_CERT: Certificate for secure communication.
 * - KV: Key-Value storage for caching or storing temporary data.
 * - BANK_STATEMENTS: R2 storage for bank statements.
 * 
 * @example
 * // Usage in app setup
 * const app = new Hono();
 * registerV1ApisGetAccountBalanceApi(app);
 * 
 * // Example API call
 * // GET /v1/api.getAccountBalanceApi?provider=exampleBank&accessToken=abc123&id=account123
 */
export const registerV1ApisGetAccountBalanceApi = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);
        const { provider, accessToken, id } = c.req.valid("query");

        const api = new Provider({
            provider,
            fetcher: c.env.TELLER_CERT,
            kv: c.env.KV,
            r2: c.env.BANK_STATEMENTS,
            envs,
        });

        // Fetch account data using the Provider
        const data = await api.getAccountBalance({
            accessToken,
            accountId: id,
        });

        return c.json(
            {
                data,
            },
            200,
        );
    });
}
