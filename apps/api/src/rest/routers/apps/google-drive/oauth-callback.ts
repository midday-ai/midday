import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { InboxConnector } from "@midday/inbox/connector";
import { decryptOAuthState } from "@midday/inbox/utils";
import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const paramsSchema = z.object({
  code: z
    .string()
    .optional()
    .openapi({
      param: { in: "query", name: "code", required: false },
      description: "OAuth authorization code from Google",
    }),
  state: z.string().openapi({
    param: { in: "query", name: "state", required: true },
    description: "Encrypted OAuth state parameter",
  }),
  error: z
    .string()
    .optional()
    .openapi({
      param: { in: "query", name: "error", required: false },
      description: "OAuth error code if authorization failed",
    }),
});

const errorResponseSchema = z.object({
  error: z.string(),
});

app.use("*", ...publicMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Google Drive OAuth callback",
    operationId: "googleDriveOAuthCallback",
    description:
      "Handles OAuth callback from Google after user authorization. Exchanges authorization code for access token and creates inbox account.",
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
    const query = c.req.valid("query");
    const { code, state, error } = query;
    const dashboardUrl =
      process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";

    // Handle OAuth errors (user denied access, etc.)
    if (error || !code) {
      logger.info("Google Drive OAuth error or cancelled", { error });
      return c.redirect(`${dashboardUrl}/inbox?connected=false`, 302);
    }

    // Decrypt and validate state - this ensures teamId hasn't been tampered with
    const parsedState = decryptOAuthState(state);

    if (!parsedState || parsedState.provider !== "google_drive") {
      throw new HTTPException(400, {
        message: "Invalid or expired state. Please try connecting again.",
      });
    }

    try {
      const connector = new InboxConnector("google_drive", db);

      const account = await connector.exchangeCodeForAccount({
        code,
        teamId: parsedState.teamId,
      });

      if (!account) {
        return c.redirect(`${dashboardUrl}/inbox?connected=failed`, 302);
      }

      // For Google Drive, we redirect to folder selection page instead of triggering sync
      // The user needs to select a folder before the sync can start
      // Redirect based on source
      if (parsedState.source === "apps") {
        return c.redirect(
          `${dashboardUrl}/inbox/settings?provider=google_drive&accountId=${account.id}&selectFolder=true`,
          302,
        );
      }

      // Inbox settings flow - redirect to folder selection
      return c.redirect(
        `${dashboardUrl}/inbox/settings?connected=true&provider=google_drive&accountId=${account.id}&selectFolder=true`,
        302,
      );
    } catch (err) {
      logger.error("Google Drive OAuth callback error", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      return c.redirect(`${dashboardUrl}/inbox?connected=false`, 302);
    }
  },
);

export { app as oauthCallbackRouter };

