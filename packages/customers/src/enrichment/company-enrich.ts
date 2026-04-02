import { createLoggerWithContext } from "@midday/logger";
import type {
  CustomerEnrichmentResult,
  companyTypeOptions,
  employeeCountOptions,
  fundingStageOptions,
  industryOptions,
  revenueOptions,
} from "./schema";

const logger = createLoggerWithContext("CompanyEnrich");

const COMPANY_ENRICH_URL = "https://api.companyenrich.com/companies/enrich";

// ============================================================================
// API Client
// ============================================================================

type CompanyEnrichResponse = {
  id: string;
  name: string | null;
  domain: string | null;
  website: string | null;
  type: string | null;
  industry: string | null;
  industries: string[] | null;
  categories: string[] | null;
  employees: string | null;
  revenue: string | null;
  description: string | null;
  founded_year: number | null;
  location: {
    country: { code: string; name: string } | null;
    state: { name: string; code: string } | null;
    city: { name: string } | null;
    address: string | null;
    postal_code: string | null;
    phone: string | null;
  } | null;
  financial: {
    total_funding: number | null;
    funding_stage: string | null;
  } | null;
  socials: {
    linkedin_url: string | null;
    twitter_url: string | null;
    facebook_url: string | null;
    instagram_url: string | null;
  } | null;
  logo_url: string | null;
};

export type LookupResult = {
  data: CompanyEnrichResponse;
  matchedByDomain: boolean;
};

/**
 * Look up a company, trying domain-first (deterministic) then name (best-match).
 * Domain lookup is the preferred method per CompanyEnrich docs — each domain maps
 * to a unique company, so there's zero ambiguity.
 */
export async function lookupCompany(
  name: string,
  domain: string | null,
  options?: { signal?: AbortSignal },
): Promise<LookupResult | null> {
  const apiKey = process.env.COMPANY_ENRICH_API_KEY;
  if (!apiKey) {
    logger.warn("COMPANY_ENRICH_API_KEY not set, skipping enrichment");
    return null;
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Step 1: Try domain lookup (fast, reliable, no ambiguity)
  if (domain) {
    const url = `${COMPANY_ENRICH_URL}?domain=${encodeURIComponent(domain)}`;
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: options?.signal,
    });

    if (res.ok) {
      const data = (await res.json()) as CompanyEnrichResponse;
      logger.debug("Domain lookup succeeded", { domain });
      return { data, matchedByDomain: true };
    }

    if (res.status !== 404) {
      logger.error("CompanyEnrich domain lookup error", {
        status: res.status,
        domain,
      });
    } else {
      logger.debug("Domain not found, falling back to name lookup", { domain });
    }
  }

  // Step 2: Fall back to name-based lookup (best-match, may be ambiguous)
  const res = await fetch(COMPANY_ENRICH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ Name: name }),
    signal: options?.signal,
  });

  if (res.status === 404) {
    logger.debug("Company not found in CompanyEnrich", { name });
    return null;
  }

  if (!res.ok) {
    logger.error("CompanyEnrich name lookup error", {
      status: res.status,
      name,
    });
    return null;
  }

  const data = (await res.json()) as CompanyEnrichResponse;
  return { data, matchedByDomain: false };
}

// ============================================================================
// Response Mapper
// ============================================================================

export function mapToSchema(
  res: CompanyEnrichResponse,
): CustomerEnrichmentResult {
  const countryCode = res.location?.country?.code ?? null;
  const cityName = res.location?.city?.name ?? null;
  const countryName = res.location?.country?.name ?? null;

  return {
    description: res.description?.trim() || null,
    industry: mapIndustry(res.industry),
    companyType: mapCompanyType(res.categories),
    employeeCount: mapEmployeeCount(res.employees),
    foundedYear: res.founded_year ?? null,
    estimatedRevenue: mapRevenue(res.revenue),
    fundingStage: mapFundingStage(res.financial?.funding_stage ?? null),
    totalFunding: formatFunding(res.financial?.total_funding ?? null),
    headquartersLocation:
      cityName && countryName ? `${cityName}, ${countryName}` : null,
    addressLine1: res.location?.address?.trim() || null,
    city: cityName,
    state: res.location?.state?.name ?? null,
    zipCode: res.location?.postal_code?.trim() || null,
    country: countryName,
    timezone: deriveTimezone(countryCode),
    linkedinUrl: res.socials?.linkedin_url || null,
    twitterUrl: res.socials?.twitter_url || null,
    instagramUrl: res.socials?.instagram_url || null,
    facebookUrl: res.socials?.facebook_url || null,
    ceoName: null,
    financeContact: null,
    financeContactEmail: null,
    primaryLanguage: deriveLanguage(countryCode),
    fiscalYearEnd: null,
    vatNumber: null,
  };
}

// ============================================================================
// Field Mappers
// ============================================================================

const INDUSTRY_MAP: Record<string, (typeof industryOptions)[number]> = {
  software: "Software",
  "media & internet": "Media",
  media: "Media",
  finance: "Finance",
  healthcare: "Healthcare",
  "health care": "Healthcare",
  education: "Education",
  "real estate": "Real Estate",
  manufacturing: "Manufacturing",
  retail: "Retail",
  hospitality: "Hospitality",
  energy: "Energy",
  "business services": "Consulting",
  legal: "Legal",
  logistics: "Logistics",
  transportation: "Logistics",
  "consumer goods": "E-commerce",
};

function mapIndustry(
  industry: string | null,
): (typeof industryOptions)[number] | null {
  if (!industry) return null;
  const lower = industry.toLowerCase();
  if (INDUSTRY_MAP[lower]) return INDUSTRY_MAP[lower];
  for (const [key, value] of Object.entries(INDUSTRY_MAP)) {
    if (lower.includes(key)) return value;
  }
  return "Other";
}

