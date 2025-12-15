import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { GoogleDriveProvider } from "@midday/app-store/google-drive/server";
import { addGoogleDriveConnection } from "@midday/db/queries";
import { encrypt } from "@midday/encryption";
import { decryptOAuthState } from "@midday/inbox/utils";
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
      "Handles OAuth callback from Google after user authorization. Exchanges authorization code for access token and creates Google Drive connection.",
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
      return c.redirect(`${dashboardUrl}/apps?connected=false`, 302);
    }

    // Decrypt and validate state - this ensures teamId hasn't been tampered with
    const parsedState = decryptOAuthState(state);

    if (!parsedState || parsedState.provider !== "googledrive") {
      throw new HTTPException(400, {
        message: "Invalid or expired state. Please try connecting again.",
      });
    }

    try {
      const provider = new GoogleDriveProvider(db);
      const tokens = await provider.exchangeCodeForTokens(code);

      // Get user info
      provider.setTokens({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? "",
        expiry_date: tokens.expiry_date,
      });

      const userInfo = await provider.getUserInfo();

      if (!userInfo?.email || !userInfo.id) {
        throw new Error("Failed to get Google Drive user info");
      }

      // Create/update Google Drive app with connection
      await addGoogleDriveConnection(db, {
        teamId: parsedState.teamId,
        email: userInfo.email,
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token ?? ""),
        expiryDate: new Date(tokens.expiry_date!).toISOString(),
        externalId: userInfo.id,
        folders: [], // Will be set after folder selection
      });

      // Redirect based on source
      if (parsedState.source === "apps") {
        return c.redirect(
          `${dashboardUrl}/all-done?event=app_oauth_completed`,
          302,
        );
      }

      // Inbox settings flow (if used from inbox)
      return c.redirect(
        `${dashboardUrl}/inbox?connected=true&provider=googledrive`,
        302,
      );
    } catch (err) {
      logger.error("Google Drive OAuth callback error", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      return c.redirect(`${dashboardUrl}/apps?connected=false`, 302);
    }
  },
);

export { app as oauthCallbackRouter };
