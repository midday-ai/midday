import { createHash } from "node:crypto";
import type { Database } from "@db/client";
import {
  oauthAccessTokens,
  oauthApplications,
  oauthAuthorizationCodes,
  users,
} from "@db/schema";
import { hash } from "@midday/encryption";
import { and, desc, eq, gt, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";

export type CreateAuthorizationCodeParams = {
  applicationId: string;
  userId: string;
  teamId: string;
  scopes: string[];
  redirectUri: string;
  codeChallenge?: string;
};

export type CreateAccessTokenParams = {
  applicationId: string;
  userId: string;
  teamId: string;
  scopes: string[];
  expiresInSeconds?: number;
  refreshTokenExpiresInSeconds?: number;
};

export type RefreshAccessTokenParams = {
  refreshToken: string;
  applicationId: string;
  scopes?: string[];
};

export type RevokeTokenParams = {
  token: string;
  applicationId?: string;
};

// Create authorization code
export async function createAuthorizationCode(
  db: Database,
  params: CreateAuthorizationCodeParams,
) {
  const code = `mid_authorization_code_${nanoid(32)}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const [result] = await db
    .insert(oauthAuthorizationCodes)
    .values({
      code,
      applicationId: params.applicationId,
      userId: params.userId,
      teamId: params.teamId,
      scopes: params.scopes,
      redirectUri: params.redirectUri,
      expiresAt: expiresAt.toISOString(),
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallenge ? "S256" : null,
    })
    .returning({
      id: oauthAuthorizationCodes.id,
      code: oauthAuthorizationCodes.code,
      expiresAt: oauthAuthorizationCodes.expiresAt,
    });

  return result;
}

// Exchange authorization code for access token
export async function exchangeAuthorizationCode(
  db: Database,
  code: string,
  redirectUri: string,
  applicationId: string,
  codeVerifier?: string,
) {
  // Get the authorization code
  const [authCode] = await db
    .select({
      id: oauthAuthorizationCodes.id,
      applicationId: oauthAuthorizationCodes.applicationId,
      userId: oauthAuthorizationCodes.userId,
      teamId: oauthAuthorizationCodes.teamId,
      scopes: oauthAuthorizationCodes.scopes,
      redirectUri: oauthAuthorizationCodes.redirectUri,
      expiresAt: oauthAuthorizationCodes.expiresAt,
      used: oauthAuthorizationCodes.used,
      codeChallenge: oauthAuthorizationCodes.codeChallenge,
      codeChallengeMethod: oauthAuthorizationCodes.codeChallengeMethod,
      createdAt: oauthAuthorizationCodes.createdAt,
    })
    .from(oauthAuthorizationCodes)
    .where(eq(oauthAuthorizationCodes.code, code))
    .limit(1);

  if (!authCode) {
    throw new Error("Invalid authorization code");
  }

  // Validate that the authorization code belongs to the same application
  if (authCode.applicationId !== applicationId) {
    throw new Error("Authorization code does not belong to this application");
  }

  // SECURITY CRITICAL: Check for authorization code reuse
  if (authCode.used) {
    // RFC 6819: When an authorization code is used more than once,
    // all tokens issued for that authorization code MUST be revoked
    const revokedTokens = await revokeTokensByAuthorizationCode(db, {
      applicationId: authCode.applicationId,
      userId: authCode.userId,
      teamId: authCode.teamId,
      createdAt: authCode.createdAt,
    });

    console.warn(
      `[SECURITY] Authorization code reuse detected for application ${authCode.applicationId}. ` +
        `Revoked ${revokedTokens.length} potentially related tokens.`,
    );

    throw new Error(
      "Authorization code already used - all related tokens have been revoked for security",
    );
  }

  if (new Date() > new Date(authCode.expiresAt)) {
    throw new Error("Authorization code expired");
  }

  if (authCode.redirectUri !== redirectUri) {
    throw new Error("Invalid redirect URI");
  }

  // Verify PKCE code verifier if code challenge exists
  if (authCode.codeChallenge) {
    if (!codeVerifier) {
      throw new Error(
        "Code verifier is required when code challenge is present",
      );
    }

    // Always use S256 method since it's the only supported method
    const computedChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    if (computedChallenge !== authCode.codeChallenge) {
      throw new Error("Invalid code verifier");
    }
  }

  // Mark the authorization code as used
  await db
    .update(oauthAuthorizationCodes)
    .set({ used: true })
    .where(eq(oauthAuthorizationCodes.id, authCode.id));

  // Create access token
  const accessToken = await createAccessToken(db, {
    applicationId: authCode.applicationId,
    userId: authCode.userId,
    teamId: authCode.teamId,
    scopes: authCode.scopes,
  });

  return accessToken;
}

// Create access token
export async function createAccessToken(
  db: Database,
  params: CreateAccessTokenParams,
) {
  const token = `mid_access_token_${nanoid(32)}`;
  const refreshToken = `mid_refresh_token_${nanoid(32)}`;
  const expiresInSeconds = params.expiresInSeconds ?? 7200; // 2 hours default
  const refreshTokenExpiresInSeconds =
    params.refreshTokenExpiresInSeconds ?? 86400 * 30; // 30 days default

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const refreshTokenExpiresAt = new Date(
    Date.now() + refreshTokenExpiresInSeconds * 1000,
  );

  // Hash tokens before storing in database
  const tokenHash = hash(token);
  const refreshTokenHash = hash(refreshToken);

  const [result] = await db
    .insert(oauthAccessTokens)
    .values({
      token: tokenHash,
      refreshToken: refreshTokenHash,
      applicationId: params.applicationId,
      userId: params.userId,
      teamId: params.teamId,
      scopes: params.scopes,
      expiresAt: expiresAt.toISOString(),
      refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
    })
    .returning({
      id: oauthAccessTokens.id,
      token: oauthAccessTokens.token,
      refreshToken: oauthAccessTokens.refreshToken,
      expiresAt: oauthAccessTokens.expiresAt,
      refreshTokenExpiresAt: oauthAccessTokens.refreshTokenExpiresAt,
      scopes: oauthAccessTokens.scopes,
    });

  if (!result) {
    throw new Error("Failed to create access token");
  }

  return {
    accessToken: token,
    refreshToken: refreshToken,
    expiresIn: expiresInSeconds,
    refreshTokenExpiresIn: refreshTokenExpiresInSeconds,
    scopes: result.scopes,
    tokenType: "Bearer" as const,
  };
}

// Validate access token
export async function validateAccessToken(db: Database, token: string) {
  // Hash the incoming token to compare with stored hash
  const tokenHash = hash(token);

  const [result] = await db
    .select({
      id: oauthAccessTokens.id,
      token: oauthAccessTokens.token,
      applicationId: oauthAccessTokens.applicationId,
      userId: oauthAccessTokens.userId,
      teamId: oauthAccessTokens.teamId,
      scopes: oauthAccessTokens.scopes,
      expiresAt: oauthAccessTokens.expiresAt,
      revoked: oauthAccessTokens.revoked,
      user: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
      application: {
        id: oauthApplications.id,
        name: oauthApplications.name,
        clientId: oauthApplications.clientId,
        active: oauthApplications.active,
      },
    })
    .from(oauthAccessTokens)
    .leftJoin(users, eq(oauthAccessTokens.userId, users.id))
    .leftJoin(
      oauthApplications,
      eq(oauthAccessTokens.applicationId, oauthApplications.id),
    )
    .where(
      and(
        eq(oauthAccessTokens.token, tokenHash), // Compare with hashed token
        eq(oauthAccessTokens.revoked, false),
        gt(oauthAccessTokens.expiresAt, new Date().toISOString()),
      ),
    )
    .limit(1);

  if (!result) {
    return null;
  }

  if (!result.application?.active) {
    return null;
  }

  // Update last used timestamp
  await db
    .update(oauthAccessTokens)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(oauthAccessTokens.id, result.id));

  return result;
}

// Refresh access token
export async function refreshAccessToken(
  db: Database,
  params: RefreshAccessTokenParams,
) {
  const { refreshToken, applicationId, scopes } = params;

  // Hash the incoming refresh token to compare with stored hash
  const refreshTokenHash = hash(refreshToken);

  // Get the existing token
  const [existingToken] = await db
    .select({
      id: oauthAccessTokens.id,
      userId: oauthAccessTokens.userId,
      teamId: oauthAccessTokens.teamId,
      scopes: oauthAccessTokens.scopes,
      refreshTokenExpiresAt: oauthAccessTokens.refreshTokenExpiresAt,
      revoked: oauthAccessTokens.revoked,
    })
    .from(oauthAccessTokens)
    .where(
      and(
        eq(oauthAccessTokens.refreshToken, refreshTokenHash), // Compare with hashed refresh token
        eq(oauthAccessTokens.applicationId, applicationId),
        eq(oauthAccessTokens.revoked, false),
      ),
    )
    .limit(1);

  if (!existingToken) {
    throw new Error("Invalid refresh token");
  }

  if (existingToken.revoked) {
    throw new Error("Refresh token revoked");
  }

  if (
    existingToken.refreshTokenExpiresAt &&
    new Date() > new Date(existingToken.refreshTokenExpiresAt)
  ) {
    throw new Error("Refresh token expired");
  }

  // Validate scopes if provided
  let validatedScopes = existingToken.scopes;
  if (scopes && scopes.length > 0) {
    // Ensure requested scopes are a subset of the original token's scopes
    const originalScopes = new Set(existingToken.scopes);
    const requestedScopes = new Set(scopes);

    for (const scope of requestedScopes) {
      if (!originalScopes.has(scope)) {
        throw new Error(
          `Requested scope '${scope}' is not authorized for this token`,
        );
      }
    }

    // Use the validated subset of scopes
    validatedScopes = scopes;
  }

  // Revoke the old token
  await db
    .update(oauthAccessTokens)
    .set({
      revoked: true,
      revokedAt: new Date().toISOString(),
    })
    .where(eq(oauthAccessTokens.id, existingToken.id));

  // Create new access token
  const newToken = await createAccessToken(db, {
    applicationId,
    userId: existingToken.userId,
    teamId: existingToken.teamId,
    scopes: validatedScopes,
  });

  return newToken;
}

// Revoke access token
export async function revokeAccessToken(
  db: Database,
  params: RevokeTokenParams,
) {
  const { token, applicationId } = params;

  // Hash the incoming token to compare with stored hash
  const tokenHash = hash(token);

  const whereConditions = [
    eq(oauthAccessTokens.token, tokenHash), // Compare with hashed token
    eq(oauthAccessTokens.revoked, false),
  ];

  if (applicationId) {
    whereConditions.push(eq(oauthAccessTokens.applicationId, applicationId));
  }

  const [result] = await db
    .update(oauthAccessTokens)
    .set({
      revoked: true,
      revokedAt: new Date().toISOString(),
    })
    .where(and(...whereConditions))
    .returning({
      id: oauthAccessTokens.id,
      token: oauthAccessTokens.token,
    });

  return result;
}

// Get user's authorized applications
export async function getUserAuthorizedApplications(
  db: Database,
  userId: string,
  teamId: string,
) {
  return db
    .select({
      id: oauthApplications.id,
      name: oauthApplications.name,
      description: oauthApplications.description,
      overview: oauthApplications.overview,
      developerName: oauthApplications.developerName,
      logoUrl: oauthApplications.logoUrl,
      website: oauthApplications.website,
      installUrl: oauthApplications.installUrl,
      screenshots: oauthApplications.screenshots,
      scopes: oauthAccessTokens.scopes,
      lastUsedAt: oauthAccessTokens.lastUsedAt,
      createdAt: oauthAccessTokens.createdAt,
      expiresAt: oauthAccessTokens.expiresAt,
      refreshTokenExpiresAt: oauthAccessTokens.refreshTokenExpiresAt,
    })
    .from(oauthAccessTokens)
    .leftJoin(
      oauthApplications,
      eq(oauthAccessTokens.applicationId, oauthApplications.id),
    )
    .where(
      and(
        eq(oauthAccessTokens.userId, userId),
        eq(oauthAccessTokens.teamId, teamId),
        eq(oauthAccessTokens.revoked, false),
        gt(oauthAccessTokens.expiresAt, new Date().toISOString()),
      ),
    )
    .orderBy(desc(oauthAccessTokens.lastUsedAt));
}

// Revoke all user tokens for an application
export async function revokeUserApplicationTokens(
  db: Database,
  userId: string,
  applicationId: string,
) {
  await db
    .update(oauthAccessTokens)
    .set({
      revoked: true,
      revokedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(oauthAccessTokens.userId, userId),
        eq(oauthAccessTokens.applicationId, applicationId),
        eq(oauthAccessTokens.revoked, false),
      ),
    );
}

// SECURITY: Revoke tokens potentially related to an authorization code
// This is used when authorization code reuse is detected
export async function revokeTokensByAuthorizationCode(
  db: Database,
  authCode: {
    applicationId: string;
    userId: string;
    teamId: string;
    createdAt?: string;
  },
) {
  // Calculate time window for potential related tokens (within 10 minutes of auth code creation)
  const authCodeTime = authCode.createdAt
    ? new Date(authCode.createdAt)
    : new Date();
  const timeWindowStart = new Date(authCodeTime.getTime() - 10 * 60 * 1000); // 10 minutes before
  const timeWindowEnd = new Date(authCodeTime.getTime() + 10 * 60 * 1000); // 10 minutes after

  // Revoke tokens that match the authorization code context and were created around the same time
  const revokedTokens = await db
    .update(oauthAccessTokens)
    .set({
      revoked: true,
      revokedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(oauthAccessTokens.applicationId, authCode.applicationId),
        eq(oauthAccessTokens.userId, authCode.userId),
        eq(oauthAccessTokens.teamId, authCode.teamId),
        eq(oauthAccessTokens.revoked, false),
        gte(oauthAccessTokens.createdAt, timeWindowStart.toISOString()),
        // Only include end time filter if we have the auth code creation time
        ...(authCode.createdAt
          ? [lte(oauthAccessTokens.createdAt, timeWindowEnd.toISOString())]
          : []),
      ),
    )
    .returning({
      id: oauthAccessTokens.id,
      token: oauthAccessTokens.token,
    });

  return revokedTokens;
}
