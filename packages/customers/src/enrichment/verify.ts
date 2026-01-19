import {
  type CustomerEnrichmentResult,
  type VerifiedEnrichmentData,
  companyTypeOptions,
  employeeCountOptions,
  fundingStageOptions,
  industryOptions,
  revenueOptions,
} from "./schema";

export type VerifyOptions = {
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
};

/**
 * Verify LinkedIn URL format.
 * Must be linkedin.com/company/* format.
 * NOTE: We only verify format, not existence - LinkedIn blocks automated requests.
 */
export function verifyLinkedInUrl(url: string | null): string | null {
  if (!url) return null;

  // Normalize URL
  let normalizedUrl = url.trim();

  // Add https if missing
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Check format: must be linkedin.com/company/
  const match = normalizedUrl.match(
    /^https?:\/\/(www\.)?linkedin\.com\/company\/[\w-]+\/?$/i,
  );

  if (!match) {
    console.log("[verifyLinkedInUrl] Invalid format:", url);
    return null;
  }

  // Remove trailing slash and normalize to www
  normalizedUrl = normalizedUrl.replace(/\/$/, "");
  if (!normalizedUrl.includes("www.")) {
    normalizedUrl = normalizedUrl.replace("linkedin.com", "www.linkedin.com");
  }

  console.log("[verifyLinkedInUrl] Valid:", normalizedUrl);
  return normalizedUrl;
}

/**
 * Verify Twitter/X URL format.
 * Must be twitter.com/* or x.com/* format.
 * NOTE: We only verify format, not existence.
 */
export function verifyTwitterUrl(url: string | null): string | null {
  if (!url) return null;

  // Normalize URL
  let normalizedUrl = url.trim();

  // Add https if missing
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Check format: must be twitter.com or x.com with a handle
  const match = normalizedUrl.match(
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]+\/?$/i,
  );

  if (!match) {
    console.log("[verifyTwitterUrl] Invalid format:", url);
    return null;
  }

  // Remove trailing slash for consistency
  normalizedUrl = normalizedUrl.replace(/\/$/, "");

  // Normalize to x.com (Twitter's current domain)
  normalizedUrl = normalizedUrl
    .replace("www.twitter.com", "x.com")
    .replace("twitter.com", "x.com")
    .replace("www.x.com", "x.com");

  console.log("[verifyTwitterUrl] Valid:", normalizedUrl);
  return normalizedUrl;
}

/**
 * Verify Instagram URL format.
 * Must be instagram.com/* format.
 * NOTE: We only verify format, not existence.
 */
export function verifyInstagramUrl(url: string | null): string | null {
  if (!url) return null;

  // Normalize URL
  let normalizedUrl = url.trim();

  // Add https if missing
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Check format: must be instagram.com with a handle
  const match = normalizedUrl.match(
    /^https?:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/i,
  );

  if (!match) {
    console.log("[verifyInstagramUrl] Invalid format:", url);
    return null;
  }

  // Remove trailing slash and normalize to www
  normalizedUrl = normalizedUrl.replace(/\/$/, "");
  if (!normalizedUrl.includes("www.")) {
    normalizedUrl = normalizedUrl.replace("instagram.com", "www.instagram.com");
  }

  console.log("[verifyInstagramUrl] Valid:", normalizedUrl);
  return normalizedUrl;
}

/**
 * Verify Facebook URL format.
 * Must be facebook.com/* format.
 * NOTE: We only verify format, not existence.
 */
export function verifyFacebookUrl(url: string | null): string | null {
  if (!url) return null;

  // Normalize URL
  let normalizedUrl = url.trim();

  // Add https if missing
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Check format: must be facebook.com with a page/handle
  const match = normalizedUrl.match(
    /^https?:\/\/(www\.)?facebook\.com\/[\w.]+\/?$/i,
  );

  if (!match) {
    console.log("[verifyFacebookUrl] Invalid format:", url);
    return null;
  }

  // Remove trailing slash and normalize to www
  normalizedUrl = normalizedUrl.replace(/\/$/, "");
  if (!normalizedUrl.includes("www.")) {
    normalizedUrl = normalizedUrl.replace("facebook.com", "www.facebook.com");
  }

  console.log("[verifyFacebookUrl] Valid:", normalizedUrl);
  return normalizedUrl;
}

/**
 * Validate founded year is within reasonable range.
 */
export function validateFoundedYear(year: number | null): number | null {
  if (year === null || year === undefined) return null;

  const currentYear = new Date().getFullYear();
  if (year >= 1800 && year <= currentYear) {
    return year;
  }
  return null;
}

/**
 * Validate timezone is a valid IANA timezone.
 */
