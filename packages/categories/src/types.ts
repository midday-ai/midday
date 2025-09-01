import { z } from "zod";

// Base category type
export interface BaseCategory {
  slug: string;
  name: string;
  description?: string;
  color?: string;
  system: boolean;
}

// Parent category interface
export interface ParentCategory extends BaseCategory {
  children: ChildCategory[];
}

// Child category interface
export interface ChildCategory extends BaseCategory {
  parentSlug: string;
}

// Category hierarchy type
export type CategoryHierarchy = ParentCategory[];

// Tax rate configuration
export interface TaxRateConfig {
  countryCode: string;
  taxType: "vat" | "gst" | "sales_tax" | "income_tax" | "none";
  defaultRate: number;
  categoryRates?: Record<string, number>; // category slug -> tax rate
}

// Zod schemas for validation
export const baseCategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  system: z.boolean(),
});

export const childCategorySchema = baseCategorySchema.extend({
  parentSlug: z.string(),
});

export const parentCategorySchema = baseCategorySchema.extend({
  children: z.array(childCategorySchema),
});

export const categoryHierarchySchema = z.array(parentCategorySchema);

export const taxRateConfigSchema = z.object({
  countryCode: z.string(),
  taxType: z.enum(["vat", "gst", "sales_tax", "income_tax", "none"]),
  defaultRate: z.number(),
  categoryRates: z.record(z.string(), z.number()).optional(),
});

// Legacy category mapping for backward compatibility
export interface LegacyCategoryMapping {
  legacySlug: string;
  newParentSlug: string;
  newChildSlug: string;
}
