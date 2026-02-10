import { protectedMiddleware, publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  getInvoiceById,
  getTeamById,
  updateInvoice,
  updateTeamById,
} from "@midday/db/queries";
import { decryptOAuthState, encryptOAuthState } from "@midday/encryption";
import { toStripeAmount } from "@midday/invoice/currency";
import { verify as verifyInvoiceToken } from "@midday/invoice/token";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";
import Stripe from "stripe";

const app = new OpenAPIHono<Context>();

// ============================================================================
// OAuth State Types
// ============================================================================

interface InvoicePaymentOAuthState {
  teamId: string;
  userId: string;
  source: "invoice-settings";
}

function isValidOAuthState(
  parsed: unknown,
): parsed is InvoicePaymentOAuthState {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    typeof (parsed as Record<string, unknown>).teamId === "string" &&
    typeof (parsed as Record<string, unknown>).userId === "string" &&
    (parsed as Record<string, unknown>).source === "invoice-settings"
  );
}

// ============================================================================
// Connect Stripe Endpoint
// ============================================================================

const connectStripeResponseSchema = z.object({
  url: z.string().url(),
});

app.use("/connect-stripe", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/connect-stripe",
    summary: "Get Stripe Connect URL",
    operationId: "getStripeConnectUrl",
    description:
      "Generates OAuth URL for Stripe Connect Standard integration. Allows teams to connect their Stripe account for accepting invoice payments.",
    tags: ["Invoice Payments"],
    responses: {
      200: {
        description: "Stripe Connect OAuth URL",
        content: {
          "application/json": {
            schema: connectStripeResponseSchema,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      500: {
        description: "Server error - Stripe configuration missing",
      },
    },
  }),
  async (c) => {
    const session = c.get("session");

    if (!session?.user) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    if (!session.teamId) {
      throw new HTTPException(401, { message: "Team not found" });
    }

    const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
    if (!clientId) {
      throw new HTTPException(500, {
        message: "Stripe Connect is not configured",
      });
    }

    // Encrypt state to prevent tampering
    const state = encryptOAuthState({
      teamId: session.teamId,
      userId: session.user.id,
      source: "invoice-settings",
    });

    const _dashboardUrl =
      process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";
    const redirectUri = `${process.env.MIDDAY_API_URL || "https://api.midday.ai"}/invoice-payments/connect-stripe/callback`;

    // Build Stripe Connect OAuth URL (Standard accounts)
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: "read_write",
      redirect_uri: redirectUri,
      state,
    });

    const url = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;

    return c.json({ url });
  },
);

// ============================================================================
// OAuth Callback Endpoint
// ============================================================================

