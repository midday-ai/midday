import { protectedMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getInstallUrl } from "@midday/app-store/gmail/server";
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
    summary: "Get Gmail install URL",
    operationId: "getGmailInstallUrl",
    description:
      "Generates OAuth install URL for Gmail integration. Requires authentication.",
    tags: ["Integrations"],
    responses: {
      200: {
        description: "Gmail install URL",
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

    // Build default redirect URL for Apps flow
    const dashboardUrl =
      process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";
    const defaultRedirectUrl = `${dashboardUrl}/all-done`;

    const url = await getInstallUrl({
      teamId: session.teamId,
      userId: session.user.id,
      db,
      redirectUrl: defaultRedirectUrl,
    });

    return c.json({ url });
  },
);

export { app as installUrlRouter };
