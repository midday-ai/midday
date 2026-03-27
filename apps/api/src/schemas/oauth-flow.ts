import { SCOPES } from "@api/utils/scopes";
import { z } from "@hono/zod-openapi";

// OAuth Authorization Request Schema
export const oauthAuthorizationRequestSchema = z.object({
  response_type: z.literal("code").openapi({
    description: "OAuth response type, must be 'code'",
    example: "code",
  }),
  client_id: z.string().openapi({
    description: "Client ID of the OAuth application",
    example: "mid_client_abcdef123456789",
  }),
  redirect_uri: z.string().url().openapi({
    description: "Redirect URI for OAuth callback",
    example: "https://myapp.com/callback",
  }),
  scope: z.string().openapi({
    description: "Space-separated list of requested scopes",
    example: "transactions.read invoices.read",
  }),
  state: z
    .string()
    .min(1, "State parameter is required")
    .max(1024, "State parameter must not exceed 1024 characters")
    .openapi({
      description: "Opaque state parameter for CSRF protection",
      example: "abc123xyz789_secure-random-state-value",
    }),
  code_challenge: z.string().optional().openapi({
    description: "Code challenge for PKCE (S256)",
    example: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  }),
  code_challenge_method: z.literal("S256").optional().openapi({
    description: "Code challenge method, must be S256",
    example: "S256",
  }),
  resource: z.string().url().optional().openapi({
    description: "Resource parameter per RFC 9728 — identifies the MCP server",
    example: "https://api.midday.ai",
  }),
});

// OAuth Authorization Response Schema
export const oauthAuthorizationResponseSchema = z.object({
  authorize_url: z.string().url().openapi({
    description: "URL to redirect user for authorization",
    example:
      "https://app.midday.ai/oauth/authorize?client_id=mid_abcdef123456789&...",
  }),
});

// OAuth Token Exchange Request Schema
export const oauthTokenRequestSchema = z
  .object({
    grant_type: z.literal("authorization_code").openapi({
      description: "OAuth grant type, must be 'authorization_code'",
      example: "authorization_code",
    }),
    code: z.string().openapi({
      description: "Authorization code received from authorization endpoint",
      example: "mid_authorization_code_abcdef123456789",
    }),
    redirect_uri: z.string().url().openapi({
      description: "Redirect URI used in authorization request",
      example: "https://myapp.com/callback",
    }),
    client_id: z.string().openapi({
      description: "Client ID of the OAuth application",
      example: "mid_client_abcdef123456789",
    }),
    client_secret: z.string().optional().openapi({
      description:
        "Client secret of the OAuth application (required for confidential clients)",
      example: "mid_secret_abcdef123456789",
    }),
    code_verifier: z.string().optional().openapi({
      description:
        "Code verifier for PKCE (required for public clients using PKCE)",
      example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
    }),
  })
  .refine((data) => data.client_secret || data.code_verifier, {
    message: "Either client_secret or code_verifier must be provided",
  });

// OAuth Refresh Token Request Schema
export const oauthRefreshTokenRequestSchema = z.object({
  grant_type: z.literal("refresh_token").openapi({
    description: "OAuth grant type, must be 'refresh_token'",
    example: "refresh_token",
  }),
  refresh_token: z.string().openapi({
    description: "Refresh token received from token endpoint",
    example: "mid_rt_abcdef123456789",
  }),
  client_id: z.string().openapi({
    description: "Client ID of the OAuth application",
    example: "mid_client_abcdef123456789",
  }),
  client_secret: z.string().optional().openapi({
    description:
      "Client secret of the OAuth application (required for confidential clients)",
    example: "mid_secret_abcdef123456789",
  }),
  scope: z.string().optional().openapi({
    description: "Space-separated list of requested scopes (optional)",
    example: "transactions.read invoices.read",
  }),
});

// OAuth Token Endpoint Request Schema (union of authorization code + refresh token)
export const oauthTokenEndpointRequestSchema = z
  .union([oauthTokenRequestSchema, oauthRefreshTokenRequestSchema])
  .openapi("OAuthTokenEndpointRequest");

