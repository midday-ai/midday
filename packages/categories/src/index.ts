// Types
export type {
  BaseCategory,
  ParentCategory,
  ChildCategory,
  CategoryHierarchy,
} from "./types";

// Zod schemas for validation
export {
  baseCategorySchema,
  childCategorySchema,
  parentCategorySchema,
  categoryHierarchySchema,
} from "./types";

// Main category definitions
export { CATEGORIES } from "./categories";

// Utility functions
export {
  getFlatCategories,
  getCategoryBySlug,
  getParentCategory,
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