export function validateTimezone(timezone: string | null): string | null {
  if (!timezone) return null;

  try {
    // This will throw if timezone is invalid
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    return null;
  }
}

/**
 * Validate that a value is one of the allowed enum options.
 */
export function validateEnum<T extends string>(
  value: T | null,
  options: readonly T[],
): T | null {
  if (!value) return null;
  return options.includes(value) ? value : null;
}

/**
 * Validate description is reasonable (not empty, not too short).
 */
export function validateDescription(description: string | null): string | null {
  if (!description) return null;

  // Trim and check minimum length
  const trimmed = description.trim();
  if (trimmed.length < 10) return null; // Too short to be useful

  return trimmed;
}

/**
 * Clean and format funding amount to whole numbers.
 * Converts "kr3.97M" → "$4M", "$2.5M" → "$3M", etc.
 * Returns null if fundingStage is "Bootstrapped" (bootstrapped = no external funding).
 */
export function validateTotalFunding(
  totalFunding: string | null,
  fundingStage: string | null,
): string | null {
  // Bootstrapped companies have no external funding
  if (fundingStage === "Bootstrapped") {
    return null;
  }

  if (!totalFunding) return null;

  const trimmed = totalFunding.trim();
  if (!trimmed) return null;

  // Extract numeric value and suffix (M, B, K)
  // Matches patterns like: $10M, €2.5M, kr3.97M, 10M, $1.2B
  const match = trimmed.match(/^([^0-9]*)(\d+(?:\.\d+)?)\s*(K|M|B|k|m|b)?$/i);

  if (!match) {
    // If can't parse, return as-is but trimmed
    return trimmed;
  }

  const [, prefix, numStr, suffix] = match;
  if (!numStr) return trimmed;

  const num = Number.parseFloat(numStr);
  if (Number.isNaN(num)) return trimmed;

  // Round to nearest whole number
  const rounded = Math.round(num);

  // Reconstruct the amount
  const normalizedSuffix = (suffix || "").toUpperCase();
  const currencyPrefix = prefix || "$"; // Default to $ if no prefix

  return `${currencyPrefix}${rounded}${normalizedSuffix}`;
}

/**
 * Verify and validate all enrichment data.
 * - Social URLs are validated for correct format (no HTTP verification - social networks block automated requests)
 * - Data fields are validated against allowed values
 * Returns only the verified/validated data.
 */
export async function verifyEnrichmentData(
  rawData: CustomerEnrichmentResult,
  options?: VerifyOptions,
): Promise<VerifiedEnrichmentData> {
  // Check if already aborted
  if (options?.signal?.aborted) {
    throw new Error("Verification cancelled");
  }

  // Verify URL formats (synchronous, no HTTP requests)
  const linkedinUrl = verifyLinkedInUrl(rawData.linkedinUrl);
  const twitterUrl = verifyTwitterUrl(rawData.twitterUrl);
  const instagramUrl = verifyInstagramUrl(rawData.instagramUrl);
  const facebookUrl = verifyFacebookUrl(rawData.facebookUrl);

  // Validate funding stage first (needed for totalFunding validation)
  const fundingStage = validateEnum(rawData.fundingStage, fundingStageOptions);

  // Validate all other fields synchronously
  return {
    description: validateDescription(rawData.description),
    industry: validateEnum(rawData.industry, industryOptions),
    companyType: validateEnum(rawData.companyType, companyTypeOptions),
    employeeCount: validateEnum(rawData.employeeCount, employeeCountOptions),
    foundedYear: validateFoundedYear(rawData.foundedYear),
    estimatedRevenue: validateEnum(rawData.estimatedRevenue, revenueOptions),
    fundingStage,
    totalFunding: validateTotalFunding(rawData.totalFunding, fundingStage),
    headquartersLocation: rawData.headquartersLocation?.trim() || null,
    addressLine1: rawData.addressLine1?.trim() || null,
    city: rawData.city?.trim() || null,
    state: rawData.state?.trim() || null,
    zipCode: rawData.zipCode?.trim() || null,
    country: rawData.country?.trim() || null,
    timezone: validateTimezone(rawData.timezone),
    linkedinUrl,
    twitterUrl,
    instagramUrl,
    facebookUrl,
    ceoName: rawData.ceoName?.trim() || null,
    financeContact: rawData.financeContact?.trim() || null,
    financeContactEmail:
      rawData.financeContactEmail?.trim()?.toLowerCase() || null,
    primaryLanguage: rawData.primaryLanguage?.trim() || null,
    fiscalYearEnd: rawData.fiscalYearEnd?.trim() || null,
    vatNumber: rawData.vatNumber?.trim()?.toUpperCase() || null,
  };
}
