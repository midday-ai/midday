// Main enrichment function
export { enrichCustomer } from "./enrich";

// Schema, types, and options
export {
  customerEnrichmentSchema,
  industryOptions,
  companyTypeOptions,
  employeeCountOptions,
  revenueOptions,
  fundingStageOptions,
  type CustomerEnrichmentResult,
  type VerifiedEnrichmentData,
  type EnrichCustomerParams,
  type EnrichCustomerOptions,
  type EnrichCustomerResult,
  type EnrichmentMetrics,
} from "./schema";

// Verification utilities
export {
  verifyEnrichmentData,
  verifyLinkedInUrl,
  verifyTwitterUrl,
  validateFoundedYear,
  validateTimezone,
  validateEnum,
  validateDescription,
  validateTotalFunding,
  type VerifyOptions,
} from "./verify";

// Helper utilities
export {
  extractDomain,
  normalizeUrl,
  detectCountryCode,
  extractLinkedInUrl,
  extractTwitterUrl,
  extractInstagramUrl,
  extractFacebookUrl,
  isValidVatNumber,
  isLinkedInCompanyUrl,
  hasLinkedIn,
  getRegistryHint,
  getCompanySuffix,
  type ExaSearchResult,
} from "./tools";
