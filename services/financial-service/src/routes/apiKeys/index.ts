import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { Context } from "@/common/bindings";
import { createErrorResponse } from "@/utils/error";
import { z } from '@hono/zod-openapi';
import { apiKeys } from '@/db/schema';
import { Unkey } from "@unkey/api";

const app = new OpenAPIHono<Context>();

const APIKeySchema = z.object({
  id: z.string(),
  userId: z.string(),
  key: z.string(),
  name: z.string().nullable(),
  createdAt: z.date(),
  expiresAt: z.date().nullable(),
});

const CreateAPIKeySchema = APIKeySchema.omit({ id: true, key: true, createdAt: true });

const createAPIKeyRoute = createRoute({
  method: "post",
  path: "/api-keys",
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
    400: {
      description: "Bad request",
    },
  },
});

app.openapi(createAPIKeyRoute, async (c) => {
  const unkeyApi = new Unkey({ rootKey: c.env.UNKEY_API_KEY });
  const { db } = c.get("services");
  const apiKeyData = c.req.valid("json");

  try {
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

    const [apiKey] = await db.insert(apiKeys).values({
      ...apiKeyData,
      key: result.key,
    }).returning();

    return c.json(apiKey, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

// Implement other CRUD routes (GET, PUT, DELETE) similarly

export default app;