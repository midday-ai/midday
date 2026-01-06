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
 * Verify that a URL exists by making a HEAD request.
 * Returns true if the URL responds with a 2xx status code.
 */
async function verifyUrlExists(
  url: string,
  options?: VerifyOptions,
): Promise<boolean> {
  try {
    // Create a timeout signal that can be combined with external signal
    const timeoutSignal = AbortSignal.timeout(5000);

    // Combine signals if external signal provided
    const signal = options?.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal;

    const response = await fetch(url, {
      method: "HEAD",
      signal,
      headers: {
        // Some sites block requests without a user agent
        "User-Agent":
          "Mozilla/5.0 (compatible; Midday/1.0; +https://midday.ai)",
      },
    });
    return response.ok; // 200-299
  } catch {
    return false;
  }
}

/**
 * Verify LinkedIn URL format and existence.
 * Must be linkedin.com/company/* format AND return 200.
 */
export async function verifyLinkedInUrl(
  url: string | null,
  options?: VerifyOptions,
): Promise<string | null> {
  if (!url) return null;

  // Check format: must be linkedin.com/company/
  if (!url.match(/^https?:\/\/(www\.)?linkedin\.com\/company\//i)) {
    return null;
  }

  // Verify URL actually exists
  const exists = await verifyUrlExists(url, options);
  return exists ? url : null;
}

/**
 * Verify Twitter/X URL format and existence.
 * Must be twitter.com/* or x.com/* format AND return 200.
 */
export async function verifyTwitterUrl(
  url: string | null,
  options?: VerifyOptions,
): Promise<string | null> {
  if (!url) return null;

  // Check format: must be twitter.com or x.com
  if (!url.match(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i)) {
    return null;
  }

  // Verify URL actually exists
  const exists = await verifyUrlExists(url, options);
  return exists ? url : null;
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
 * Verify and validate all enrichment data.
 * - URLs are verified via HTTP HEAD requests
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

  // Verify URLs in parallel (these are the slow operations)
  const [linkedinUrl, twitterUrl] = await Promise.all([
    verifyLinkedInUrl(rawData.linkedinUrl, options),
    verifyTwitterUrl(rawData.twitterUrl, options),
  ]);

  // Validate all other fields synchronously
  return {
    description: validateDescription(rawData.description),
    industry: validateEnum(rawData.industry, industryOptions),
    companyType: validateEnum(rawData.companyType, companyTypeOptions),
    employeeCount: validateEnum(rawData.employeeCount, employeeCountOptions),
    foundedYear: validateFoundedYear(rawData.foundedYear),
    estimatedRevenue: validateEnum(rawData.estimatedRevenue, revenueOptions),
    fundingStage: validateEnum(rawData.fundingStage, fundingStageOptions),
    totalFunding: rawData.totalFunding?.trim() || null,
    headquartersLocation: rawData.headquartersLocation?.trim() || null,
    timezone: validateTimezone(rawData.timezone),
    linkedinUrl,
    twitterUrl,
  };
}
