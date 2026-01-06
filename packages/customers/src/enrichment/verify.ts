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
 * Verify LinkedIn URL format.
 * Must be linkedin.com/company/* format.
 * NOTE: We only verify format, not existence - LinkedIn blocks HEAD requests.
 */
export async function verifyLinkedInUrl(
  url: string | null,
  _options?: VerifyOptions,
): Promise<string | null> {
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

  // Remove trailing slash for consistency
  normalizedUrl = normalizedUrl.replace(/\/$/, "");

  console.log("[verifyLinkedInUrl] Valid:", normalizedUrl);
  return normalizedUrl;
}

/**
 * Verify Twitter/X URL format.
 * Must be twitter.com/* or x.com/* format.
 * NOTE: We only verify format, not existence.
 */
export async function verifyTwitterUrl(
  url: string | null,
  _options?: VerifyOptions,
): Promise<string | null> {
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

  console.log("[verifyTwitterUrl] Valid:", normalizedUrl);
  return normalizedUrl;
}

/**
 * Verify Instagram URL format.
 * Must be instagram.com/* format.
 */
export async function verifyInstagramUrl(
  url: string | null,
  _options?: VerifyOptions,
): Promise<string | null> {
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

  // Remove trailing slash for consistency
  normalizedUrl = normalizedUrl.replace(/\/$/, "");

  console.log("[verifyInstagramUrl] Valid:", normalizedUrl);
  return normalizedUrl;
}

/**
 * Verify Facebook URL format.
 * Must be facebook.com/* format.
 */
export async function verifyFacebookUrl(
  url: string | null,
  _options?: VerifyOptions,
): Promise<string | null> {
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

  // Remove trailing slash for consistency
  normalizedUrl = normalizedUrl.replace(/\/$/, "");

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
  const [linkedinUrl, twitterUrl, instagramUrl, facebookUrl] =
    await Promise.all([
      verifyLinkedInUrl(rawData.linkedinUrl, options),
      verifyTwitterUrl(rawData.twitterUrl, options),
      verifyInstagramUrl(rawData.instagramUrl, options),
      verifyFacebookUrl(rawData.facebookUrl, options),
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
    instagramUrl,
    facebookUrl,
  };
}
