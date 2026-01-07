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

// Tools (for direct use or custom pipelines)
export {
  readWebsiteTool,
  searchCompanyTool,
  extractDataTool,
  executeReadWebsite,
  executeSearchCompany,
  executeExtractData,
  type ReadWebsiteInput,
  type SearchCompanyInput,
  type ExtractDataInput,
  type ReadWebsiteResult,
  type SearchCompanyResult,
  type ExtractDataResult,
} from "./tools";

// Country detection
export { buildRegistrySearchHint, detectCountryCode } from "./registries";
