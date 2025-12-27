import { protectedMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
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
    summary: "Get Stripe install URL",
    operationId: "getStripeInstallUrl",
    description:
      "Generates OAuth install URL for Stripe integration. Requires authentication.",
    tags: ["Integrations"],
    responses: {
      200: {
        description: "Stripe install URL",
        content: {
          "application/json": {
            schema: installUrlResponseSchema,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      500: {
        description: "Stripe configuration missing",
      },
    },
  }),
  async (c) => {
    const session = c.get("session");

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

    const clientId = process.env.STRIPE_CLIENT_ID;
    const redirectUri = process.env.STRIPE_OAUTH_REDIRECT_URL;

    if (!clientId || !redirectUri) {
      throw new HTTPException(500, {
        message: "Stripe OAuth configuration missing",
      });
    }

    // Create state with teamId and userId for the callback
    // Include a random component for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        teamId: session.teamId,
        userId: session.user.id,
        nonce: crypto.randomUUID(),
      }),
    ).toString("base64");

    // Build Stripe Apps OAuth URL
    // Using marketplace.stripe.com for Stripe Apps OAuth 2.0
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });

    const url = `https://marketplace.stripe.com/oauth/v2/authorize?${params.toString()}`;

    return c.json({ url });
  },
);

export { app as installUrlRouter };
