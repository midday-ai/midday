import { createRoute, z } from "@hono/zod-openapi";
import { openApiErrorResponses } from "../../pkg/errors";
import { App } from "../../pkg/hono";
import { listPosts, Post } from "../../utils";

const listPostsRoute = createRoute({
  tags: ["posts"],
  operationId: "listPosts",
  method: "get",
  path: "/v1/posts",
  responses: {
    200: {
      description: "List of posts",
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export type V1ListPostsResponse = z.infer<
  (typeof listPostsRoute.responses)[200]["content"]["text/plain"]["schema"]
>;

export const registerV1ListPosts = (app: App) =>
  app.openapi(listPostsRoute, async (c) => {
    const posts: Array<Post> = await listPosts(c.env.DB);
    const origin = new URL(c.req.url).origin;
    const body = posts
      .map((post) => `${origin}${post.slug}\n${post.body}`)
      .join(`\n\n${"-".repeat(20)}\n`);
    return c.text(body);
  });
