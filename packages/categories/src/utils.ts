import { CATEGORIES } from "./categories";
import type { ChildCategory, ParentCategory } from "./types";

// Get all categories flattened into a single array
export function getFlatCategories(): ChildCategory[] {
  const flatCategories: ChildCategory[] = [];
  for (const parent of CATEGORIES) {
    flatCategories.push({
      name: parent.name,
      slug: parent.slug,
      color: parent.color,
      system: parent.system,
      parentSlug: "",
    });

    flatCategories.push(...parent.children);
  }
  return flatCategories;
}

// Get category by slug
export function getCategoryBySlug(
  slug: string,
): ChildCategory | ParentCategory | null {
  const parent = CATEGORIES.find((cat) => cat.slug === slug);

  if (parent) return parent;

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

// Export the main categories for easy access
export { CATEGORIES } from "./categories";
