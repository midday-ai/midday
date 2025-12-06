/**
 * Safely normalizes currency codes to ISO 4217 format
 * Extracts 3-letter ISO codes from strings, falls back to USD if invalid
 */
export function normalizeCurrencyCode(
  currency: string | null | undefined,
): string {
  try {
    if (!currency) {
      return "USD";
    }

    if (typeof currency !== "string") {
      return "USD";
    }

    const normalized = currency.trim().toUpperCase();

    if (!normalized) {
      return "USD";
    }

    // If it's already a valid ISO 4217 code (3 uppercase letters), use it
    if (/^[A-Z]{3}$/.test(normalized)) {
      return normalized;
    }

    // Try to extract 3-letter code from strings like "US$" -> "USD"
    // Remove all non-alphanumeric characters and look for 3-letter pattern
    const cleaned = normalized.replace(/[^A-Z0-9]/g, "");
    if (cleaned.length >= 3) {
      // Try to find a 3-letter ISO code pattern
      const match = cleaned.match(/[A-Z]{3}/);
      if (match) {
        return match[0];
      }
    }

    // Default fallback
    return "USD";
  } catch (error) {
    console.warn(
      `Error normalizing currency code: ${currency}, falling back to USD`,
      error,
    );
    return "USD";
  }
}