// OAuth Token Response Schema
export const oauthTokenResponseSchema = z.object({
  access_token: z.string().openapi({
    description: "Access token for API requests",
    example: "mid_access_token_abcdef123456789",
  }),
  token_type: z.literal("Bearer").openapi({
    description: "Token type, always 'Bearer'",
    example: "Bearer",
  }),
  expires_in: z.number().openapi({
    description: "Token expiration time in seconds",
    example: 3600,
  }),
  refresh_token: z.string().openapi({
    description: "Refresh token for obtaining new access tokens",
    example: "mid_refresh_token_abcdef123456789",
  }),
  scope: z.string().openapi({
    description: "Space-separated list of granted scopes",
    example: "transactions.read invoices.read",
  }),
});

// OAuth Token Revocation Request Schema
export const oauthRevokeTokenRequestSchema = z.object({
  token: z.string().openapi({
    description: "Token to revoke (access token or refresh token)",
    example: "mid_access_token_abcdef123456789",
  }),
  token_type_hint: z
    .enum(["access_token", "refresh_token"])
    .optional()
    .openapi({
      description: "Hint about the token type",
      example: "access_token",
    }),
  client_id: z.string().openapi({
    description: "Client ID of the OAuth application",
    example: "mid_client_abcdef123456789",
  }),
  client_secret: z.string().optional().openapi({
    description:
      "Client secret of the OAuth application (required for confidential clients)",
    example: "mid_secret_abcdef123456789",
  }),
});

// OAuth Error Response Schema
export const oauthErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: "Error code",
      example: "invalid_request",
    }),
    error_description: z.string().optional().openapi({
      description: "Human-readable error description",
      example: "The request is missing a required parameter",
    }),
    error_uri: z.string().url().optional().openapi({
      description: "URI to a human-readable error page",
      example: "https://docs.midday.ai/errors/invalid_request",
    }),
    state: z.string().max(1024).optional().openapi({
      description: "Opaque state parameter from the original request",
      example: "abc123xyz789_secure-random-state-value",
    }),
  })
  .openapi("OAuthErrorResponse");

