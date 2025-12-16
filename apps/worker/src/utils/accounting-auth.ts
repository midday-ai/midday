import type {
  AccountingProvider,
  AccountingProviderConfig,
} from "@midday/accounting";
import type { Database } from "@midday/db/client";
import { updateAppTokens } from "@midday/db/queries";

/**
 * Ensure the accounting provider has a valid (non-expired) token
 * If expired, refreshes the token and updates the database atomically
 *
 * @returns Updated config with fresh tokens if refresh was needed
 */
export const ensureValidToken = async (
  db: Database,
  provider: AccountingProvider,
  config: AccountingProviderConfig,
  teamId: string,
  providerId: string,
): Promise<AccountingProviderConfig> => {
  const expiresAt = new Date(config.expiresAt);

  // If token is still valid, return current config
  if (!provider.isTokenExpired(expiresAt)) {
    return config;
  }

  // Token is expired, refresh it
  const newTokens = await provider.refreshTokens(config.refreshToken);

  // Update tokens in database atomically
  await updateAppTokens(db, {
    teamId,
    appId: providerId,
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    expiresAt: newTokens.expiresAt.toISOString(),
  });

  // Return updated config
  return {
    ...config,
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    expiresAt: newTokens.expiresAt.toISOString(),
  };
};

/**
 * Get OAuth client credentials for a provider
 */
export const getProviderCredentials = (
  providerId: string,
): {
  clientId: string | undefined;
  clientSecret: string | undefined;
  redirectUri: string | undefined;
} => {
  switch (providerId) {
    case "xero":
      return {
        clientId: process.env.XERO_CLIENT_ID,
        clientSecret: process.env.XERO_CLIENT_SECRET,
        redirectUri: process.env.XERO_OAUTH_REDIRECT_URL,
      };
    case "quickbooks":
      return {
        clientId: process.env.QUICKBOOKS_CLIENT_ID,
        clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
        redirectUri: process.env.QUICKBOOKS_OAUTH_REDIRECT_URL,
      };
    case "fortnox":
      return {
        clientId: process.env.FORTNOX_CLIENT_ID,
        clientSecret: process.env.FORTNOX_CLIENT_SECRET,
        redirectUri: process.env.FORTNOX_OAUTH_REDIRECT_URL,
      };
    default:
      // Unknown provider - credentials will fail validation
      return {
        clientId: undefined,
        clientSecret: undefined,
        redirectUri: undefined,
      };
  }
};

/**
 * Validate that all required OAuth credentials are present
 */
export const validateProviderCredentials = (
  providerId: string,
  credentials: ReturnType<typeof getProviderCredentials>,
): void => {
  const { clientId, clientSecret, redirectUri } = credentials;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(`Missing OAuth configuration for ${providerId}`);
  }
};
