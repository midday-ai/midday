import { z } from "zod";

// ============================================================================
// Predefined Options
// ============================================================================

// Predefined options for structured fields (helps LLM accuracy)
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
// Zod Schema for Structured Extraction
// ============================================================================

/**
 * Schema for LLM extraction using Zod.
 * Used with AI SDK's generateObject for structured output.
 */
export const customerEnrichmentSchema = z.object({
  description: z
    .string()
    .nullable()
    .describe(
      "1-2 sentence description of what the company does. Extract from their website or summarize based on their products/services.",
    ),

  industry: z
    .enum(industryOptions)
    .nullable()
    .describe("Primary industry based on what the company does."),

  companyType: z
    .enum(companyTypeOptions)
    .nullable()
    .describe("Business model - B2B, SaaS, Agency, etc."),

  employeeCount: z
    .enum(employeeCountOptions)
    .nullable()
    .describe("Employee count range from LinkedIn or website."),

  foundedYear: z
    .number()
    .int()
    .min(1800)
    .max(2030)
    .nullable()
    .describe("Year the company was founded."),

  estimatedRevenue: z
    .enum(revenueOptions)
    .nullable()
    .describe("Estimated revenue if publicly available."),

  fundingStage: z
    .enum(fundingStageOptions)
    .nullable()
    .describe("Funding stage if known."),

  totalFunding: z
    .string()
    .nullable()
    .describe("Total funding raised if known (e.g. '$10M')."),

  headquartersLocation: z
    .string()
    .nullable()
    .describe("City and country of headquarters (e.g. 'Stockholm, Sweden')."),

  addressLine1: z
    .string()
    .nullable()
    .describe(
      "Street address of the company headquarters (e.g. '123 Main Street'). Found on contact pages or business registries.",
    ),

  city: z
    .string()
    .nullable()
    .describe(
      "City where the company is headquartered (e.g. 'Stockholm', 'New York').",
    ),

  state: z
    .string()
    .nullable()
    .describe(
      "State, province, or region (e.g. 'California', 'Stockholm County'). May not apply to all countries.",
    ),

  zipCode: z
    .string()
    .nullable()
    .describe("Postal/ZIP code (e.g. '11120', '94105')."),

  country: z
    .string()
    .nullable()
    .describe("Country name (e.g. 'Sweden', 'United States', 'Germany')."),

  timezone: z
    .string()
    .nullable()
    .describe("IANA timezone based on HQ location (e.g. 'Europe/Stockholm')."),

  linkedinUrl: z
    .string()
    .nullable()
    .describe(
      "LinkedIn company page URL (e.g. 'https://linkedin.com/company/example'). Include https:// prefix.",
    ),

  twitterUrl: z
    .string()
    .nullable()
    .describe(
      "Twitter/X company URL (e.g. 'https://twitter.com/example'). Include https:// prefix.",
    ),

  instagramUrl: z
    .string()
    .nullable()
    .describe(
      "Instagram company URL (e.g. 'https://instagram.com/example'). Include https:// prefix.",
    ),

  facebookUrl: z
    .string()
    .nullable()
    .describe(
      "Facebook company page URL (e.g. 'https://facebook.com/example'). Include https:// prefix.",
    ),

  ceoName: z
    .string()
    .nullable()
    .describe(
      "Name of the CEO, founder, or primary executive. Look for this on About/Team pages or LinkedIn.",
    ),

  financeContact: z
    .string()
    .nullable()
    .describe(
      "Name of the finance, accounting, or accounts payable contact. Look on Contact or Team pages.",
    ),

  financeContactEmail: z
    .string()
    .nullable()
    .describe(
      "Email address for the finance, accounting, or accounts payable department. Look for finance@, accounting@, ap@, invoices@ on Contact pages.",
    ),

  primaryLanguage: z
    .string()
    .nullable()
    .describe(
      "Primary business language as full name (e.g. 'English', 'Swedish', 'German', 'French', 'Spanish', 'Dutch', 'Danish', 'Norwegian', 'Finnish', 'Japanese', 'Chinese'). Infer from website content or country.",
    ),

  fiscalYearEnd: z
    .string()
    .nullable()
    .describe(
      "Fiscal year end month (e.g. 'December', 'March', 'June'). Found in annual reports or registry filings.",
    ),

  vatNumber: z
    .string()
    .nullable()
    .describe(
      "VAT number, tax ID, or organization number (e.g. 'SE556703748501', 'GB123456789'). Found on business registries, invoices, or website footer/legal pages.",
    ),
});

export type CustomerEnrichmentResult = z.infer<typeof customerEnrichmentSchema>;

// ============================================================================
// Types
// ============================================================================

/**
 * Type for verified/validated enrichment data that will be saved to DB.
 * This is the output after URL verification and data validation.
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

/**
 * Input parameters for customer enrichment
 */
export type EnrichCustomerParams = {
  website: string;
  companyName: string;
  email?: string | null;
  country?: string | null;
  countryCode?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  phone?: string | null;
  vatNumber?: string | null;
  note?: string | null;
  contactName?: string | null;
};

/**
 * Options for enrichment execution
 */
export type EnrichCustomerOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

/**
 * Metrics collected during enrichment
 */
export type EnrichmentMetrics = {
  stepsUsed: number;
  websiteReadSuccess: boolean;
  linkedinFound: boolean;
  searchSuccess: boolean;
  countryDetected: string | null;
  durationMs: number;
};

/**
 * Complete result from enrichment
 */
export type EnrichCustomerResult = {
  raw: CustomerEnrichmentResult;
  verified: VerifiedEnrichmentData;
  verifiedFieldCount: number;
  metrics: EnrichmentMetrics;
};
