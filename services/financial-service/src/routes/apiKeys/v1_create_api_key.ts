import { CacheOptions } from "@/cache";
import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { Routes } from "@/route-definitions/routes";
import { createRoute, z } from "@hono/zod-openapi";
import { newKey } from "@internal/keys";
import { isValid, parse, parseISO } from "date-fns";
import { APIKeySchema, CreateAPIKeySchema } from "./schema";

/**
 * OpenAPI route definition for creating a new API key.
 * @description Defines the HTTP method, path, security, request body, and response schemas for the API key creation endpoint.
 */
const route = createRoute({
  tags: [...Routes.ApiKeys.create.tags],
  method: Routes.ApiKeys.create.method,
  path: Routes.ApiKeys.create.path,
  security: [{ bearerAuth: [] }],
  summary: Routes.ApiKeys.create.summary,
  operationId: Routes.ApiKeys.create.operationId,
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateAPIKeySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: APIKeySchema,
        },
      },
      description: "API Key created successfully",
    },
    ...ErrorResponses,
  },
});

export type V1CreateApiKeyRoute = typeof route;
export type V1CreateApiKeyRequest = z.infer<
  (typeof route.request.body.content)["application/json"]["schema"]
>;
export type V1CreateApiKeyResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the API key creation route with the application.
 *
 * @param app - The Hono application instance.
 * @description This function sets up the OpenAPI route for creating a new API key.
 * It handles the API key creation process, including:
 * - Generating a new key using the Unkey service
 * - Storing the key information in the database
 * - Returning the created API key details
 *
 * @remarks
 * This function includes several TODOs for future improvements:
 * - Implementing caching for the newly created API key
 * - Adding rate limiting for API key creation
 * - Implementing an audit log for API key creation events
 * - Setting up a webhook or event system for notifications
 *
 * @throws {Error} If the API key creation with Unkey fails
 */
export const registerV1CreateApiKey = (app: App) => {
  app.openapi(route, async (c) => {
    const apiKeyData = c.req.valid("json");
    const { cache } = c.get("ctx");
    /**
     * Retrieve the API key repository from the context.
     */
    const repository = c.get("repo");

    /**
     * Create a new API key using the Unkey service.
     * @throws {Error} If the API key creation fails
     */
    const { key, hash } = await newKey({
      prefix: "sk_live_solomon_ai",
      byteLength: 16,
    });

    /**
     * Store the newly created API key in the database.
     * @type {import('@/data/apiKeyRepository').APIKey}
     */
    const apiKey = await repository.apiKey.create({
      userId: apiKeyData.userId,
      key: key,
      name: apiKeyData.name as string,
      expiresAt: parseISO(apiKeyData.expiresAt) ?? null,
      description: null,
      updatedAt: new Date(),
      lastUsedAt: new Date(),
      isActive: true,
      scope: [],
      rateLimit: 0,
      allowedIPs: [],
      allowedDomains: [],
      usageCount: 0,
      lastUsedIP: null,
      environment: "production", // Fixed the type assignment issue
      revoked: false,
      revokedAt: null,
      revokedReason: null,
      keyId: hash,
    });

    // TODO: Implement caching for the newly created API key
    // Consider using a distributed cache like Redis for better performance
    // Example:
    const cacheOpts: CacheOptions = {
      expirationTtl: 86400,
      revalidateAfter: 3600,
    };

    // cache the newly created API key
    await cache.set(`api_key:${apiKey.id}`, JSON.stringify(apiKey), cacheOpts);

    // TODO: Implement rate limiting for API key creation
    // This can help prevent abuse and ensure fair usage

    // TODO: Add an audit log event for API key creation events
    // This can be useful for auditing and monitoring purposes

    // TODO: Consider implementing a webhook or event system
    // to notify other parts of the application about new API keys

    return c.json(apiKey, 200);
  });
};
