// ============================================================================
// Predefined Options
// ============================================================================

export const industryOptions = [
  "Software",
  "Healthcare",
  "Finance",
  "E-commerce",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Media",
  "Consulting",
  "Legal",
  "Marketing",
  "Logistics",
  "Energy",
  "Hospitality",
  "Retail",
  "Other",
] as const;

export const companyTypeOptions = [
  "B2B",
  "B2C",
  "B2B2C",
  "SaaS",
  "Agency",
  "Consultancy",
  "E-commerce",
  "Marketplace",
  "Enterprise",
  "SMB",
  "Startup",
  "Other",
] as const;

export const employeeCountOptions = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;

export const revenueOptions = [
  "<1M",
  "1M-10M",
  "10M-50M",
  "50M-100M",
  "100M+",
] as const;

export const fundingStageOptions = [
  "Bootstrapped",
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Public",
  "Acquired",
] as const;

// ============================================================================
// Types
// ============================================================================

export type CustomerEnrichmentResult = {
  description: string | null;
  industry: (typeof industryOptions)[number] | null;
  companyType: (typeof companyTypeOptions)[number] | null;
  employeeCount: (typeof employeeCountOptions)[number] | null;
  foundedYear: number | null;
  estimatedRevenue: (typeof revenueOptions)[number] | null;
  fundingStage: (typeof fundingStageOptions)[number] | null;
  totalFunding: string | null;
  headquartersLocation: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  timezone: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  ceoName: string | null;
  financeContact: string | null;
  financeContactEmail: string | null;
  primaryLanguage: string | null;
  fiscalYearEnd: string | null;
  vatNumber: string | null;
};

/**
 * Verified/validated enrichment data saved to DB.
 * Same shape as CustomerEnrichmentResult after URL verification and data validation.
 */
export type VerifiedEnrichmentData = {
  description: string | null;
  industry: (typeof industryOptions)[number] | null;
  companyType: (typeof companyTypeOptions)[number] | null;
  employeeCount: (typeof employeeCountOptions)[number] | null;
  foundedYear: number | null;
  estimatedRevenue: (typeof revenueOptions)[number] | null;
  fundingStage: (typeof fundingStageOptions)[number] | null;
  totalFunding: string | null;
  headquartersLocation: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  timezone: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  ceoName: string | null;
  financeContact: string | null;
  financeContactEmail: string | null;
  primaryLanguage: string | null;
  fiscalYearEnd: string | null;
  vatNumber: string | null;
};

export type EnrichCustomerParams = {
  companyName: string;
  website?: string | null;
  email?: string | null;
};

export type EnrichCustomerOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export type EnrichmentMetrics = {
  durationMs: number;
  source: string;
  /** true = verified match, false = mismatch (discarded), null = couldn't compare */
  domainMatch: boolean | null;
};

export type EnrichCustomerResult = {
  raw: CustomerEnrichmentResult;
  verified: VerifiedEnrichmentData;
  verifiedFieldCount: number;
  metrics: EnrichmentMetrics;
};
