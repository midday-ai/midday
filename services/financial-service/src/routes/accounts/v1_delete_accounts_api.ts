import { openApiErrorResponses as ErrorResponses, errorSchemaFactory } from "@/errors";
import { App } from "@/hono/app";
import { Provider } from "@/providers";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
    DeleteAccountsParamsSchema,
    DeleteSchema
} from "./schema";

const route = createRoute({
    tags: ["apis"],
    operationId: "deleteAccountsApi",
    method: "delete",
    path: "/v1/api.accountsApi",
    security: [{ bearerAuth: [] }],
    summary: "Delete Accounts",
    request: {
        query: DeleteAccountsParamsSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: DeleteSchema,
                },
            },
            description: "Delete accounts",
        },
        ...ErrorResponses,
        429: {
            description: "The api is protected from deletions",
            content: {
                "application/json": {
                    schema: errorSchemaFactory(z.enum(["DELETE_PROTECTED"])).openapi("ErrDeleteProtected"),
                },
            },
        },
    },
});


export type V1ApisDeleteAccountsApiRoute = typeof route;
export type V1ApisDeleteAccountsApiRequest = z.infer<
    (typeof route.request.query)
>;
export type V1ApisDeleteAccountsApiResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;


/**
 * Registers the DELETE /v1/api.deleteAccountsApi endpoint with the Hono app.
 * This endpoint allows for the deletion of user accounts.
 *
 * @param app - The Hono application instance.
 *
 * @remarks
 * This function sets up an OpenAPI route for deleting accounts. It expects query parameters
 * for the provider, accountId, and accessToken. The function uses these parameters to
 * authenticate and perform the account deletion operation.
 *
 * @throws {Error} Throws an error if the account deletion fails.
 *
 * @example
 * ```typescript
 * const app = new Hono();
 * registerV1ApisDeleteAccountsApi(app);
 * ```
 */
export const registerV1ApisDeleteAccountsApi = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);
        const { provider, accountId, accessToken } = c.req.valid("query");

        const api = new Provider({
            provider,
            fetcher: c.env.TELLER_CERT,
            kv: c.env.KV,
            r2: c.env.BANK_STATEMENTS,
            envs,
        });

        // Perform the account deletion
        await api.deleteAccounts({
            accessToken,
            accountId,
        });

        // Return a success response
        return c.json(
            {
                success: true,
            },
            200,
        );
    });
}
