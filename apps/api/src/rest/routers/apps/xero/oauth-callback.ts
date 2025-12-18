import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  XERO_SCOPES,
  decryptAccountingOAuthState,
  getAccountingProvider,
} from "@midday/accounting";
import config from "@midday/app-store/xero";
import { createApp } from "@midday/db/queries";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const paramsSchema = z.object({
  code: z
    .string()
    .optional()
    .openapi({
      param: {
        in: "query",
        name: "code",
        required: false,
      },
      description: "OAuth authorization code from Xero",
    }),
  state: z.string().openapi({
    param: {
      in: "query",
      name: "state",
      required: true,
    },
    description: "OAuth state parameter for CSRF protection",
  }),
  error: z
    .string()
    .optional()
    .openapi({
      param: {
        in: "query",
        name: "error",
        required: false,
      },
      description: "OAuth error code if authorization failed",
    }),
});

app.use("*", ...publicMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Xero OAuth callback",
    operationId: "xeroOAuthCallback",
    description:
      "Handles OAuth callback from Xero after user authorization. Exchanges authorization code for access token and creates app integration.",
    tags: ["Integrations"],
    request: {
      query: paramsSchema,
    },
    responses: {
      302: {
        description: "Redirect to dashboard completion page",
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
      logger.info("Xero OAuth error or cancelled", { error });
      return c.redirect(`${dashboardUrl}/settings/apps?connected=false`, 302);
    }

    // Decrypt and validate state - this ensures teamId hasn't been tampered with
    const parsedState = decryptAccountingOAuthState(state);

    if (!parsedState || parsedState.provider !== "xero") {
      throw new HTTPException(400, {
        message: "Invalid or expired state. Please try connecting again.",
      });
    }

    try {
      const provider = getAccountingProvider("xero");

      // Build the full callback URL that includes the code
      const callbackUrl = new URL(c.req.url);

      // Exchange code for tokens (also returns tenant info for Xero)
      const tokenSet = await provider.exchangeCodeForTokens(
        callbackUrl.toString(),
      );

      // Xero returns tenant info with the token set
      if (!tokenSet.tenantId) {
        throw new Error("No Xero organization found");
      }

      // Create app integration in database
      await createApp(db, {
        teamId: parsedState.teamId,
        createdBy: parsedState.userId,
        appId: config.id,
        settings: config.settings,
        config: {
          provider: "xero", // Discriminator field
          accessToken: tokenSet.accessToken,
          refreshToken: tokenSet.refreshToken,
          expiresAt: tokenSet.expiresAt.toISOString(),
          tenantId: tokenSet.tenantId,
          tenantName: tokenSet.tenantName,
          scope: XERO_SCOPES,
        },
      });

      logger.info("Xero integration created successfully", {
        teamId: parsedState.teamId,
        tenantId: tokenSet.tenantId,
        tenantName: tokenSet.tenantName,
      });

      // Redirect based on source
      if (parsedState.source === "apps") {
        return c.redirect(
          `${dashboardUrl}/all-done?event=app_oauth_completed`,
          302,
        );
      }

      // Settings flow
      return c.redirect(
        `${dashboardUrl}/settings/apps?connected=true&provider=xero`,
        302,
      );
    } catch (err) {
      logger.error("Xero OAuth callback error", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      return c.redirect(`${dashboardUrl}/settings/apps?connected=false`, 302);
    }
  },
);

export { app as oauthCallbackRouter };