const COMPANY_TYPE_MAP: Record<string, (typeof companyTypeOptions)[number]> = {
  saas: "SaaS",
  b2b: "B2B",
  b2c: "B2C",
  "e-commerce": "E-commerce",
  marketplace: "Marketplace",
  "service-provider": "Agency",
  mobile: "Other",
  media: "Other",
  b2g: "B2B",
};

function mapCompanyType(
  categories: string[] | null,
): (typeof companyTypeOptions)[number] | null {
  if (!categories?.length) return null;
  for (const cat of categories) {
    const mapped = COMPANY_TYPE_MAP[cat.toLowerCase()];
    if (mapped) return mapped;
  }
  return null;
}

const EMPLOYEE_MAP: Record<string, (typeof employeeCountOptions)[number]> = {
  "1-10": "1-10",
  "11-50": "11-50",
  "51-200": "51-200",
  "201-500": "201-500",
  "501-1k": "501-1000",
  "501-1K": "501-1000",
  "1k-5k": "1000+",
  "1K-5K": "1000+",
  "5k-10k": "1000+",
  "5K-10K": "1000+",
  "over-10k": "1000+",
  "over-10K": "1000+",
};

function mapEmployeeCount(
  range: string | null,
): (typeof employeeCountOptions)[number] | null {
  if (!range) return null;
  return EMPLOYEE_MAP[range] ?? EMPLOYEE_MAP[range.toLowerCase()] ?? null;
}

const REVENUE_MAP: Record<string, (typeof revenueOptions)[number]> = {
  "under-1m": "<1M",
  "1m-10m": "1M-10M",
  "10m-50m": "10M-50M",
  "50m-100m": "50M-100M",
  "100m-200m": "100M+",
  "200m-1b": "100M+",
  "over-1b": "100M+",
};

function mapRevenue(
  revenue: string | null,
): (typeof revenueOptions)[number] | null {
  if (!revenue) return null;
  return REVENUE_MAP[revenue.toLowerCase()] ?? null;
}

const FUNDING_STAGE_MAP: Record<string, (typeof fundingStageOptions)[number]> =
  {
    pre_seed: "Pre-seed",
    seed: "Seed",
    series_a: "Series A",
    series_b: "Series B",
    series_c: "Series C+",
    series_d: "Series C+",
    series_e: "Series C+",
    ipo: "Public",
    grant: "Bootstrapped",
  };

function mapFundingStage(
  stage: string | null,
): (typeof fundingStageOptions)[number] | null {
  if (!stage) return null;
  return FUNDING_STAGE_MAP[stage.toLowerCase()] ?? null;
}

function formatFunding(amount: number | null): string | null {
  if (!amount || amount <= 0) return null;
  if (amount >= 1_000_000_000) return `$${Math.round(amount / 1_000_000_000)}B`;
  if (amount >= 1_000_000) return `$${Math.round(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

// ============================================================================
// Country Derivations
// ============================================================================

const COUNTRY_TIMEZONE: Record<string, string> = {
  SE: "Europe/Stockholm",
  NO: "Europe/Oslo",
  DK: "Europe/Copenhagen",
  FI: "Europe/Helsinki",
  GB: "Europe/London",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  NL: "Europe/Amsterdam",
  ES: "Europe/Madrid",
  IT: "Europe/Rome",
  AT: "Europe/Vienna",
  CH: "Europe/Zurich",
  BE: "Europe/Brussels",
  IE: "Europe/Dublin",
  PT: "Europe/Lisbon",
  PL: "Europe/Warsaw",
  CZ: "Europe/Prague",
  RO: "Europe/Bucharest",
  US: "America/New_York",
  CA: "America/Toronto",
  BR: "America/Sao_Paulo",
  MX: "America/Mexico_City",
  JP: "Asia/Tokyo",
  KR: "Asia/Seoul",
  CN: "Asia/Shanghai",
  IN: "Asia/Kolkata",
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
  SG: "Asia/Singapore",
  IL: "Asia/Jerusalem",
  AE: "Asia/Dubai",
  EE: "Europe/Tallinn",
  LV: "Europe/Riga",
  LT: "Europe/Vilnius",
};

export function deriveTimezone(countryCode: string | null): string | null {
  if (!countryCode) return null;
  return COUNTRY_TIMEZONE[countryCode.toUpperCase()] ?? null;
}

const COUNTRY_LANGUAGE: Record<string, string> = {
  SE: "Swedish",
  NO: "Norwegian",
  DK: "Danish",
  FI: "Finnish",
  GB: "English",
  US: "English",
  CA: "English",
  AU: "English",
  NZ: "English",
  IE: "English",
  DE: "German",
  AT: "German",
  CH: "German",
  FR: "French",
  BE: "French",
  NL: "Dutch",
  ES: "Spanish",
  MX: "Spanish",
  IT: "Italian",
  PT: "Portuguese",
  BR: "Portuguese",
  PL: "Polish",
  CZ: "Czech",
  RO: "Romanian",
  JP: "Japanese",
  KR: "Korean",
  CN: "Chinese",
  IN: "English",
  SG: "English",
  IL: "Hebrew",
  AE: "Arabic",
  EE: "Estonian",
  LV: "Latvian",
  LT: "Lithuanian",
};

export function deriveLanguage(countryCode: string | null): string | null {
  if (!countryCode) return null;
  return COUNTRY_LANGUAGE[countryCode.toUpperCase()] ?? null;
}
