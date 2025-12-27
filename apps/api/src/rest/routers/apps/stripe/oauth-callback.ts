import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createApp, createBankAccount } from "@midday/db/queries";
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
      description: "OAuth authorization code from Stripe",
    }),
  state: z.string().openapi({
    param: { in: "query", name: "state", required: true },
    description: "OAuth state parameter containing teamId and userId",
  }),
  error: z
    .string()
    .optional()
    .openapi({
      param: { in: "query", name: "error", required: false },
      description: "OAuth error code if authorization failed",
    }),
  error_description: z
    .string()
    .optional()
    .openapi({
      param: { in: "query", name: "error_description", required: false },
      description: "OAuth error description",
    }),
});

const stateSchema = z.object({
  teamId: z.string(),
  userId: z.string(),
});

const errorResponseSchema = z.object({
  error: z.string(),
});

app.use("*", ...publicMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Stripe OAuth callback",
    operationId: "stripeOAuthCallback",
    description:
      "Handles OAuth callback from Stripe after user authorization. Exchanges authorization code for access token and creates Stripe integration.",
    tags: ["Integrations"],
    request: {
      query: paramsSchema,
    },
    responses: {
      302: {
        description: "Redirect to dashboard",
        headers: {
          Location: {
            schema: { type: "string" },
            description: "Redirect URL to dashboard",
          },
        },
      },
      400: {
        description: "Invalid request parameters",
        content: {
          "application/json": { schema: errorResponseSchema },
        },
      },
      500: {
        description: "Failed to process OAuth callback",
        content: {
          "application/json": { schema: errorResponseSchema },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const query = c.req.valid("query");
    const { code, state, error, error_description } = query;
    const dashboardUrl =
      process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";

    // Handle OAuth errors (user denied access, etc.)
    if (error || !code) {
      logger.info("Stripe OAuth error or cancelled", {
        error,
        error_description,
      });
      return c.redirect(
        `${dashboardUrl}/settings/apps?connected=false&error=${error || "cancelled"}`,
        302,
      );
    }

    // Parse and validate state
    let parsedState: { teamId: string; userId: string };
    try {
      const decodedState = JSON.parse(
        Buffer.from(state, "base64").toString("utf-8"),
      );
      parsedState = stateSchema.parse(decodedState);
    } catch {
      throw new HTTPException(400, {
        message: "Invalid state parameter",
      });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new HTTPException(500, {
        message: "Stripe configuration missing",
      });
    }

    try {
      // Exchange authorization code for access token using Stripe Apps OAuth
      // Uses api.stripe.com/v1/oauth/token with Basic auth
      const tokenResponse = await fetch(
        "https://api.stripe.com/v1/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${stripeSecretKey}:`).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
          }),
        },
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        logger.error("Stripe token exchange failed", { error: errorData });
        throw new HTTPException(500, {
          message: "Failed to exchange authorization code",
        });
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token: string;
        refresh_token: string;
        stripe_user_id: string;
        stripe_publishable_key: string;
        scope: string;
        token_type: string;
        livemode: boolean;
      };

      // Get account details using the access token
      const accountResponse = await fetch("https://api.stripe.com/v1/account", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      let accountName = "Stripe";
      let accountId = tokenData.stripe_user_id;
      if (accountResponse.ok) {
        const accountData = (await accountResponse.json()) as {
          id: string;
          business_profile?: { name?: string };
          settings?: { dashboard?: { display_name?: string } };
        };
        accountId = accountData.id;
        accountName =
          accountData.business_profile?.name ||
          accountData.settings?.dashboard?.display_name ||
          "Stripe";
      }

      // Create bank account for Stripe transactions
      const bankAccount = await createBankAccount(db, {
        teamId: parsedState.teamId,
        userId: parsedState.userId,
        name: accountName,
        currency: "USD", // Default, will be updated based on transactions
        manual: false,
      });

      if (!bankAccount) {
        throw new Error("Failed to create bank account for Stripe");
      }

      // Create app record with Stripe credentials
      // Note: Stripe Apps access tokens expire in 1 hour
      const createdApp = await createApp(db, {
        teamId: parsedState.teamId,
        createdBy: parsedState.userId,
        appId: "stripe",
        settings: {
          sync_charges: true,
          sync_refunds: true,
          sync_fees: true,
          sync_payouts: true,
        },
        config: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          stripe_account_id: accountId,
          stripe_publishable_key: tokenData.stripe_publishable_key,
          bank_account_id: bankAccount.id,
          account_name: accountName,
          livemode: tokenData.livemode,
          connected_at: new Date().toISOString(),
          // Access tokens expire in 1 hour, track for refresh
          token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          status: "connected",
        },
      });

      if (!createdApp) {
        throw new Error("Failed to create Stripe app integration");
      }

      // Register dynamic scheduler for periodic sync
      try {
        await triggerJob(
          "register-stripe-scheduler",
          {
            appId: createdApp.id,
            teamId: parsedState.teamId,
          },
          "stripe",
        );
      } catch (schedulerError) {
        // Log but don't fail - manual sync will still work
        logger.warn("Failed to register Stripe scheduler", {
          error: schedulerError,
          appId: createdApp.id,
        });
      }

      // Trigger initial sync job
      try {
        await triggerJob(
          "sync-stripe",
          {
            appId: createdApp.id,
            teamId: parsedState.teamId,
            manualSync: true, // Full historical sync
          },
          "stripe",
        );
      } catch (syncError) {
        // Log but don't fail - sync can be triggered manually
        logger.warn("Failed to trigger initial Stripe sync", {
          error: syncError,
          appId: createdApp.id,
        });
      }

      logger.info("Stripe OAuth completed successfully", {
        teamId: parsedState.teamId,
        stripeAccountId: accountId,
        appId: createdApp.id,
        livemode: tokenData.livemode,
      });

      // Redirect to success page
      return c.redirect(
        `${dashboardUrl}/all-done?event=app_oauth_completed`,
        302,
      );
    } catch (err) {
      logger.error("Stripe OAuth callback error", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      if (err instanceof HTTPException) {
        throw err;
      }

      return c.redirect(
        `${dashboardUrl}/settings/apps?connected=false&error=unknown`,
        302,
      );
    }
  },
);

export { app as oauthCallbackRouter };
