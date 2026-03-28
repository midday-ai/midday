import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  dcrRequestSchema,
  dcrResponseSchema,
  oauthApplicationInfoSchema,
  oauthAuthorizationDecisionSchema,
  oauthAuthorizationRequestSchema,
  oauthErrorResponseSchema,
  oauthRevokeTokenRequestSchema,
  oauthTokenEndpointRequestSchema,
  oauthTokenResponseSchema,
} from "@api/schemas/oauth-flow";
import { resend } from "@api/services/resend";
import { verifyAccessToken } from "@api/utils/auth";
import { validateClientCredentials } from "@api/utils/oauth";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { Database } from "@midday/db/client";
import {
  claimDCRApplication,
  createAuthorizationCode,
  createDCRApplication,
  exchangeAuthorizationCode,
  getOAuthApplicationByClientId,
  getTeamsByUserId,
  hasUserEverAuthorizedApp,
  refreshAccessToken,
  revokeAccessToken,
} from "@midday/db/queries";
import { AppInstalledEmail } from "@midday/email/emails/app-installed";
import { render } from "@midday/email/render";
import { createLoggerWithContext } from "@midday/logger";
import { HTTPException } from "hono/http-exception";
import { rateLimiter } from "hono-rate-limiter";
import { z } from "zod";

const logger = createLoggerWithContext("rest:oauth");

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

// Dynamic Client Registration (RFC 7591)
app.use(
  "/register",
  rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10, // per IP
    keyGenerator: (c) =>
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
    statusCode: 429,
    message: "Registration rate limit exceeded",
  }),
);

app.openapi(
  createRoute({
    method: "post",
    path: "/register",
    summary: "Dynamic Client Registration",
    operationId: "postOAuthRegister",
    description:
      "Register an OAuth client dynamically (RFC 7591). Used by MCP clients like ChatGPT and Claude.",
    tags: ["OAuth"],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: dcrRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Client registered successfully",
        content: {
          "application/json": {
            schema: dcrResponseSchema,
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
    const body = c.req.valid("json");

    if (!body.redirect_uris || body.redirect_uris.length === 0) {
      throw new HTTPException(400, {
        message: "At least one redirect_uri is required",
      });
    }

    for (const uri of body.redirect_uris) {
      const isHttps = uri.startsWith("https://");
      const isLocalhost = uri.startsWith("http://localhost");
      const isNativeScheme =
        /^[a-z][a-z0-9+.-]*:\/\//i.test(uri) && !uri.startsWith("http://");

      if (!isHttps && !isLocalhost && !isNativeScheme) {
        throw new HTTPException(400, {
          message: `redirect_uri must use HTTPS or a native app scheme: ${uri}`,
        });
      }
    }

    const result = await createDCRApplication(db, {
      clientName: body.client_name,
      redirectUris: body.redirect_uris,
      scope: body.scope,
      logoUri: body.logo_uri,
      clientUri: body.client_uri,
      grantTypes: body.grant_types,
      tokenEndpointAuthMethod: body.token_endpoint_auth_method,
    });

    if (!result) {
      throw new HTTPException(500, {
        message: "Failed to register client",
      });
    }

    const response = {
      client_id: result.clientId as string,
      client_name: result.name as string,
      redirect_uris: result.redirectUris as string[],
      grant_types: body.grant_types || ["authorization_code", "refresh_token"],
      token_endpoint_auth_method: body.token_endpoint_auth_method || "none",
      response_types: body.response_types || ["code"],
    };

    return c.json(response, 201);
  },
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
    if (!application?.active) {
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

    // Validate scopes — for DCR apps (empty scopes), allow any valid scope
    const requestedScopes = scope.split(" ").filter(Boolean);
    if (application.scopes.length > 0) {
      const invalidScopes = requestedScopes.filter(
        (s) => !application.scopes.includes(s),
      );

      if (invalidScopes.length > 0) {
        throw new HTTPException(400, {
          message: `Invalid scopes: ${invalidScopes.join(", ")}`,
        });
      }
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
      200,
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
        required: true,
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
    if (!application?.active) {
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

    // Claim unclaimed DCR app for this team before issuing any auth codes
    if (!application.teamId) {
      await claimDCRApplication(db, application.id, teamId, session.user.id);
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

    // Send app installation email only if this is the first time authorizing this app
    try {
      // Check if user has ever authorized this application for this team (including expired tokens)
      const hasAuthorizedBefore = await hasUserEverAuthorizedApp(
        db,
        session.user.id,
        teamId,
        application.id,
      );

      if (!hasAuthorizedBefore) {
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
      }
    } catch (error) {
      // Log error but don't fail the OAuth flow
      logger.error("Failed to send app installation email", {
        error: error instanceof Error ? error.message : String(error),
      });
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
      "Exchange authorization code for access token or refresh an access token. Accepts application/json or application/x-www-form-urlencoded.",
    tags: ["OAuth"],
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
      body = await c.req.json();
    }

    const parsed = oauthTokenEndpointRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    }

    const data = parsed.data;
    const { client_id, client_secret } = data;

    // Validate client credentials
    const application = await getOAuthApplicationByClientId(db, client_id);
    if (!application?.active) {
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
      if (
        !client_secret ||
        !validateClientCredentials(application, client_secret)
      ) {
        throw new HTTPException(400, {
          message: "Invalid client credentials",
        });
      }
    }

    if (data.grant_type === "authorization_code") {
      const { code, redirect_uri, code_verifier } = data;

      try {
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

        return c.json(
          validateResponse(response, oauthTokenResponseSchema),
          200,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Handle specific OAuth errors with proper error codes
        if (errorMessage.includes("Authorization code expired")) {
          throw new HTTPException(400, {
            message:
              "The authorization code has expired. Please restart the OAuth flow.",
          });
        }

        if (errorMessage.includes("Authorization code already used")) {
          throw new HTTPException(400, {
            message:
              "The authorization code has already been used. All related tokens have been revoked for security.",
          });
        }

        if (errorMessage.includes("Invalid authorization code")) {
          throw new HTTPException(400, {
            message: "The authorization code is invalid or malformed.",
          });
        }

        if (errorMessage.includes("redirect_uri")) {
          throw new HTTPException(400, {
            message:
              "The redirect_uri does not match the one used in the authorization request.",
          });
        }

        // Generic fallback for other errors
        throw new HTTPException(400, {
          message: "Failed to exchange authorization code for access token.",
        });
      }
    }

    if (data.grant_type === "refresh_token") {
      const { refresh_token, scope } = data;

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

        return c.json(
          validateResponse(response, oauthTokenResponseSchema),
          200,
        );
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
    description:
      "Revoke an access token or refresh token. Accepts application/json or application/x-www-form-urlencoded.",
    tags: ["OAuth"],
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
      body = await c.req.json();
    }

    const parsed = oauthRevokeTokenRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    }

    const { token, client_id, client_secret } = parsed.data;

    // Validate client credentials
    const application = await getOAuthApplicationByClientId(db, client_id);
    if (!application?.active) {
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
      if (
        !client_secret ||
        !validateClientCredentials(application, client_secret)
      ) {
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
