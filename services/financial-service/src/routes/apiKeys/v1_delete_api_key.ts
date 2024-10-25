import { openApiErrorResponses as ErrorResponses, ServiceApiError } from "@/errors";
import { App } from "@/hono/app";
import { getApiKeyCacheKeyReference, getUserApiKeyCacheKeyReference } from "@/middleware/auth";
import { Routes } from "@/route-definitions/routes";
import { createRoute, z } from "@hono/zod-openapi";
import { APIKeyParamsSchema, DeleteAPIKeySchema } from "./schema";

/**
 * OpenAPI route configuration for deleting an API key.
 * @constant
 */
const route = createRoute({
  tags: [...Routes.ApiKeys.revoke.tags],
  operationId: Routes.ApiKeys.revoke.operationId,
  method: Routes.ApiKeys.revoke.method,
  path: Routes.ApiKeys.revoke.path,
  security: [{ bearerAuth: [] }],
  summary: Routes.ApiKeys.revoke.summary,
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
    ...ErrorResponses,
  },
});

export type V1DeleteApiKeyRoute = typeof route;
export type V1DeleteApiKeyRequest = z.infer<typeof route.request.query>;
export type V1DeleteApiKeyResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

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
    const { id } = c.req.valid("query");
    const repository = c.get("repo");
    const { cache } = c.get("ctx");

    // Validate id parameter
    if (!id) {
      throw new ServiceApiError({
        code: "BAD_REQUEST",
        message: "API key ID is required",
      });
    }

    // Parse and validate ID format
    const apiKeyId = parseInt(id, 10);
    if (isNaN(apiKeyId) || apiKeyId <= 0) {
      throw new ServiceApiError({
        code: "BAD_REQUEST",
        message: "Invalid API key ID format",
      });
    }

    const apiKey = await repository.apiKey.getById(apiKeyId);
    if (!apiKey) {
      throw new ServiceApiError({
        code: "NOT_FOUND",
        message: "API Key not found",
      });
    }

    const currentApiKey = c.req.header("X-API-Key");
    if (!currentApiKey) {
      throw new ServiceApiError({
        code: "UNAUTHORIZED",
        message: "API Key is required",
      });
    }

    const currentApiKeyUint = parseInt(currentApiKey, 10);

    // Fetch the API key to be deleted
    const currentApiKeyUnderUse = await repository.apiKey.getById(currentApiKeyUint);
    if (!apiKey) {
      throw new ServiceApiError({
        code: "NOT_FOUND",
        message: "API Key not found",
      });
    }

    // Prevent deletion of currently used API key
    if (currentApiKeyUnderUse && currentApiKeyUnderUse.id === apiKeyId) {
      throw new ServiceApiError({
        code: "BAD_REQUEST",
        message: "Cannot delete currently active API key",
      });
    }

    // await unkeyApi.keys.delete({ keyId: apiKey.key });
    await repository.apiKey.delete(apiKeyId);

    // Remove from cache if it exists
    const userCacheKey = getUserApiKeyCacheKeyReference(apiKey.key, apiKey.userId);
    try {
      await cache.delete(userCacheKey);
    } catch (error) {
      // Log cache deletion error but don't fail the request
      console.error("Failed to remove API key from cache:", error);
    }

    // Invalidate any related cache entries
    const apiKeyCacheKey = getApiKeyCacheKeyReference(apiKey.key);
    try {
      await cache.delete(apiKeyCacheKey);
    } catch (error) {
      console.error("Failed to invalidate user API keys cache:", error);
    }

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
