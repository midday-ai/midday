import type { TaxRateConfig } from "../types";

// Tax rate configurations by country
export const TAX_RATE_CONFIGS: Record<string, TaxRateConfig> = {
  // United States
  US: {
    countryCode: "US",
    taxType: "sales_tax",
    defaultRate: 0, // No federal sales tax, varies by state
    categoryRates: {
      // Most categories are subject to state sales tax
      "revenue.product_sales": 0, // Will be set by state
      "revenue.service_revenue": 0, // Often exempt from sales tax
      "cost_of_goods_sold.inventory": 0, // Business purchases often exempt
    },
  },

  // United Kingdom
  GB: {
    countryCode: "GB",
    taxType: "vat",
    defaultRate: 20,
    categoryRates: {
      // Standard VAT rate
      "revenue.product_sales": 20,
      "revenue.service_revenue": 20,
      "technology.software": 20,
      "operations.office_supplies": 20,
      // Reduced rates
      "travel_entertainment.meals": 5, // Reduced rate for food
      // Zero rates
      "revenue.subscription_revenue": 0, // Some digital services
      "professional_services.insurance": 0, // Insurance is exempt
    },
  },

  // Canada
  CA: {
    countryCode: "CA",
    taxType: "gst",
    defaultRate: 5, // Federal GST
    categoryRates: {
      "revenue.product_sales": 5,
      "revenue.service_revenue": 5,
      "technology.software": 5,
      "operations.office_supplies": 5,
      "travel_entertainment.meals": 5,
      // Note: Provinces may add PST/HST
    },
  },

  // Germany
  DE: {
    countryCode: "DE",
    taxType: "vat",
    defaultRate: 19,
    categoryRates: {
      "revenue.product_sales": 19,
      "revenue.service_revenue": 19,
      "technology.software": 19,
      "operations.office_supplies": 19,
      "travel_entertainment.meals": 7, // Reduced rate
      "professional_services.insurance": 0, // Insurance is exempt
    },
  },

  // France
  FR: {
    countryCode: "FR",
    taxType: "vat",
    defaultRate: 20,
    categoryRates: {
      "revenue.product_sales": 20,
      "revenue.service_revenue": 20,
      "technology.software": 20,
      "operations.office_supplies": 20,
      "travel_entertainment.meals": 10, // Reduced rate
      "professional_services.insurance": 0, // Insurance is exempt
    },
  },

  // Australia
  AU: {
    countryCode: "AU",
    taxType: "gst",
    defaultRate: 10,
    categoryRates: {
      "revenue.product_sales": 10,
      "revenue.service_revenue": 10,
      "technology.software": 10,
      "operations.office_supplies": 10,
      "travel_entertainment.meals": 10,
      "professional_services.insurance": 0, // Insurance is exempt
      "human_resources.salary": 0, // Wages are exempt
    },
  },

  // Netherlands
  NL: {
    countryCode: "NL",
    taxType: "vat",
    defaultRate: 21,
    categoryRates: {
      "revenue.product_sales": 21,
      "revenue.service_revenue": 21,
      "technology.software": 21,
      "operations.office_supplies": 21,
      "travel_entertainment.meals": 9, // Reduced rate
      "professional_services.insurance": 0, // Insurance is exempt
    },
  },

  // Sweden
  SE: {
    countryCode: "SE",
    taxType: "vat",
    defaultRate: 25,
    categoryRates: {
      "revenue.product_sales": 25,
      "revenue.service_revenue": 25,
      "technology.software": 25,
      "operations.office_supplies": 25,
      "travel_entertainment.meals": 12, // Reduced rate
      "professional_services.insurance": 0, // Insurance is exempt
    },
  },

  // Norway
  NO: {
    countryCode: "NO",
    taxType: "vat",
    defaultRate: 25,
    categoryRates: {
      "revenue.product_sales": 25,
      "revenue.service_revenue": 25,
      "technology.software": 25,
      "operations.office_supplies": 25,
      "travel_entertainment.meals": 15, // Reduced rate
      "professional_services.insurance": 0, // Insurance is exempt
    },
  },

  // Denmark
  DK: {
    countryCode: "DK",
    taxType: "vat",
    defaultRate: 25,
    categoryRates: {
      "revenue.product_sales": 25,
      "revenue.service_revenue": 25,
      "technology.software": 25,
      "operations.office_supplies": 25,
      "travel_entertainment.meals": 25, // Standard rate
      "professional_services.insurance": 0, // Insurance is exempt
    },
  },

  // Default fallback for countries without specific configuration
  DEFAULT: {
    countryCode: "DEFAULT",
    taxType: "none",
    defaultRate: 0,
    categoryRates: {},
  },
};

// Helper function to get tax rate for a specific category and country
export function getTaxRateForCategory(
  countryCode: string,
  categorySlug: string,
): number {
  const config = TAX_RATE_CONFIGS[countryCode] || TAX_RATE_CONFIGS.DEFAULT;

  // Check if there's a specific rate for this category
  if (config?.categoryRates?.[categorySlug] !== undefined) {
    return config.categoryRates[categorySlug];
  }

  // Fall back to default rate
  return config?.defaultRate || 0;
}

// Helper function to get tax type for a country
export function getTaxTypeForCountry(countryCode: string): string {
  const config = TAX_RATE_CONFIGS[countryCode] || TAX_RATE_CONFIGS.DEFAULT;
  return config?.taxType || "none";
}

// Helper function to get all supported countries
export function getSupportedCountries(): string[] {
  return Object.keys(TAX_RATE_CONFIGS).filter((code) => code !== "DEFAULT");
}

// Helper function to check if a country is supported
export function isCountrySupported(countryCode: string): boolean {
  return countryCode in TAX_RATE_CONFIGS;
}
