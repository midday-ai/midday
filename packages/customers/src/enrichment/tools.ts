/**
 * Helper utilities for customer enrichment.
 * The main search logic is now handled by the agent in enrich.ts
 */

// ============================================================================
// Types
// ============================================================================

export type ExaSearchResult = {
  results: Array<{
    title: string;
    url: string;
    text?: string;
    summary?: string;
    highlights?: string[];
    publishedDate?: string;
  }>;
  costDollars?: {
    total: number;
  };
};

// ============================================================================
// URL Helpers
// ============================================================================

/**
 * Extract domain from a URL or website string.
 */
export function extractDomain(website: string): string {
  return website
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

/**
 * Normalize a URL to ensure it has https:// prefix.
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/**
 * Extract LinkedIn URL from text or results.
 */
export function extractLinkedInUrl(text: string): string | null {
  const match = text.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/[\w-]+/i,
  );
  return match ? normalizeUrl(match[0]) : null;
}

/**
 * Extract Twitter/X URL from text.
 */
export function extractTwitterUrl(text: string): string | null {
  const match = text.match(
    /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[\w-]+/i,
  );
  return match ? normalizeUrl(match[0]) : null;
}

/**
 * Extract Instagram URL from text.
 */
export function extractInstagramUrl(text: string): string | null {
  const match = text.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[\w.-]+/i,
  );
  return match ? normalizeUrl(match[0]) : null;
}

/**
 * Extract Facebook URL from text.
 */
export function extractFacebookUrl(text: string): string | null {
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w.-]+/i);
  return match ? normalizeUrl(match[0]) : null;
}

// ============================================================================
// Country Detection
// ============================================================================

/**
 * Detect country code from various sources.
 */
export function detectCountryCode(params: {
  countryCode?: string | null;
  vatNumber?: string | null;
  website?: string | null;
}): string | null {
  // Explicit country code
  if (params.countryCode) {
    return params.countryCode.toUpperCase();
  }

  // From VAT number prefix (EU format: XX followed by numbers)
  if (params.vatNumber) {
    const match = params.vatNumber.match(/^([A-Z]{2})/i);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  // From website TLD
  if (params.website) {
    const domain = extractDomain(params.website);
    const tldMatch = domain.match(/\.([a-z]{2})$/i);
    if (tldMatch?.[1]) {
      const tld = tldMatch[1].toUpperCase();
      const tldToCountry: Record<string, string> = {
        SE: "SE",
        NO: "NO",
        DK: "DK",
        FI: "FI",
        UK: "GB",
        DE: "DE",
        FR: "FR",
        NL: "NL",
        ES: "ES",
        IT: "IT",
        AT: "AT",
        CH: "CH",
        BE: "BE",
      };
      if (tldToCountry[tld]) {
        return tldToCountry[tld];
      }
    }
  }

  return null;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a string looks like a valid VAT number.
 */
export function isValidVatNumber(vat: string | null | undefined): boolean {
  if (!vat) return false;
  // Basic pattern: 2-letter country code + numbers/letters
  return /^[A-Z]{2}[\dA-Z]{8,12}$/i.test(vat.replace(/[\s-]/g, ""));
}

/**
 * Check if a URL looks like a LinkedIn company page.
 */
export function isLinkedInCompanyUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /linkedin\.com\/company\//i.test(url);
}

/**
 * Check if text contains a LinkedIn reference.
 */
export function hasLinkedIn(text: string): boolean {
  return /linkedin\.com/i.test(text);
}

// ============================================================================
// Business Registry Info
// ============================================================================

/**
 * Get registry search hints for a country.
 */
export function getRegistryHint(countryCode: string | null): string | null {
  if (!countryCode) return null;

  const hints: Record<string, string> = {
    SE: "allabolag.se, proff.se",
    NO: "proff.no, brreg.no",
    DK: "cvr.dk, proff.dk",
    FI: "ytj.fi, finder.fi",
    GB: "companieshouse.gov.uk",
    DE: "northdata.com, handelsregister.de",
    NL: "kvk.nl",
    FR: "societe.com, pappers.fr",
    ES: "einforma.com",
    IT: "registroimprese.it",
    CH: "zefix.ch",
    BE: "kbo-bce.be",
    US: "opencorporates.com, sec.gov",
  };

  return hints[countryCode.toUpperCase()] || null;
}

/**
 * Get common company suffixes for a country.
 */
export function getCompanySuffix(countryCode: string | null): string | null {
  if (!countryCode) return null;

  const suffixes: Record<string, string> = {
    SE: "AB",
    NO: "AS",
    DK: "ApS",
    FI: "Oy",
    GB: "Ltd",
    DE: "GmbH",
    NL: "B.V.",
    FR: "SAS",
    US: "Inc",
  };

  return suffixes[countryCode.toUpperCase()] || null;
}
