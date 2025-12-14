import { protectedMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { InboxConnector } from "@midday/inbox/connector";
import { logger } from "@midday/logger";
import { tasks } from "@trigger.dev/sdk";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const paramsSchema = z.object({
  code: z.string().openapi({
    param: { in: "query", name: "code", required: true },
    description: "OAuth authorization code from Microsoft",
  }),
  state: z
    .string()
    .optional()
    .openapi({
      param: { in: "query", name: "state", required: false },
      description: "OAuth state parameter (e.g., 'outlook')",
    }),
});

const errorResponseSchema = z.object({
  error: z.string(),
});

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Outlook OAuth callback",
    operationId: "outlookOAuthCallback",
    description:
      "Handles OAuth callback from Microsoft after user authorization. Exchanges authorization code for access token and creates inbox account.",
    tags: ["Integrations"],
    request: {
      query: paramsSchema,
    },
    responses: {
      302: {
        description: "Redirect to dashboard",
        headers: {
          Location: {
            schema: {
              type: "string",
            },
            description: "Redirect URL to dashboard",
          },
        },
      },
      400: {
        description: "Invalid request parameters",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      500: {
        description: "Failed to process OAuth callback",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const query = c.req.valid("query");
    const { code, state } = query;
    const dashboardUrl =
      process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";

    if (!session?.teamId) {
      throw new HTTPException(401, {
        message: "Team not found. Please log in and try again.",
      });
    }

    try {
      const connector = new InboxConnector("outlook", db);

      const account = await connector.exchangeCodeForAccount({
        code,
        teamId: session.teamId,
      });

      if (!account) {
        return c.redirect(`${dashboardUrl}/inbox?connected=failed`, 302);
      }

      // Trigger initial inbox setup job
      await tasks.trigger("initial-inbox-setup", {
        id: account.id,
      });

      // Redirect based on source in state (e.g., "outlook:apps" or just "outlook")
      const source = state?.split(":")[1];
      if (source === "apps") {
        return c.redirect(
          `${dashboardUrl}/all-done?event=app_oauth_completed`,
          302,
        );
      }

      // Inbox settings flow
      return c.redirect(
        `${dashboardUrl}/inbox?connected=true&provider=outlook`,
        302,
      );
    } catch (err) {
      logger.error("Outlook OAuth callback error", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      return c.redirect(`${dashboardUrl}/inbox?connected=false`, 302);
    }
  },
);

export { app as oauthCallbackRouter };
