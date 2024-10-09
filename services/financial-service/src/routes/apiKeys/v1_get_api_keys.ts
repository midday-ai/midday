import { APIKeyRepository } from "@/data/apiKeyRepository";
import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { createRoute, z } from "@hono/zod-openapi";
import { APIKeysQuerySchema, APIKeysSchema } from "./schema";

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

export const registerV1GetApiKeys = (app: App) => {
    app.openapi(route, async (c) => {
        const { db } = c.get("ctx");
        // get the user id from the query parameters
        const query = c.req.valid("query");
        const {userId} = query;

        const executer = new APIKeyRepository(db);
        const apiKeys = await executer.getByUserId(userId);

        // TODO: cache all keys in redis (specifically the active non revoked ones)

        return c.json({ data: apiKeys }, 200);
    });
};