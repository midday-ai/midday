import type { AccountingProvider } from "./provider";
import { FortnoxProvider } from "./providers/fortnox";
import { QuickBooksProvider } from "./providers/quickbooks";
import { XeroProvider } from "./providers/xero";
import type { AccountingProviderId, ProviderInitConfig } from "./types";

// Re-export types
export * from "./types";
export * from "./provider";
export * from "./utils";
export { XeroProvider, XERO_SCOPES } from "./providers/xero";
export { QuickBooksProvider, QUICKBOOKS_SCOPES } from "./providers/quickbooks";
export { FortnoxProvider, FORTNOX_SCOPES } from "./providers/fortnox";

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
  config: ProviderInitConfig,
): AccountingProvider {
  switch (providerId) {
    case "xero":
      return new XeroProvider(config);

    case "quickbooks":
      return new QuickBooksProvider(config);

    case "fortnox":
      return new FortnoxProvider(config);

    case "visma":
      throw new Error(
        `Accounting provider "${providerId}" is not yet implemented. ` +
          `Currently supported: xero, quickbooks, fortnox`,
      );

    default: {
      // TypeScript exhaustive check
      const _exhaustive: never = providerId;
      throw new Error(`Unknown accounting provider: ${_exhaustive}`);
    }
  }
}

/**
 * Check if a provider is currently supported
 */
export function isProviderSupported(providerId: string): boolean {
  return (
    providerId === "xero" ||
    providerId === "quickbooks" ||
    providerId === "fortnox"
  );
}

/**
 * Get list of all supported provider IDs
 */
export function getSupportedProviders(): AccountingProviderId[] {
  return ["xero", "quickbooks", "fortnox"];
}
