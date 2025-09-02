// Comprehensive color palette for financial categories
export const CATEGORY_COLORS = [
  // Primary Business Colors
  "#FF6900", // Orange - Revenue
  "#00D084", // Emerald - Cost of Goods Sold
  "#0693E3", // Blue - Sales & Marketing
  "#8ED1FC", // Sky Blue - Operations
  "#9900EF", // Purple - Professional Services
  "#EB144C", // Red - Human Resources
  "#FF9F1C", // Orange - Travel & Entertainment
  "#39CCCC", // Teal - Technology
  "#0074D9", // Blue - Banking & Finance
  "#3D9970", // Olive - Assets & CapEx
  "#B04632", // Rust - Liabilities & Debt
  "#DC2626", // Red - Taxes & Government
  "#059669", // Green - Owner / Equity
  "#6B7280", // Gray - System

  // Extended Palette for Child Categories
  "#FCB900", // Yellow
  "#ABB8C3", // Gray
  "#F78DA7", // Pink
  "#0079BF", // Dark Blue
  "#B6BBBF", // Light Gray
  "#FF5A5F", // Coral
  "#F7C59F", // Peach
  "#8492A6", // Slate
  "#4D5055", // Charcoal
  "#AF5A50", // Terracotta
  "#F9D6E7", // Pale Pink
  "#B5EAEA", // Pale Cyan
  "#B388EB", // Lavender
  "#FF78CB", // Pink
  "#4E5A65", // Gray
  "#01FF70", // Lime
  "#85144B", // Pink
  "#F012BE", // Purple
  "#7FDBFF", // Sky Blue
  "#AAAAAA", // Silver
  "#111111", // Black
  "#001F3F", // Navy
  "#5E6A71", // Ash
  "#75D701", // Neon Green
  "#B6C8A9", // Lichen
  "#00A9FE", // Electric Blue
  "#EAE8E1", // Bone
  "#CD346C", // Raspberry
  "#FF6FA4", // Pink Sherbet
  "#D667FB", // Purple Mountain Majesty
  "#0080FF", // Azure
  "#656D78", // Dim Gray
  "#F8842C", // Tangerine
  "#FF8CFF", // Carnation Pink
  "#647F6A", // Feldgrau
  "#5E574E", // Field Drab
  "#EF5466", // KU Crimson
  "#B0E0E6", // Powder Blue
  "#EB5E7C", // Rose Pink
  "#8A2BE2", // Blue Violet
  "#6B7C85", // Slate Gray
  "#8C92AC", // Lavender Blue
  "#6C587A", // Eminence
  "#52A1FF", // Azureish White
  "#32CD32", // Lime Green
  "#E04F9F", // Orchid Pink
  "#915C83", // Lilac Bush
  "#4C6B88", // Air Force Blue
  "#587376", // Cadet Blue
  "#C46210", // Buff
  "#65B0D0", // Columbia Blue
  "#2F4F4F", // Dark Slate Gray
  "#528B8B", // Dark Cyan
  "#8B4513", // Saddle Brown
  "#4682B4", // Steel Blue
  "#CD853F", // Peru
  "#FFA07A", // Light Salmon
  "#CD5C5C", // Indian Red
  "#483D8B", // Dark Slate Blue
  "#696969", // Dim Gray
] as const;

// Hash function for consistent color generation
export function customHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) + value.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Get color index from a string value
export function getColorIndex(value: string): number {
  const hashValue = customHash(value);
  return hashValue % CATEGORY_COLORS.length;
}

// Get color from a string value (slug)
export function getColorFromSlug(slug: string): string {
  const index = getColorIndex(slug);
  // Ensure index is within bounds and CATEGORY_COLORS[index] is defined
  return CATEGORY_COLORS[index] ?? CATEGORY_COLORS[0];
}

// Get random color from the palette
export function getRandomColor(): string {
  const randomIndex = Math.floor(Math.random() * CATEGORY_COLORS.length);
  // Ensure a string is always returned (fallback to first color if undefined)
  return CATEGORY_COLORS[randomIndex] ?? CATEGORY_COLORS[0];
}

// Predefined colors for parent categories (for consistency)
export const PARENT_CATEGORY_COLORS = {
  revenue: "#00D084", // Green - Income/Revenue
  "cost-of-goods-sold": "#FF6900", // Orange - Costs
  "sales-marketing": "#0693E3", // Blue
  operations: "#8ED1FC", // Sky Blue
  "professional-services": "#9900EF", // Purple
  "human-resources": "#EB144C", // Red
  "travel-entertainment": "#FF9F1C", // Orange
  technology: "#39CCCC", // Teal
  "banking-finance": "#0074D9", // Blue
  "assets-capex": "#3D9970", // Olive
  "liabilities-debt": "#B04632", // Rust
  taxes: "#DC2626", // Red
  "owner-equity": "#059669", // Green
  system: "#6B7280", // Gray
} as const;

