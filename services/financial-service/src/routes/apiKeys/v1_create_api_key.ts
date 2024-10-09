import { APIKeyRepository } from '@/data/apiKeyRepository';
import { apiKeys } from '@/db/schema';
import { openApiErrorResponses as ErrorResponses, errorSchemaFactory } from "@/errors";
import { App } from "@/hono/app";
import { createRoute, z } from "@hono/zod-openapi";
import { Unkey } from "@unkey/api";
import { APIKeySchema, CreateAPIKeySchema } from "./schema";

const route = createRoute({
    method: "post",
    path: "/v1/api.apiKeys",
    security: [{ bearerAuth: [] }],
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
export type V1CreateApiKeyRequest = z.infer<(typeof route.request.body.content)["application/json"]["schema"]>;
export type V1CreateApiKeyResponse = z.infer<(typeof route.responses)[200]["content"]["application/json"]["schema"]>;

export const registerV1CreateApiKey = (app: App) => {
    app.openapi(route, async (c) => {
        const unkeyApi = new Unkey({ rootKey: c.env.UNKEY_API_KEY });
        const { db } = c.get("ctx");
        const apiKeyData = c.req.valid("json");

        const { result } = await unkeyApi.keys.create({
            apiId: "solomon_ai_api",
            prefix: "sk_live_solomon_ai",
            byteLength: 16,
            ownerId: apiKeyData.userId,
            meta: {
                name: apiKeyData.name,
            },
            expires: 3600 * 24 * 30,
        });

        if (!result) {
            throw new Error("Failed to create API key with Unkey");
        }

        const executer = new APIKeyRepository(db);
        const apikey = await executer.create({
            userId: apiKeyData.userId,
            key: result.key,
            name: apiKeyData.name as string,
            expiresAt: apiKeyData.expiresAt ?? null,
            description: null,
            updatedAt: new Date(),
            lastUsedAt: null,
            isActive: true,
            scope: '',
            rateLimit: 0,
            allowedIPs: null,
            allowedDomains: null,
            usageCount: 0,
            lastUsedIP: null,
            environment: '',
            revoked: false,
            revokedAt: null,
            revokedReason: null,
            keyId: result.keyId,
        });

        // TODO: Implement caching for the newly created API key
        // Consider using a distributed cache like Redis for better performance
        // Example:
        // await cache.set(`api_key:${apiKey.id}`, JSON.stringify(apiKey), 'EX', 3600);

        // TODO: Implement rate limiting for API key creation
        // This can help prevent abuse and ensure fair usage

        // TODO: Add an audit log event for API key creation events
        // This can be useful for auditing and monitoring purposes

        // TODO: Consider implementing a webhook or event system
        // to notify other parts of the application about new API keys

        return c.json(apikey, 200);
    });
};