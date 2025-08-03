import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  oauthApplicationInfoSchema,
  oauthAuthorizationDecisionSchema,
  oauthAuthorizationRequestSchema,
  oauthErrorResponseSchema,
  oauthRefreshTokenRequestSchema,
  oauthRevokeTokenRequestSchema,
  oauthTokenRequestSchema,
  oauthTokenResponseSchema,
} from "@api/schemas/oauth-flow";
import { resend } from "@api/services/resend";
import { verifyAccessToken } from "@api/utils/auth";
import { validateClientCredentials } from "@api/utils/oauth";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { Database } from "@midday/db/client";
import {
  createAuthorizationCode,
  exchangeAuthorizationCode,
  getOAuthApplicationByClientId,
  getTeamsByUserId,
  refreshAccessToken,
  revokeAccessToken,
} from "@midday/db/queries";
import { AppInstalledEmail } from "@midday/email/emails/app-installed";
import { render } from "@midday/email/render";
import { rateLimiter } from "hono-rate-limiter";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

const app = new OpenAPIHono<Context>();

app.use("*", ...publicMiddleware);

app.use(
  "*",
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // per IP
    keyGenerator: (c) =>
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
    statusCode: 429,
    message: "Rate limit exceeded",
  }),
);

app.openapi(
  createRoute({
    method: "get",
    path: "/authorize",
    summary: "OAuth Authorization Endpoint",
    operationId: "getOAuthAuthorization",
    description:
      "Initiate OAuth authorization flow and get consent screen information",
    tags: ["OAuth"],
    request: {
      query: oauthAuthorizationRequestSchema,
    },
    responses: {
      200: {
        description: "Application information for consent screen",
        content: {
          "application/json": {
            schema: oauthApplicationInfoSchema,
          },
        },
      },
      400: {
        description: "Invalid request",
        content: {
          "application/json": {
            schema: oauthErrorResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db") as Database;
    const query = c.req.valid("query");
    const { client_id, redirect_uri, scope, state, code_challenge } = query;

    // Validate client_id
    const application = await getOAuthApplicationByClientId(db, client_id);
    if (!application || !application.active) {
      throw new HTTPException(400, {
        message: "Invalid client_id",
      });
    }

    // Enforce PKCE for public clients
    if (application.isPublic && !code_challenge) {
      throw new HTTPException(400, {
        message: "PKCE is required for public clients",
      });
    }

    // Validate redirect_uri
    if (!application.redirectUris.includes(redirect_uri)) {
      throw new HTTPException(400, {
        message: "Invalid redirect_uri",
      });
    }

    // Validate scopes
    const requestedScopes = scope.split(" ").filter(Boolean);
    const invalidScopes = requestedScopes.filter(
      (s) => !application.scopes.includes(s),
    );

    if (invalidScopes.length > 0) {
      throw new HTTPException(400, {
        message: `Invalid scopes: ${invalidScopes.join(", ")}`,
      });
    }

    // Return application info for consent screen
    const applicationInfo = {
      id: application.id,
      name: application.name,
      description: application.description,
      logoUrl: application.logoUrl,
      website: application.website,
      clientId: application.clientId,
      scopes: requestedScopes,
      redirectUri: redirect_uri,
      state,
    };

    return c.json(
      validateResponse(applicationInfo, oauthApplicationInfoSchema),
    );
  },
);

// OAuth Authorization Decision Endpoint - POST (user consent)
app.openapi(
  createRoute({
    method: "post",
    path: "/authorize",
    summary: "OAuth Authorization Decision",
    operationId: "postOAuthAuthorization",
    description: "Process user's authorization decision (allow/deny)",
    tags: ["OAuth"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: oauthAuthorizationDecisionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Authorization decision processed, returns redirect URL",
        content: {
          "application/json": {
            schema: z.object({
              redirect_url: z.string().url(),
            }),
          },
        },
      },
      400: {
        description: "Invalid request",
        content: {
          "application/json": {
            schema: z.object({
              redirect_url: z.string().url(),
            }),
          },
        },
      },
      401: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: z.object({
              redirect_url: z.string().url(),
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const authHeader = c.req.header("Authorization");
    const body = c.req.valid("json");

    const {
      client_id,
      decision,
      scopes,
      redirect_uri,
      state,
      code_challenge,
      teamId,
    } = body;

    // Verify user authentication
    const accessToken = authHeader?.split(" ")[1];
    const session = await verifyAccessToken(accessToken);

    if (!session) {
      throw new HTTPException(401, {
        message: "User must be authenticated",
      });
    }

    // Validate client_id
    const application = await getOAuthApplicationByClientId(db, client_id);
    if (!application || !application.active) {
      throw new HTTPException(400, {
        message: "Invalid client_id",
      });
    }

    // Enforce PKCE for public clients
    if (application.isPublic && !code_challenge) {
      throw new HTTPException(400, {
        message: "PKCE is required for public clients",
      });
    }

    // Validate user is a member of the selected team
    const userTeams = await getTeamsByUserId(db, session.user.id);
    const isMemberOfTeam = userTeams.some((team) => team.id === teamId);

    if (!isMemberOfTeam) {
      throw new HTTPException(403, {
        message: "User is not a member of the selected team",
      });
    }

    const redirectUrl = new URL(redirect_uri);

    // Handle denial
    if (decision === "deny") {
      redirectUrl.searchParams.set("error", "access_denied");
      redirectUrl.searchParams.set("error_description", "User denied access");
      if (state) {
        redirectUrl.searchParams.set("state", state);
      }
      return c.json({ redirect_url: redirectUrl.toString() });
    }

    // Create authorization code
    const authCode = await createAuthorizationCode(db, {
      applicationId: application.id,
      userId: session.user.id,
      teamId: teamId,
      scopes,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
    });

    if (!authCode) {
      throw new HTTPException(500, {
        message: "Failed to create authorization code",
      });
    }

    // Send app installation email
    try {
      // Get team information
      const userTeam = userTeams.find((team) => team.id === teamId);

      if (userTeam && session.user.email) {
        const html = await render(
          AppInstalledEmail({
            email: session.user.email,
            teamName: userTeam.name!,
            appName: application.name,
          }),
        );

        await resend.emails.send({
          from: "Midday <middaybot@midday.ai>",
          to: session.user.email,
          subject: "An app has been added to your team",
          html,
        });
      }
    } catch (error) {
      // Log error but don't fail the OAuth flow
      console.error("Failed to send app installation email:", error);
    }

    // Build success redirect URL
    redirectUrl.searchParams.set("code", authCode.code);
    if (state) {
      redirectUrl.searchParams.set("state", state);
    }

    return c.json({ redirect_url: redirectUrl.toString() });
  },
);

// OAuth Token Exchange Endpoint
app.openapi(
  createRoute({
    method: "post",
    path: "/token",
    summary: "OAuth Token Exchange",
    operationId: "postOAuthToken",
    description:
      "Exchange authorization code for access token or refresh an access token",
    tags: ["OAuth"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.union([
              oauthTokenRequestSchema,
              oauthRefreshTokenRequestSchema,
            ]),
          },
          "application/x-www-form-urlencoded": {
            schema: z.union([
              oauthTokenRequestSchema,
              oauthRefreshTokenRequestSchema,
            ]),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Token exchange successful",
        content: {
          "application/json": {
            schema: oauthTokenResponseSchema,
          },
        },
      },
      400: {
        description: "Invalid request",
        content: {
          "application/json": {
            schema: oauthErrorResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const contentType = c.req.header("content-type") || "";

    let body: any;
    if (contentType.includes("application/x-www-form-urlencoded")) {
      body = await c.req.parseBody();
    } else {
      body = c.req.valid("json");
    }

    const {
      grant_type,
      code,
      redirect_uri,
      client_id,
      client_secret,
      code_verifier,
      refresh_token,
      scope,
    } = body;

    // Validate client credentials
    const application = await getOAuthApplicationByClientId(db, client_id);
    if (!application || !application.active) {
      throw new HTTPException(400, {
        message: "Invalid client credentials",
      });
    }

    // For public clients, client_secret should not be provided
    if (application.isPublic) {
      if (client_secret) {
        throw new HTTPException(400, {
          message: "Public clients must not send client_secret",
        });
      }
    } else {
      // For confidential clients, validate client_secret
      if (!validateClientCredentials(application, client_secret)) {
        throw new HTTPException(400, {
          message: "Invalid client credentials",
        });
      }
    }

    if (grant_type === "authorization_code") {
      if (!code || !redirect_uri) {
        throw new HTTPException(400, {
          message: "Missing required parameters",
        });
      }

      // Exchange authorization code for access token
      const tokenResponse = await exchangeAuthorizationCode(
        db,
        code,
        redirect_uri,
        application.id,
        code_verifier,
      );

      const response = {
        access_token: tokenResponse.accessToken,
        token_type: tokenResponse.tokenType,
        expires_in: tokenResponse.expiresIn,
        refresh_token: tokenResponse.refreshToken || "",
        scope: tokenResponse.scopes.join(" "),
      };

      return c.json(validateResponse(response, oauthTokenResponseSchema));
    }

    if (grant_type === "refresh_token") {
      if (!refresh_token) {
        throw new HTTPException(400, {
          message: "Missing refresh_token",
        });
      }

      try {
        // Parse requested scopes
        const requestedScopes = scope
          ? scope.split(" ").filter(Boolean)
          : undefined;

        // Refresh access token
        const tokenResponse = await refreshAccessToken(db, {
          refreshToken: refresh_token,
          applicationId: application.id,
          scopes: requestedScopes,
        });

        const response = {
          access_token: tokenResponse.accessToken,
          token_type: tokenResponse.tokenType,
          expires_in: tokenResponse.expiresIn,
          refresh_token: tokenResponse.refreshToken || "",
          scope: tokenResponse.scopes.join(" "),
        };

        return c.json(validateResponse(response, oauthTokenResponseSchema));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        if (errorMessage.includes("Invalid refresh token")) {
          throw new HTTPException(400, {
            message: "Invalid refresh token",
          });
        }

        if (errorMessage.includes("expired")) {
          throw new HTTPException(400, {
            message: "Refresh token expired",
          });
        }

        if (errorMessage.includes("revoked")) {
          throw new HTTPException(400, {
            message: "Refresh token revoked",
          });
        }

        throw new HTTPException(400, {
          message: "Failed to refresh access token",
        });
      }
    }

    throw new HTTPException(400, {
      message: "Grant type not supported",
    });
  },
);

// OAuth Token Revocation Endpoint
app.openapi(
  createRoute({
    method: "post",
    path: "/revoke",
    summary: "OAuth Token Revocation",
    operationId: "postOAuthRevoke",
    description: "Revoke an access token or refresh token",
    tags: ["OAuth"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: oauthRevokeTokenRequestSchema,
          },
          "application/x-www-form-urlencoded": {
            schema: oauthRevokeTokenRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Token revocation successful",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const contentType = c.req.header("content-type") || "";

    let body: any;
    if (contentType.includes("application/x-www-form-urlencoded")) {
      body = await c.req.parseBody();
    } else {
      body = c.req.valid("json");
    }

    const { token, client_id, client_secret } = body;

    // Validate client credentials
    const application = await getOAuthApplicationByClientId(db, client_id);
    if (!application || !application.active) {
      throw new HTTPException(400, {
        message: "Invalid client credentials",
      });
    }

    // For public clients, client_secret should not be provided
    if (application.isPublic) {
      if (client_secret) {
        throw new HTTPException(400, {
          message: "Public clients must not send client_secret",
        });
      }
    } else {
      // For confidential clients, validate client_secret
      if (!validateClientCredentials(application, client_secret)) {
        throw new HTTPException(400, {
          message: "Invalid client credentials",
        });
      }
    }

    // Revoke token
    await revokeAccessToken(db, {
      token,
      applicationId: application.id,
    });

    return c.json({ success: true });
  },
);

export default app;
