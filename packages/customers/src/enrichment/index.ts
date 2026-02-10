// Main enrichment function
export { enrichCustomer } from "./enrich";

// Schema, types, and options
export {
  type CustomerEnrichmentResult,
  companyTypeOptions,
  customerEnrichmentSchema,
  type EnrichCustomerOptions,
  type EnrichCustomerParams,
  type EnrichCustomerResult,
  type EnrichmentMetrics,
  employeeCountOptions,
  fundingStageOptions,
  industryOptions,
  revenueOptions,
  type VerifiedEnrichmentData,
} from "./schema";
// Helper utilities
export {
  detectCountryCode,
  type ExaSearchResult,
  extractDomain,
  extractFacebookUrl,
  extractInstagramUrl,
  extractLinkedInUrl,
  extractTwitterUrl,
  getCompanySuffix,
  getRegistryHint,
  hasLinkedIn,
  isLinkedInCompanyUrl,
  isValidVatNumber,
  normalizeUrl,
} from "./tools";
// Verification utilities
export {
  type VerifyOptions,
  validateDescription,
  validateEnum,
  validateFoundedYear,
  validateTimezone,
  validateTotalFunding,
  verifyEnrichmentData,
  verifyLinkedInUrl,
  verifyTwitterUrl,
} from "./verify";
