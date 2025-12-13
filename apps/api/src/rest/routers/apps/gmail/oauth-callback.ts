import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { users } from "@midday/db/schema";
import { GmailProvider } from "@midday/inbox";
import { InboxConnector } from "@midday/inbox/connector";
import type { InitialInboxSetupPayload } from "@midday/jobs/schema";
import { logger } from "@midday/logger";
import { tasks } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const paramsSchema = z.object({
  code: z.string().openapi({
    param: {
      in: "query",
      name: "code",
      required: true,
    },
    description: "OAuth authorization code from Gmail",
  }),
  state: z.string().openapi({
    param: {
      in: "query",
      name: "state",
      required: true,
    },
    description:
      "OAuth state parameter (JSON string with teamId, userId, redirectUrl)",
  }),
  redirect_uri: z
    .string()
    .url()
    .optional()
    .openapi({
      param: {
        in: "query",
        name: "redirect_uri",
        required: false,
      },
      description: "Optional redirect URI override (fallback if not in state)",
    }),
});

app.use("*", ...publicMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Gmail OAuth callback",
    operationId: "gmailOAuthCallback",
    description:
      "Handles OAuth callback from Gmail after user authorization. Exchanges authorization code for access token and creates inbox account.",
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
      500: {
        description: "Failed to process OAuth callback",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const query = c.req.valid("query");
    const { code, state, redirect_uri } = query;

    // Check if state is JSON (Apps flow) or string (Inbox flow)
    let isAppsFlow = false;
    let provider = "gmail" as const;
    let teamId: string | undefined;
    let redirectUrl: string | undefined;

    try {
      const parsedState = JSON.parse(state);
      if (parsedState.teamId && parsedState.userId) {
        isAppsFlow = true;
        provider = (parsedState.provider || "gmail") as "gmail";
        teamId = parsedState.teamId;
        redirectUrl = parsedState.redirectUrl;
      } else if (parsedState.teamId) {
        // Inbox flow with teamId in state
        teamId = parsedState.teamId;
        provider = (parsedState.provider || "gmail") as "gmail";
        redirectUrl = parsedState.redirectUrl;
      }
    } catch {
      // State is not JSON, treat as legacy inbox flow (just "gmail")
      // For legacy inbox flow, we need to get teamId from user email
      provider = state as "gmail";

      // Create a temporary GmailProvider to exchange code and get user info
      const tempProvider = new GmailProvider(db);
      const tempTokens = await tempProvider.exchangeCodeForTokens(code);
      tempProvider.setTokens({
        access_token: tempTokens.access_token,
        refresh_token: tempTokens.refresh_token ?? "",
        expiry_date: tempTokens.expiry_date,
      });

      const userInfo = await tempProvider.getUserInfo();
      if (userInfo?.email) {
        // Get teamId from user email
        const [user] = await db
          .select({ teamId: users.teamId })
          .from(users)
          .where(eq(users.email, userInfo.email))
          .limit(1);

        if (user?.teamId) {
          teamId = user.teamId;
        }
      }
    }

    // Determine redirect URL - use from state, query param, or default
    const defaultDashboardUrl =
      process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";

    if (!redirectUrl) {
      redirectUrl = redirect_uri;
    }

    if (!teamId) {
      const failureUrl = redirectUrl
        ? `${redirectUrl}?connected=failed&error=team_not_found`
        : `${defaultDashboardUrl}/inbox?connected=failed&error=team_not_found`;
      return c.redirect(failureUrl, 302);
    }

    try {
      const connector = new InboxConnector(provider, db);

      const account = await connector.exchangeCodeForAccount({
        code,
        teamId,
      });

      if (!account) {
        const failureUrl = redirectUrl
          ? `${redirectUrl}?connected=failed`
          : isAppsFlow
            ? `${defaultDashboardUrl}/all-done?connected=failed`
            : `${defaultDashboardUrl}/inbox?connected=failed`;
        return c.redirect(failureUrl, 302);
      }

      // Trigger initial inbox setup job
      await tasks.trigger("initial-inbox-setup", {
        id: account.id,
      } satisfies InitialInboxSetupPayload);

      // Build redirect URL - use provided redirectUrl or default based on flow
      let successUrl: string;
      if (redirectUrl) {
        // Use provided redirect URL (append success params)
        const url = new URL(redirectUrl);
        if (isAppsFlow) {
          url.searchParams.set("event", "app_oauth_completed");
        } else {
          url.searchParams.set("connected", "true");
          url.searchParams.set("provider", provider);
        }
        successUrl = url.toString();
      } else {
        // Default redirects based on flow
        if (isAppsFlow) {
          successUrl = `${defaultDashboardUrl}/all-done?event=app_oauth_completed`;
        } else {
          successUrl = `${defaultDashboardUrl}/inbox?connected=true&provider=${provider}`;
        }
      }

      return c.redirect(successUrl, 302);
    } catch (err) {
      if (err instanceof HTTPException) {
        throw err;
      }

      logger.error("Gmail OAuth callback error", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      const errorUrl = redirectUrl
        ? `${redirectUrl}?connected=false`
        : isAppsFlow
          ? `${defaultDashboardUrl}/all-done?connected=false`
          : `${defaultDashboardUrl}/inbox?connected=false`;
      return c.redirect(errorUrl, 302);
    }
  },
);

export { app as oauthCallbackRouter };
