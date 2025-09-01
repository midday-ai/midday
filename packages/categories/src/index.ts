// Types
export type {
  BaseCategory,
  ParentCategory,
  ChildCategory,
  CategoryHierarchy,
  TaxRateConfig,
  LegacyCategoryMapping,
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
export {
  CATEGORIES,
  CATEGORY_COLORS,
} from "./categories";

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

// Constants for easy reference
export const TAX_TYPES = [
  "vat",
  "gst",
  "sales_tax",
  "income_tax",
  "none",
] as const;
