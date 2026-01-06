import { z } from "zod";

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
  "<$1M",
  "$1M-$10M",
  "$10M-$50M",
  "$50M-$100M",
  "$100M+",
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

/**
 * Schema for LLM extraction.
 * CRITICAL: Each field must be verified to be about the SPECIFIC company domain.
 * Return null if there's any doubt about which company the data refers to.
 */
export const customerEnrichmentSchema = z.object({
  description: z
    .string()
    .nullable()
    .describe(
      "Description from the company's own website ONLY. Return null if not from their site.",
    ),

  industry: z
    .enum(industryOptions)
    .nullable()
    .describe("Primary industry if obvious from their website. Return null if unsure."),

  companyType: z
    .enum(companyTypeOptions)
    .nullable()
    .describe("Business model if obvious from their website. Return null if unsure."),

  employeeCount: z
    .enum(employeeCountOptions)
    .nullable()
    .describe("Only from their official LinkedIn page. Return null otherwise."),

  foundedYear: z
    .number()
    .int()
    .min(1800)
    .max(2030)
    .nullable()
    .describe("Only if on their website or LinkedIn. Return null if any doubt."),

  estimatedRevenue: z
    .enum(revenueOptions)
    .nullable()
    .describe("Return null - rarely disclosed publicly."),

  fundingStage: z
    .enum(fundingStageOptions)
    .nullable()
    .describe("Only if verified for THIS specific company. Return null if any doubt."),

  totalFunding: z
    .string()
    .nullable()
    .describe("Only if verified for THIS specific company. Return null if any doubt."),

  headquartersLocation: z
    .string()
    .nullable()
    .describe("Only from their own website or LinkedIn. Return null otherwise."),

  timezone: z
    .string()
    .nullable()
    .describe("Only if HQ is verified. Return null if HQ is null."),

  linkedinUrl: z
    .string()
    .url()
    .nullable()
    .describe("Official company LinkedIn that links to their domain. Return null if not verified."),

  twitterUrl: z
    .string()
    .url()
    .nullable()
    .describe("Official company Twitter that links to their domain. Return null if not verified."),
});

export type CustomerEnrichmentResult = z.infer<typeof customerEnrichmentSchema>;

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
  timezone: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
};
