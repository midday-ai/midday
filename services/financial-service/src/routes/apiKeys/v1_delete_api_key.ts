import { APIKeyRepository } from "@/data/apiKeyRepository";
import { apiKeys } from "@/db/schema/api-keys";
import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { createRoute, z } from "@hono/zod-openapi";
import { Unkey } from "@unkey/api";
import { APIKeyParamsSchema, DeleteAPIKeySchema } from "./schema";

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

export const registerV1DeleteApiKey = (app: App) => {
    app.openapi(route, async (c) => {
        const unkeyApi = new Unkey({ rootKey: c.env.UNKEY_API_KEY });
        const { db } = c.get("ctx");
        const { id } = c.req.valid("query");

        const executer = new APIKeyRepository(db)

        const apiKey = await executer.getById(id);
        if (!apiKey) {
            throw new Error("API Key not found");
        }

        await unkeyApi.keys.delete({ keyId: apiKey.key });
        await executer.delete(id);

        // TODO: Add an audit log event for API key creation events
        // This can be useful for auditing and monitoring purposes

        // TODO: Consider implementing a webhook or event system
        // to notify other parts of the application about new API keys

        return c.json({ success: true }, 200);
    });
};