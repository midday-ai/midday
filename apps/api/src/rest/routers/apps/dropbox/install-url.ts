import { DropboxProvider } from "@api/dropbox";
import { protectedMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { encryptOAuthState } from "@midday/inbox/utils";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const installUrlResponseSchema = z.object({
  url: z.string().url(),
});

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Get Dropbox install URL",
    operationId: "getDropboxInstallUrl",
    description:
      "Generates OAuth install URL for Dropbox integration. Requires authentication.",
    tags: ["Integrations"],
    responses: {
      200: {
        description: "Dropbox install URL",
        content: {
          "application/json": {
            schema: installUrlResponseSchema,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
    },
  }),
  async (c) => {
    const session = c.get("session");
    const db = c.get("db");

    if (!session?.user) {
      throw new HTTPException(401, {
        message: "Unauthorized",
      });
    }

    if (!session.teamId) {
      throw new HTTPException(401, {
        message: "Team not found",
      });
    }

    // Encrypt state to prevent tampering with teamId
    const state = encryptOAuthState({
      teamId: session.teamId,
      provider: "dropbox",
      source: "apps",
    });

    const provider = new DropboxProvider(db);
    const url = await provider.getAuthUrl(state);

    return c.json({ url });
  },
);

export { app as installUrlRouter };