// Comprehensive color mapping for all categories
export const CATEGORY_COLOR_MAP = {
  // Parent Categories
  revenue: "#00D084", // Green - Income/Revenue
  "cost-of-goods-sold": "#FF6900", // Orange - Costs
  "sales-marketing": "#0693E3", // Blue
  operations: "#8ED1FC", // Sky Blue
  "professional-services": "#9900EF", // Purple
  "human-resources": "#EB144C", // Red
  "travel-entertainment": "#FF9F1C", // Orange
  technology: "#39CCCC", // Teal
  "banking-finance": "#0074D9", // Blue
  "assets-capex": "#3D9970", // Olive
  "liabilities-debt": "#B04632", // Rust
  taxes: "#DC2626", // Red
  "owner-equity": "#059669", // Green
  system: "#6B7280", // Gray

  // Revenue Children (Green variations)
  income: "#06eb51",
  "product-sales": "#00D084", // Main green
  "service-revenue": "#00E676", // Lighter green
  "consulting-revenue": "#00C853", // Medium green
  "subscription-revenue": "#00E676", // Lighter green
  "interest-income": "#00B894", // Darker green
  "other-income": "#00C853", // Medium green
  "customer-refunds": "#00D084", // Main green
  "chargebacks-disputes": "#00B894", // Darker green

  // Cost of Goods Sold Children (Orange variations)
  inventory: "#FF6900", // Main orange
  manufacturing: "#FF8A00", // Lighter orange
  "shipping-inbound": "#FF8A00", // Lighter orange
  "duties-customs": "#FF8A00", // Lighter orange

  // Sales & Marketing Children (Blue variations)
  marketing: "#0693E3", // Main blue
  advertising: "#00A9FE", // Electric blue
  website: "#0074D9", // Darker blue
  events: "#0693E3", // Main blue
  "promotional-materials": "#00A9FE", // Electric blue

  // Operations Children (Sky Blue variations)
  "office-supplies": "#8ED1FC", // Main sky blue
  rent: "#A8E6FF", // Light sky blue (consistent with operations)
  utilities: "#39CCCC", // Teal (distinct)
  "facilities-expenses": "#8ED1FC", // Main sky blue
  equipment: "#00A9FE", // Electric blue (distinct)
  "internet-and-telephone": "#39CCCC", // Teal (distinct)
  shipping: "#0074D9", // Darker blue (distinct)

  // Professional Services Children (Purple variations)
  "professional-services-fees": "#9900EF", // Main purple
  contractors: "#B388EB", // Lavender
  insurance: "#8A2BE2", // Blue violet

  // Human Resources Children (Red variations)
  salary: "#EB144C", // Main red
  training: "#FF6FA4", // Pink sherbet
  benefits: "#FF78CB", // Pink

  // Travel & Entertainment Children (Orange variations)
  travel: "#FF9F1C", // Main orange
  meals: "#FFB74D", // Lighter orange
  activity: "#FFCC02", // Yellow-orange

  // Technology Children (Teal variations)
  software: "#39CCCC", // Main teal
  "non-software-subscriptions": "#00A9FE", // Electric blue

  // Banking & Finance Children (Blue variations)
  transfer: "#0074D9", // Main blue
  "credit-card-payment": "#00A9FE", // Electric blue
  "banking-fees": "#0693E3", // Lighter blue
  "loan-proceeds": "#0074D9", // Main blue
  "loan-principal-repayment": "#00A9FE", // Electric blue
  "interest-expense": "#0693E3", // Lighter blue
  payouts: "#0074D9", // Main blue
  "processor-fees": "#00A9FE", // Electric blue
  fees: "#0693E3", // Lighter blue

  // Assets Children (Olive variations)
  "fixed-assets": "#3D9970", // Main olive
  "prepaid-expenses": "#4C6B88", // Air force blue (distinct)

  // Liabilities & Debt Children (Rust variations)
  leases: "#B04632", // Main rust
  "deferred-revenue": "#C46210", // Buff

  // Taxes & Government Children (Red variations)
  "vat-gst-pst-qst-payments": "#DC2626", // Main red
  "sales-use-tax-payments": "#FF5A5F", // Coral
  "income-tax-payments": "#DC2626", // Main red
  "payroll-tax-remittances": "#FF5A5F", // Coral
  "employer-taxes": "#DC2626", // Main red
  "government-fees": "#DC2626", // Main red

  // Owner / Equity Children (Green variations)
  "owner-draws": "#059669", // Main green
  "capital-investment": "#00B894", // Darker green
  "charitable-donations": "#00C853", // Medium green

  // System Children (Gray variations)
  uncategorized: "#6B7280", // Main gray
  other: "#9CA3AF", // Lighter gray
} as const;

// Get color for a category (uses predefined mapping)
export function getCategoryColor(slug: string): string {
  const color = CATEGORY_COLOR_MAP[slug as keyof typeof CATEGORY_COLOR_MAP];
  if (color) {
    return color;
  }

  // Fallback to hash-based generation for any unmapped categories
  return getColorFromSlug(slug);
}

// Get all available colors
export function getAllColors(): readonly string[] {
  return CATEGORY_COLORS;
}
