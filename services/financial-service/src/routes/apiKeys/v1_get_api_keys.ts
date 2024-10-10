import { APIKeyRepository } from "@/data/apiKeyRepository";
import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { createRoute, z } from "@hono/zod-openapi";
import { APIKeysQuerySchema, APIKeysSchema } from "./schema";

/**
 * OpenAPI route configuration for retrieving API keys.
 * @constant
 */
const route = createRoute({
    tags: ["apis"],
    operationId: "getApiKeys",
    method: "get",
    path: "/v1/api.apiKeys",
    security: [{ bearerAuth: [] }],
    summary: "Get API Keys",
    request: {
        query: APIKeysQuerySchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: APIKeysSchema,
                },
            },
            description: "Retrieve API Keys",
        },
        ...ErrorResponses
    },
});

export type V1GetApiKeysRoute = typeof route;
export type V1GetApiKeysResponse = z.infer<(typeof route.responses)[200]["content"]["application/json"]["schema"]>;

/**
 * Registers the GET API keys endpoint with the application.
 * 
 * This function sets up a route to handle the retrieval of API keys for a specific user. It performs the following steps:
 * 1. Extracts the database connection from the context.
 * 2. Retrieves the userId from the query parameters.
 * 3. Fetches the API keys associated with the userId from the database.
 * 
 * @param {App} app - The Hono application instance.
 * @returns {void}
 * 
 * @example
 * // Usage in main application file
 * import { registerV1GetApiKeys } from './routes/apiKeys/v1_get_api_keys';
 * 
 * const app = new App();
 * registerV1GetApiKeys(app);
 */
export const registerV1GetApiKeys = (app: App) => {
    app.openapi(route, async (c) => {        
        /**
         * Extract the userId from the validated query parameters.
         * @type {string}
         */
        const query = c.req.valid("query");
        const { userId } = query;

        /**
         * Retrieve the API key repository from the context.
         * @type {APIKeyRepository}
         */ 
        const repository = c.get("repo")
        
        /**
         * Fetch API keys associated with the userId.
         * @type {Array<APIKey>}
         */
        const apiKeys = await repository.apiKey.getByUserId(userId);

        /**
         * @todo Implement caching for API keys in Redis.
         * Specifically, cache the active, non-revoked keys for improved performance.
         * 
         * Example implementation:
         * const redisClient = c.get('redis');
         * await redisClient.set(`user:${userId}:apiKeys`, JSON.stringify(apiKeys));
         */

        return c.json({ data: apiKeys }, 200);
    });
};