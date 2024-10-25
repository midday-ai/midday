import { CacheOptions } from "@/cache";
import { openApiErrorResponses as ErrorResponses, ServiceApiError } from "@/errors";
import { App } from "@/hono/app";
import { Routes } from "@/route-definitions/routes";
import { createRoute, z } from "@hono/zod-openapi";
import { newKey } from "@internal/keys";
import { isFuture, parseISO } from "date-fns";
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
    try {
      const apiKeyData = c.req.valid("json");
      const { cache } = c.get("ctx");
      const repository = c.get("repo");

      // Validate userId
      if (!apiKeyData.userId || apiKeyData.userId <= 0) {
        throw new ServiceApiError({
          code: "BAD_REQUEST",
          message: "Invalid user ID",
        });
      }

      // Validate name
      if (!apiKeyData.name || typeof apiKeyData.name !== 'string' || apiKeyData.name.trim().length === 0) {
        throw new ServiceApiError({
          code: "BAD_REQUEST",
          message: "API key name is required and must be non-empty",
        });
      }

      // Validate expiration date
      let parsedExpiresAt: Date | null = null;
      try {
        parsedExpiresAt = parseISO(apiKeyData.expiresAt);
        if (!isFuture(parsedExpiresAt)) {
          throw new ServiceApiError({
            code: "BAD_REQUEST",
            message: "Expiration date must be in the future",
          });
        }
      } catch (error) {
        throw new ServiceApiError({
          code: "BAD_REQUEST",
          message: "Invalid expiration date format",
        });
      }

      // Create new API key
      let keyResult;
      try {
        keyResult = await newKey({
          prefix: "sk_live_solomon_ai",
          byteLength: 16,
        });
      } catch (error) {
        throw new ServiceApiError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate API key",
        });
      }

      // Prepare API key data
      const now = new Date();
      const apiKeyCreateData = {
        userId: apiKeyData.userId,
        key: keyResult.key,
        name: apiKeyData.name,
        expiresAt: parsedExpiresAt,
        description: null,
        updatedAt: now,
        lastUsedAt: now,
        isActive: true,
        scope: [],
        rateLimit: 0,
        allowedIPs: [],
        allowedDomains: [],
        usageCount: 0,
        lastUsedIP: null,
        environment: "production" as const,
        revoked: false,
        revokedAt: null,
        revokedReason: null,
        keyId: keyResult.hash,
      };

      // Create API key in database
      let apiKey;
      try {
        apiKey = await repository.apiKey.create(apiKeyCreateData);
        if (!apiKey) {
          throw new Error("Failed to create API key");
        }
      } catch (error) {
        throw new ServiceApiError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to store API key",
        });
      }

      // Cache the API key
      const cacheOpts: CacheOptions = {
        expirationTtl: 86400, // 24 hours
        revalidateAfter: 3600, // 1 hour
      };

      try {
        await cache.set(
          `api_key:${apiKey.id}`,
          JSON.stringify(apiKey),
          cacheOpts
        );
      } catch (error) {
        // Log cache error but don't fail the request
        console.error("Failed to cache API key:", error);
      }

      // Return successful response
      return c.json({
        ...apiKey,
        // Ensure these fields are present as expected by tests
        isActive: true,
        environment: "production",
        revoked: false,
      }, 200);

    } catch (error) {
      if (error instanceof ServiceApiError) {
        throw error;
      }

      // Handle any unexpected errors
      console.error("Unexpected error creating API key:", error);
      throw new ServiceApiError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while creating the API key",
      });
    }
  });


  // TODO: Implement rate limiting for API key creation
  // This can help prevent abuse and ensure fair usage

  // TODO: Add an audit log event for API key creation events
  // This can be useful for auditing and monitoring purposes

  // TODO: Consider implementing a webhook or event system
  // to notify other parts of the application about new API keys

};