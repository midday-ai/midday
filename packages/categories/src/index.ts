// Types
export type {
  BaseCategory,
  ParentCategory,
  ChildCategory,
  CategoryHierarchy,
  TaxRateConfig,
} from "./types";

// Zod schemas for validation
export {
  baseCategorySchema,
  childCategorySchema,
  parentCategorySchema,
  categoryHierarchySchema,
  taxRateConfigSchema,
} from "./types";

// Main category definitions
export { CATEGORIES } from "./categories";

// Tax rate configurations
export {
  TAX_RATE_CONFIGS,
  getTaxRateForCategory,
  getTaxTypeForCountry,
  getSupportedCountries,
  isCountrySupported,
} from "./tax-rates";

// Utility functions
export {
  getFlatCategories,
  getCategoryBySlug,
  getParentCategory,
  getCategoryWithTaxRate,
} from "./utils";

// Color system
export {
  CATEGORY_COLORS,
  CATEGORY_COLOR_MAP,
  getCategoryColor,
  getColorFromSlug,
  getRandomColor,
  getAllColors,
} from "./color-system";

// Embeddings
export {
  generateCategoryEmbedding,
  generateCategoryEmbeddings,
  CategoryEmbeddings,
} from "./embeddings";

// Constants for easy reference
export const TAX_TYPES = [
  "vat",
  "gst",
  "sales_tax",
  "income_tax",
  "none",
] as const;

// Revenue category constants
export const REVENUE_CATEGORIES = [
  "revenue",
  "income",
  "product-sales",
  "service-revenue",
  "consulting-revenue",
  "subscription-revenue",
  "interest-income",
  "other-income",
] as const;

export const CONTRA_REVENUE_CATEGORIES = [
  "customer-refunds",
  "chargebacks-disputes",
] as const;
