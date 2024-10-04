import { createRoute, z } from "@hono/zod-openapi";
import { openApiErrorResponses } from "../../pkg/errors";
import { App } from "../../pkg/hono";

const postQueueRoute = createRoute({
  tags: ["queue"],
  operationId: "postToQueue",
  method: "post",
  path: "/v1/queue/{key}",
  request: {
    params: z.object({
      key: z.string(),
    }),
    body: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
    },
  },
  responses: {
    202: {
      description: "Item accepted into the queue",
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export const registerV1WriteQueue = (app: App) =>
  app.openapi(postQueueRoute, async (c) => {
    const { key } = c.req.param();
    const value = await c.req.text();
    await c.env.QUEUE_PRODUCER.send({ key, value });
    return c.json({ message: "Item accepted into the queue" }, 202);
  });
