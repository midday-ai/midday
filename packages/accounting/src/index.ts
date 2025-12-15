import type { AccountingProvider } from "./provider";
import { XeroProvider } from "./providers/xero";
import type { AccountingProviderId, ProviderInitConfig } from "./types";

// Re-export types
export * from "./types";
export * from "./provider";
export * from "./utils";
export { XeroProvider, XERO_SCOPES } from "./providers/xero";

/**
 * Get an accounting provider instance by ID
 *
 * @param providerId - The provider identifier (xero, quickbooks, etc.)
 * @param config - Provider configuration including OAuth credentials
 * @returns An AccountingProvider instance
 *
 * @example
 * ```typescript
 * const provider = getAccountingProvider('xero', {
 *   clientId: process.env.XERO_CLIENT_ID,
 *   clientSecret: process.env.XERO_CLIENT_SECRET,
 *   redirectUri: process.env.XERO_REDIRECT_URI,
 *   config: storedConfig, // Optional: existing token config
 * });
 *
 * const url = await provider.buildConsentUrl(encryptedState);
 * ```
 */
export function getAccountingProvider(
  providerId: AccountingProviderId,
  config: ProviderInitConfig
): AccountingProvider {
  switch (providerId) {
    case "xero":
      return new XeroProvider(config);

    case "quickbooks":
      // TODO: Implement QuickBooks provider
      throw new Error("QuickBooks provider not yet implemented");

    case "fortnox":
      // TODO: Implement Fortnox provider
      throw new Error("Fortnox provider not yet implemented");

    case "visma":
      // TODO: Implement Visma provider
      throw new Error("Visma provider not yet implemented");

    default:
      throw new Error(`Unknown accounting provider: ${providerId}`);
  }
}

/**
 * Check if a provider is currently supported
 */
export function isProviderSupported(providerId: string): boolean {
  return providerId === "xero";
}

/**
 * Get list of all supported provider IDs
 */
export function getSupportedProviders(): AccountingProviderId[] {
  return ["xero"]; // Add more as they're implemented
}

