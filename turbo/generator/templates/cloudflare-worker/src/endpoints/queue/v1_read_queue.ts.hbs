import { createRoute, z } from "@hono/zod-openapi";
import { openApiErrorResponses } from "../../pkg/errors";
import { App } from "../../pkg/hono";

const queueRoute = createRoute({
  tags: ["queue"],
  operationId: "handleQueue",
  method: "get",
  path: "/v1/queue/{key}",
  request: {
    params: z.object({
      key: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Queue item retrieved successfully",
      content: {
        "application/octet-stream": {
          schema: z.any(),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export const registerV1ReadQueue = (app: App) =>
  app.openapi(queueRoute, async (c) => {
    const { key } = c.req.param();
    const value = await c.env.QUEUE_RESULTS.get(key, "stream");
    if (value === null) {
      return c.notFound();
    }
    return c.json(value);
  });
