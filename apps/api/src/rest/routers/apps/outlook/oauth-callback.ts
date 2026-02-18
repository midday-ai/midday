import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  buildErrorRedirect,
  buildSuccessRedirect,
  mapOAuthError,
} from "@api/rest/utils/oauth";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { InboxConnector } from "@midday/inbox/connector";
import { decryptOAuthState } from "@midday/inbox/utils";
import { logger } from "@midday/logger";
import { tasks } from "@trigger.dev/sdk";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const paramsSchema = z.object({
  code: z
    .string()
    .optional()
    .openapi({
      param: { in: "query", name: "code", required: false },
      description: "OAuth authorization code from Microsoft",
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
    const query = c.req.valid("query");
    const { code, state, error } = query;
    const dashboardUrl =
      process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";

    // Try to decrypt state first to determine redirect target (apps vs inbox)
    const parsedState = decryptOAuthState(state);
    const source = parsedState?.source;

    const redirectPath = parsedState?.redirectPath;

    // Handle OAuth errors (user denied access, etc.)
    if (error || !code) {
      const errorCode = mapOAuthError(error);
      logger.info("Outlook OAuth error or cancelled", { error, errorCode });
      return c.redirect(
        buildErrorRedirect(
          dashboardUrl,
          errorCode,
          "outlook",
          source,
          "/inbox",
          redirectPath,
        ),
        302,
      );
    }

    // Validate state
    if (!parsedState || parsedState.provider !== "outlook") {
      throw new HTTPException(400, {
        message: "Invalid or expired state. Please try connecting again.",
      });
    }

    try {
      const connector = new InboxConnector("outlook", db);

      const account = await connector.exchangeCodeForAccount({
        code,
        teamId: parsedState.teamId,
      });

      if (!account) {
        return c.redirect(
          buildErrorRedirect(
            dashboardUrl,
            "token_exchange_failed",
            "outlook",
            parsedState.source,
            "/inbox",
            redirectPath,
          ),
          302,
        );
      }

      // Trigger initial inbox setup job
      await tasks.trigger("initial-inbox-setup", {
        id: account.id,
      });

      // Redirect based on source
      return c.redirect(
        buildSuccessRedirect(
          dashboardUrl,
          "outlook",
          parsedState.source,
          "/inbox",
          redirectPath,
        ),
        302,
      );
    } catch (err) {
      logger.error("Outlook OAuth callback error", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      return c.redirect(
        buildErrorRedirect(
          dashboardUrl,
          "token_exchange_failed",
          "outlook",
          parsedState.source,
          "/inbox",
          redirectPath,
        ),
        302,
      );
    }
  },
);

export { app as oauthCallbackRouter };
