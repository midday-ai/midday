/**
 * Country detection and search hint generation for merchant enrichment.
 *
 * We detect the company's country and provide hints to Google Search grounding
 * to find authoritative business registries (like Allabolag, Companies House, etc.)
 */

/**
 * Builds a search hint for the LLM to search country-specific business registries.
 * Google Search grounding understands country codes (SE, GB, etc.) naturally.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param companyName - The company name to search for
 * @returns Search guidance string for the LLM, or null if no country detected
 */
export function buildRegistrySearchHint(
  countryCode: string | null | undefined,
  companyName: string,
): string | null {
  if (!countryCode) return null;

  return `Search official business registries in ${countryCode.toUpperCase()} for "${companyName}". Look for founding year, employee count, revenue, and CEO/executive information.`;
}

/**
 * Detects country code from various sources.
 * Priority: countryCode param > VAT prefix > domain TLD
 *
 * @param params - Object containing potential country indicators
 * @returns ISO 3166-1 alpha-2 country code or null
 */
export function detectCountryCode(params: {
  countryCode?: string | null;
  vatNumber?: string | null;
  website?: string | null;
}): string | null {
  // Priority 1: Explicit country code
  if (params.countryCode) {
    return params.countryCode.toUpperCase();
  }

  // Priority 2: VAT number prefix (EU standard)
  if (params.vatNumber && params.vatNumber.length >= 2) {
    const vatPrefix = params.vatNumber.substring(0, 2).toUpperCase();
    // EU VAT prefixes map directly to country codes (except EL → GR, XI → GB)
    const vatExceptions: Record<string, string> = {
      EL: "GR",
      XI: "GB",
    };
    if (/^[A-Z]{2}$/.test(vatPrefix)) {
      return vatExceptions[vatPrefix] || vatPrefix;
    }
  }

  // Priority 3: Domain TLD
  if (params.website) {
    const domain = params.website
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
    const tld = domain?.split(".").pop()?.toLowerCase();

    // Common ccTLDs (country-code top-level domains)
    const tldExceptions: Record<string, string> = {
      uk: "GB",
    };

    if (tld && tld.length === 2 && /^[a-z]{2}$/.test(tld)) {
      return (tldExceptions[tld] || tld).toUpperCase();
    }
  }

  return null;
}
