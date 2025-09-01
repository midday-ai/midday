import { CATEGORIES } from "./categories";
import { getTaxRateForCategory } from "./tax-rates";
import type { ChildCategory, ParentCategory } from "./types";

// Get all categories flattened into a single array
export function getFlatCategories(): ChildCategory[] {
  const flatCategories: ChildCategory[] = [];

  for (const parent of CATEGORIES) {
    // Add parent as a child category for backward compatibility
    flatCategories.push({
      slug: parent.slug,
      name: parent.name,
      description: parent.description,
      color: parent.color,
      system: parent.system,
      parentSlug: "", // Root level
    });

    // Add all children
    flatCategories.push(...parent.children);
  }

  return flatCategories;
}

// Get category by slug
export function getCategoryBySlug(
  slug: string,
): ChildCategory | ParentCategory | null {
  // Check parent categories first
  const parent = CATEGORIES.find((cat) => cat.slug === slug);
  if (parent) return parent;

  // Check child categories
  for (const parent of CATEGORIES) {
    const child = parent.children.find((child) => child.slug === slug);
    if (child) return child;
  }

  return null;
}

// Get parent category for a given child slug
export function getParentCategory(childSlug: string): ParentCategory | null {
  for (const parent of CATEGORIES) {
    if (parent.children.some((child) => child.slug === childSlug)) {
      return parent;
    }
  }
  return null;
}

// Get category with tax rate for a specific country
export function getCategoryWithTaxRate(
  categorySlug: string,
  countryCode: string,
): ((ChildCategory | ParentCategory) & { taxRate: number }) | null {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return null;

  const taxRate = getTaxRateForCategory(countryCode, categorySlug);

  return {
    ...category,
    taxRate,
  };
}

// Export the main categories for easy access
export { CATEGORIES } from "./categories";
