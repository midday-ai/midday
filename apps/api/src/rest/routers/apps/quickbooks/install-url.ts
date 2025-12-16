import { protectedMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  encryptAccountingOAuthState,
  getAccountingProvider,
} from "@midday/accounting";
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
    summary: "Get QuickBooks install URL",
    operationId: "getQuickBooksInstallUrl",
    description:
      "Generates OAuth install URL for QuickBooks integration. Requires authentication.",
    tags: ["Integrations"],
    responses: {
      200: {
        description: "QuickBooks install URL",
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
        description: "Server error",
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

    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const redirectUri = process.env.QUICKBOOKS_OAUTH_REDIRECT_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new HTTPException(500, {
        message: "QuickBooks OAuth configuration missing",
      });
    }

    // Encrypt state to prevent tampering with teamId
    const state = encryptAccountingOAuthState({
      teamId: session.teamId,
      userId: session.user.id,
      provider: "quickbooks",
      source: "apps",
    });

    const provider = getAccountingProvider("quickbooks", {
      clientId,
      clientSecret,
      redirectUri,
    });

    const url = await provider.buildConsentUrl(state);

    return c.json({ url });
  },
);

export { app as installUrlRouter };