const callbackParamsSchema = z.object({
  code: z
    .string()
    .optional()
    .openapi({
      param: { in: "query", name: "code", required: false },
      description: "OAuth authorization code from Stripe",
    }),
  state: z.string().openapi({
    param: { in: "query", name: "state", required: true },
    description: "OAuth state parameter for CSRF protection",
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

app.use("/connect-stripe/callback", ...publicMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/connect-stripe/callback",
    summary: "Stripe Connect OAuth callback",
    operationId: "stripeConnectCallback",
    description:
      "Handles OAuth callback from Stripe Connect after user authorization. Exchanges authorization code for connected account ID.",
    tags: ["Invoice Payments"],
    request: {
      query: callbackParamsSchema,
    },
    responses: {
      302: {
        description: "Redirect to dashboard",
        headers: {
          Location: {
            schema: { type: "string" },
            description: "Redirect URL",
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
    const { code, state, error, error_description } = c.req.valid("query");
    const dashboardUrl =
      process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";

    // Handle OAuth errors
    if (error || !code) {
      logger.info("Stripe Connect OAuth error or cancelled", {
        error,
        error_description,
      });
      return c.redirect(
        `${dashboardUrl}/invoices?stripe_connect=error&message=${encodeURIComponent(error_description || error || "Connection cancelled")}`,
        302,
      );
    }

    // Decrypt and validate state
    const parsedState = decryptOAuthState(state, isValidOAuthState);

    if (!parsedState) {
      throw new HTTPException(400, {
        message: "Invalid or expired state. Please try connecting again.",
      });
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      // Exchange authorization code for connected account ID
      const response = await stripe.oauth.token({
        grant_type: "authorization_code",
        code,
      });

      const stripeAccountId = response.stripe_user_id;

      if (!stripeAccountId) {
        throw new Error("No stripe_user_id in response");
      }

      // Get account details to check status
      const account = await stripe.accounts.retrieve(stripeAccountId);

      // Determine connect status based on account capabilities
      let connectStatus = "connected";
      if (!account.charges_enabled || !account.payouts_enabled) {
        connectStatus = "restricted";
      }

      // Update team with Stripe account info
      await updateTeamById(db, {
        id: parsedState.teamId,
        data: {
          stripeAccountId,
          stripeConnectStatus: connectStatus,
        },
      });

      logger.info("Stripe Connect integration created", {
        teamId: parsedState.teamId,
        stripeAccountId,
        connectStatus,
      });

      // Redirect to success page
      return c.redirect(`${dashboardUrl}/oauth-callback?status=success`, 302);
    } catch (err) {
      logger.error("Stripe Connect OAuth callback error", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      return c.redirect(
        `${dashboardUrl}/invoices?stripe_connect=error&message=${encodeURIComponent("Failed to connect Stripe account")}`,
        302,
      );
    }
  },
);

// ============================================================================
// Disconnect Stripe Endpoint
// ============================================================================

app.use("/disconnect-stripe", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "post",
    path: "/disconnect-stripe",
    summary: "Disconnect Stripe account",
    operationId: "disconnectStripe",
    description: "Disconnects the team's Stripe Connect account.",
    tags: ["Invoice Payments"],
    responses: {
      200: {
        description: "Successfully disconnected",
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean() }),
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    if (!session?.user || !session.teamId) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    // Get current team to check if they have a Stripe account
    const team = await getTeamById(db, session.teamId);

    if (team?.stripeAccountId) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

        // Deauthorize the connected account
        await stripe.oauth.deauthorize({
          client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
          stripe_user_id: team.stripeAccountId,
        });
      } catch (err) {
        // Log but don't fail - account might already be disconnected on Stripe's side
        logger.warn("Failed to deauthorize Stripe account", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Clear Stripe fields from team
    await updateTeamById(db, {
      id: session.teamId,
      data: {
        stripeAccountId: null,
        stripeConnectStatus: null,
      },
    });

    return c.json({ success: true });
  },
);

// ============================================================================
// Create Payment Intent Endpoint (Public - for invoice customers)
// ============================================================================

const createPaymentIntentSchema = z.object({
  token: z.string().openapi({
    description: "Invoice token for authentication",
  }),
});

const paymentIntentResponseSchema = z.object({
  clientSecret: z.string(),
  amount: z.number(),
  currency: z.string(),
  stripeAccountId: z.string(),
});

app.use("/payment-intent", ...publicMiddleware);

app.openapi(
  createRoute({
    method: "post",
    path: "/payment-intent",
    summary: "Create payment intent for invoice",
    operationId: "createInvoicePaymentIntent",
    description:
      "Creates a Stripe PaymentIntent for paying an invoice. This is a public endpoint that uses the invoice token for authentication.",
    tags: ["Invoice Payments"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: createPaymentIntentSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Payment intent created",
        content: {
          "application/json": {
            schema: paymentIntentResponseSchema,
          },
        },
      },
      400: {
        description: "Invalid request or invoice not payable",
      },
      404: {
        description: "Invoice not found",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const { token } = c.req.valid("json");

    // Verify token and get invoice ID
    let invoiceId: string;
    try {
      const { id } = (await verifyInvoiceToken(decodeURIComponent(token))) as {
        id: string;
      };
      if (!id) {
        throw new Error("Invalid token");
      }
      invoiceId = id;
    } catch {
      throw new HTTPException(400, { message: "Invalid invoice token" });
    }

    // Get invoice by ID
    const invoice = await getInvoiceById(db, { id: invoiceId });

    if (!invoice) {
      throw new HTTPException(404, { message: "Invoice not found" });
    }

    // Check if invoice can be paid
    if (invoice.status === "paid") {
      throw new HTTPException(400, { message: "Invoice is already paid" });
    }

    if (invoice.status === "draft") {
      throw new HTTPException(400, { message: "Invoice is still a draft" });
    }

    if (invoice.status === "canceled") {
      throw new HTTPException(400, { message: "Invoice has been canceled" });
    }

    // Check if payment is enabled for this invoice's template
    const template = invoice.template as { paymentEnabled?: boolean } | null;
    if (!template?.paymentEnabled) {
      throw new HTTPException(400, {
        message: "Online payment is not enabled for this invoice",
      });
    }

    // Get team to retrieve Stripe account
    const team = await getTeamById(db, invoice.teamId);

    if (!team?.stripeAccountId) {
      throw new HTTPException(400, {
        message: "Payment provider is not configured",
      });
    }

    if (team.stripeConnectStatus !== "connected") {
      throw new HTTPException(400, {
        message: "Payment provider account is not fully set up",
      });
    }

    // Calculate amount in Stripe's smallest currency unit
    const currency = (invoice.currency || "usd").toLowerCase();
    const amount = toStripeAmount(invoice.amount || 0, currency);

    if (amount <= 0) {
      throw new HTTPException(400, { message: "Invalid invoice amount" });
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      // Check if there's an existing payment intent for this invoice
      if (invoice.paymentIntentId) {
        try {
          const existingIntent = await stripe.paymentIntents.retrieve(
            invoice.paymentIntentId,
            { stripeAccount: team.stripeAccountId },
          );

          // If payment already succeeded, reject - prevents double payments
          // This catches edge case where webhook hasn't updated invoice status yet
          if (existingIntent.status === "succeeded") {
            throw new HTTPException(400, {
              message: "Invoice has already been paid",
            });
          }

          // If the existing intent is still usable, return it
          // Include requires_action (3DS pending) and processing (payment in progress)
          // to prevent duplicate charges from creating new intents
          if (
            existingIntent.status === "requires_payment_method" ||
            existingIntent.status === "requires_confirmation" ||
            existingIntent.status === "requires_action" ||
            existingIntent.status === "processing"
          ) {
            // Check if the invoice amount has changed since the payment intent was created
            // If so, update the payment intent (only possible for certain statuses)
            if (existingIntent.amount !== amount) {
              // Can only update amount if payment is not actively in progress
              if (
                existingIntent.status === "requires_payment_method" ||
                existingIntent.status === "requires_confirmation"
              ) {
                const updatedIntent = await stripe.paymentIntents.update(
                  invoice.paymentIntentId,
                  { amount },
                  { stripeAccount: team.stripeAccountId },
                );
                return c.json({
                  clientSecret: updatedIntent.client_secret!,
                  amount: updatedIntent.amount,
                  currency: updatedIntent.currency,
                  stripeAccountId: team.stripeAccountId,
                });
              }
              // For requires_action or processing, the payment is in-flight
              // (e.g., 3DS authentication in progress or payment being processed)
              // Allow it to complete at the original amount to avoid disrupting
              // the customer mid-payment. Any amount discrepancy should be handled
              // manually by the business after the payment completes.
            }

            return c.json({
              clientSecret: existingIntent.client_secret!,
              amount: existingIntent.amount,
              currency: existingIntent.currency,
              stripeAccountId: team.stripeAccountId,
            });
          }
        } catch (err) {
          // Re-throw HTTP exceptions (like the "already paid" check above)
          if (err instanceof HTTPException) {
            throw err;
          }
          // Intent doesn't exist or is invalid, create a new one
        }
      }

      // Create PaymentIntent on the connected account
      // Use an idempotency key to prevent race conditions - if two requests
      // arrive simultaneously for the same invoice, Stripe will only create
      // one payment intent and return the same result to both requests.
      const idempotencyKey = `invoice_payment_${invoice.id}_${amount}_${currency}`;
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency,
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoiceNumber || "",
            team_id: invoice.teamId,
          },
        },
        {
          stripeAccount: team.stripeAccountId,
          idempotencyKey,
        },
      );

      // Save payment intent ID to invoice
      await updateInvoice(db, {
        id: invoice.id,
        teamId: invoice.teamId,
        paymentIntentId: paymentIntent.id,
      });

      return c.json({
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        stripeAccountId: team.stripeAccountId,
      });
    } catch (err) {
      logger.error("Failed to create payment intent", {
        error: err instanceof Error ? err.message : String(err),
        invoiceId: invoice.id,
      });

      throw new HTTPException(500, {
        message: "Failed to create payment session",
      });
    }
  },
);

// ============================================================================
// Get Stripe Connect Status Endpoint
// ============================================================================

const stripeStatusResponseSchema = z.object({
  connected: z.boolean(),
  status: z.string().nullable(),
  stripeAccountId: z.string().nullable(),
});

app.use("/stripe-status", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/stripe-status",
    summary: "Get Stripe Connect status",
    operationId: "getStripeConnectStatus",
    description: "Gets the current Stripe Connect status for the team.",
    tags: ["Invoice Payments"],
    responses: {
      200: {
        description: "Stripe Connect status",
        content: {
          "application/json": {
            schema: stripeStatusResponseSchema,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    if (!session?.user || !session.teamId) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const team = await getTeamById(db, session.teamId);

    return c.json({
      connected: !!team?.stripeAccountId,
      status: team?.stripeConnectStatus || null,
      stripeAccountId: team?.stripeAccountId || null,
    });
  },
);

export { app as invoicePaymentsRouter };
