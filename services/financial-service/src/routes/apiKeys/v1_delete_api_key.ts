import { APIKeyRepository } from "@/data/apiKeyRepository";
import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { createRoute, z } from "@hono/zod-openapi";
import { Unkey } from "@unkey/api";
import { APIKeyParamsSchema, DeleteAPIKeySchema } from "./schema";

/**
 * OpenAPI route configuration for deleting an API key.
 * @constant
 */
const route = createRoute({
    tags: ["apis"],
    operationId: "deleteApiKey",
    method: "delete",
    path: "/v1/api.apiKeys",
    security: [{ bearerAuth: [] }],
    summary: "Delete API Key",
    request: {
        query: APIKeyParamsSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: DeleteAPIKeySchema,
                },
            },
            description: "API Key deleted successfully",
        },
        ...ErrorResponses
    },
});

export type V1DeleteApiKeyRoute = typeof route;
export type V1DeleteApiKeyRequest = z.infer<(typeof route.request.query)>;
export type V1DeleteApiKeyResponse = z.infer<(typeof route.responses)[200]["content"]["application/json"]["schema"]>;

/**
 * Registers the DELETE API key endpoint with the application.
 * 
 * This function sets up a route to handle the deletion of an API key. It performs the following steps:
 * 1. Validates the input query parameter (API key ID).
 * 2. Retrieves the API key from the database.
 * 3. Deletes the key from the Unkey service.
 * 4. Removes the key from the local database.
 * 
 * @param {App} app - The Hono application instance.
 * @throws {Error} Throws an error if the API key is not found.
 * @returns {void}
 */
export const registerV1DeleteApiKey = (app: App) => {
    app.openapi(route, async (c) => {
        const unkeyApi = new Unkey({ rootKey: c.env.UNKEY_API_KEY });
        const { db } = c.get("ctx");
        const { id } = c.req.valid("query");

        /**
         *  Retrieve the API key from the database.
         */
        const repository = c.get("repo")

        const apiKey = await repository.apiKey.getById(id);
        if (!apiKey) {
            throw new Error("API Key not found");
        }

        await unkeyApi.keys.delete({ keyId: apiKey.key });
        await repository.apiKey.delete(id);

        /**
         * @todo Add an audit log event for API key deletion events.
         * This can be useful for auditing and monitoring purposes.
         */

        /**
         * @todo Consider implementing a webhook or event system
         * to notify other parts of the application about deleted API keys.
         */

        return c.json({ success: true }, 200);
    });
};