// OAuth Authorization Decision Schema (for consent flow)
export const oauthAuthorizationDecisionSchema = z.object({
  client_id: z.string().openapi({
    description: "Client ID of the OAuth application",
    example: "mid_client_abcdef123456789",
  }),
  decision: z.enum(["allow", "deny"]).openapi({
    description: "User's authorization decision",
    example: "allow",
  }),
  scopes: z.array(z.enum(SCOPES)).openapi({
    description: "Scopes the user has approved",
    example: ["transactions.read", "invoices.read"],
  }),
  redirect_uri: z.string().url().openapi({
    description: "Redirect URI for OAuth callback",
    example: "https://myapp.com/callback",
  }),
  state: z
    .string()
    .min(1, "State parameter is required")
    .max(1024, "State parameter must not exceed 1024 characters")
    .optional()
    .openapi({
      description: "Opaque state parameter for CSRF protection",
      example: "abc123xyz789_secure-random-state-value",
    }),
  code_challenge: z.string().optional().openapi({
    description: "Code challenge for PKCE (S256 method assumed)",
    example: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  }),
  teamId: z.string().uuid().openapi({
    description: "Team ID to authorize the application for",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

// OAuth Application Info Schema (for consent screen)
export const oauthApplicationInfoSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Application ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().openapi({
    description: "Application name",
    example: "My Raycast Extension",
  }),
  description: z.string().nullable().openapi({
    description: "Application description",
    example: "A Raycast extension for managing transactions",
  }),
  overview: z.string().nullable().openapi({
    description: "Application overview",
    example:
      "This application provides advanced transaction management features including:\n- Real-time sync\n- Advanced filtering",
  }),
  developerName: z.string().nullable().openapi({
    description: "The person or company developing this application",
    example: "Acme Corp",
  }),
  logoUrl: z.string().nullable().openapi({
    description: "Application logo URL",
    example: "https://example.com/logo.png",
  }),
  website: z.string().nullable().openapi({
    description: "Application website",
    example: "https://myapp.com",
  }),
  installUrl: z.string().nullable().openapi({
    description: "An optional URL for installing the application",
    example: "https://myapp.com/install",
  }),
  screenshots: z.array(z.string().url()).openapi({
    description: "Up to 4 screenshots that will be displayed on the apps page",
    example: [
      "https://example.com/screenshot1.png",
      "https://example.com/screenshot2.png",
    ],
  }),
  clientId: z.string().openapi({
    description: "Client ID",
    example: "mid_client_abcdef123456789",
  }),
  scopes: z.array(z.string()).openapi({
    description: "Requested scopes",
    example: ["transactions.read", "invoices.read"],
  }),
  redirectUri: z.string().url().openapi({
    description: "Redirect URI",
    example: "https://myapp.com/callback",
  }),
  state: z.string().max(1024).optional().openapi({
    description: "Opaque state parameter",
    example: "abc123xyz789_secure-random-state-value",
  }),
  status: z.enum(["draft", "pending", "approved", "rejected"]).openapi({
    description: "Application verification status",
    example: "approved",
  }),
});

// Dynamic Client Registration (RFC 7591) Request Schema
export const dcrRequestSchema = z.object({
  client_name: z.string().min(1).max(256).openapi({
    description: "Human-readable name of the client",
    example: "ChatGPT",
  }),
  redirect_uris: z
    .array(z.string().url())
    .min(1)
    .openapi({
      description: "Array of redirect URIs",
      example: ["https://chatgpt.com/connector/oauth/callback"],
    }),
  grant_types: z
    .array(z.string())
    .optional()
    .default(["authorization_code", "refresh_token"])
    .openapi({
      description: "Requested grant types",
      example: ["authorization_code", "refresh_token"],
    }),
  token_endpoint_auth_method: z.string().optional().default("none").openapi({
    description: "Token endpoint authentication method",
    example: "none",
  }),
  scope: z.string().optional().openapi({
    description: "Space-separated requested scopes",
    example: "transactions.read invoices.read",
  }),
  logo_uri: z.string().url().optional().openapi({
    description: "URL of the client logo",
    example: "https://example.com/logo.png",
  }),
  client_uri: z.string().url().optional().openapi({
    description: "URL of the client homepage",
    example: "https://example.com",
  }),
  response_types: z
    .array(z.string())
    .optional()
    .openapi({
      description: "Requested response types",
      example: ["code"],
    }),
});

// Dynamic Client Registration Response Schema
export const dcrResponseSchema = z.object({
  client_id: z.string().openapi({
    description: "Assigned client ID",
    example: "mid_client_abcdef123456789",
  }),
  client_name: z.string().openapi({
    description: "Human-readable name of the client",
    example: "ChatGPT",
  }),
  redirect_uris: z.array(z.string().url()).openapi({
    description: "Registered redirect URIs",
    example: ["https://chatgpt.com/connector/oauth/callback"],
  }),
  grant_types: z.array(z.string()).openapi({
    description: "Granted grant types",
    example: ["authorization_code", "refresh_token"],
  }),
  token_endpoint_auth_method: z.string().openapi({
    description: "Token endpoint authentication method",
    example: "none",
  }),
  response_types: z.array(z.string()).openapi({
    description: "Supported response types",
    example: ["code"],
  }),
});

// User's Authorized Applications Schema
export const userAuthorizedApplicationsSchema = z.object({
  data: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string().nullable(),
      overview: z.string().nullable(),
      developerName: z.string().nullable(),
      logoUrl: z.string().nullable(),
      website: z.string().nullable(),
      installUrl: z.string().nullable(),
      screenshots: z.array(z.string().url()),
      scopes: z.array(z.string()),
      lastUsedAt: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
});

// Revoke User Application Access Schema
export const revokeUserApplicationAccessSchema = z.object({
  applicationId: z.string().uuid().openapi({
    description: "ID of the application to revoke access for",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});
