import { z } from "zod";

// Base category type
export interface BaseCategory {
  slug: string;
  name: string;
  color?: string;
  system: boolean;
  taxReportingCode?: string;
  excluded?: boolean;
}

// Parent category interface
export interface ParentCategory extends BaseCategory {
  children: ChildCategory[];
}

// Child category interface
export interface ChildCategory extends BaseCategory {
  parentSlug: string; // Reference to parent category slug (for readability)
}

// Category hierarchy type
export type CategoryHierarchy = ParentCategory[];

// Zod schemas for validation
export const baseCategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  color: z.string().optional(),
  system: z.boolean(),
  taxReportingCode: z.string().optional(),
  excluded: z.boolean().optional(),
});

export const childCategorySchema = baseCategorySchema.extend({
  parentSlug: z.string(),
});

export const parentCategorySchema = baseCategorySchema.extend({
  children: z.array(childCategorySchema),
});

export const categoryHierarchySchema = z.array(parentCategorySchema);
