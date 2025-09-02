# @midday/categories

A comprehensive financial category system for SMBs with international tax rate support.

## Features

- **Hierarchical Categories**: Parent-child structure for comprehensive financial reporting
- **International Tax Rates**: Support for 31+ countries with VAT/GST/sales tax rates
- **Backward Compatibility**: Preserves existing category slugs
- **Built-in Names**: All categories include display names

## Installation

```bash
npm install @midday/categories
```

## Usage

### Basic Category Access

```typescript
import { CATEGORIES, getCategoryBySlug, getParentCategory } from '@midday/categories';

// Get all categories
const allCategories = CATEGORIES;

// Find a specific category
const softwareCategory = getCategoryBySlug('software');

// Get parent category
const parent = getParentCategory('software'); // Returns 'technology'
```

### Tax Rate Lookup

```typescript
import { getTaxRateForCategory, getTaxTypeForCountry } from '@midday/categories';

// Get tax rate for a category in a specific country
const taxRate = getTaxRateForCategory('SE', 'meals'); // Returns 12 (Sweden, reduced rate)

// Get tax type for a country
const taxType = getTaxTypeForCountry('SE'); // Returns 'vat'
```

### Category Names

All categories include built-in display names that can be used directly:

```typescript
// Access category names directly
const revenueCategory = getCategoryBySlug('revenue');
console.log(revenueCategory.name); // "Revenue"

const officeSupplies = getCategoryBySlug('office-supplies');
console.log(officeSupplies.name); // "Office Supplies"
```

### Category Colors

Each category has a predefined color for consistent UI representation:

```typescript
import { getCategoryColor, CATEGORY_COLOR_MAP } from '@midday/categories';

// Get color for any category
const revenueColor = getCategoryColor('revenue'); // "#00D084" (Green)
const officeSuppliesColor = getCategoryColor('office-supplies'); // "#8ED1FC" (Sky Blue)

// Access the complete color map
const allColors = CATEGORY_COLOR_MAP;
```

**Color Philosophy:**
- **Revenue categories**: Green variations (income, growth)
- **Cost categories**: Orange variations (expenses, caution)
- **Each parent category**: Distinct base color
- **Child categories**: Harmonious variations of parent color

## Category Structure

The system includes 14 parent categories:

1. **Revenue** - Business income streams
2. **Cost of Goods Sold** - Direct production costs
3. **Sales & Marketing** - Marketing and sales expenses
4. **Operations** - Day-to-day operational costs
5. **Professional Services** - External professional services
6. **Human Resources** - Employee-related costs
7. **Travel & Entertainment** - Business travel and entertainment
8. **Technology** - Software and tech subscriptions
9. **Banking & Finance** - Financial services and fees
10. **Assets & CapEx** - Capital expenditures
11. **Liabilities & Debt** - Debt obligations
12. **Taxes & Government** - Tax payments and government fees
13. **Owner / Equity** - Owner transactions and investments
14. **System** - System categories (uncategorized, other)

## Supported Countries

The package includes tax rate configurations for:

- **Nordic**: SE, FI, NO, DK
- **EU**: DE, FR, NL, BE, AT, IT, ES, PL, CZ, PT, LU, EE, LV, LT, SK, SI, RO, HU
- **Other**: US, GB, CA, AU, NZ, CH, IE, TR

## Migration

Existing transactions using legacy category slugs (e.g., "office-supplies", "travel") will continue to work without any data migration needed.

## API Reference

See the TypeScript types for complete API documentation.
