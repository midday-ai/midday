import { createRoute, z } from "@hono/zod-openapi";
import { openApiErrorResponses } from "../../pkg/errors";
import { App } from "../../pkg/hono";
import { upsertPost } from "../../utils";

const upsertPostRoute = createRoute({
  tags: ["posts"],
  operationId: "upsertPost",
  method: "put",
  path: "/v1/posts/{slug}",
  request: {
    params: z.object({
      slug: z.string(),
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
    204: {
      description: "Post updated successfully",
    },
    405: {
      description: "Method not allowed",
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export type V1UpsertPostResponse = void;

export const registerV1UpsertPost = (app: App) =>
  app.openapi(upsertPostRoute, async (c) => {
    const { slug } = c.req.param();
    if (slug === "/") return c.text("Method Not Allowed", 405);
    await upsertPost(c.env.DB, slug, await c.req.text());
    return c.newResponse(null, 204);
  });
