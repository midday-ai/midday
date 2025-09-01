import { z } from "zod";

// Transaction categories that the LLM can assign (only categories suitable for AI categorization)
export const transactionCategories = [
  // Core expense categories (high confidence)
  "software", // SaaS subscriptions, development tools
  "travel", // Business trips, transportation
  "meals", // Business dining, client meals
  "office-supplies", // Stationery, consumables
  "equipment", // Computers, furniture, tools
  "utilities", // Electric, water, gas bills
  "rent", // Office space, co-working
  "internet-and-telephone", // ISP, phone bills
  "facilities-expenses", // Building maintenance

  // Marketing & advertising
  "marketing", // Marketing services, agencies
  "advertising", // Ad platforms, campaigns
  "website", // Domain, hosting, web development
  "domain-hosting", // Specific hosting services

  // Professional services
  "insurance", // Business insurance premiums
  "contractors", // Freelancer payments
  "fees", // Bank fees, processing fees

  // Operations
  "maintenance-repairs", // Equipment/building maintenance
  "cleaning-supplies", // Cleaning services, supplies
  "security", // Security systems, monitoring
  "cloud-storage", // Cloud backup, storage services

  // Training & development
  "training", // Courses, certifications

  // Financial (automated transactions)
  "credit-card-payment", // Credit card charges
  "interest-expense", // Loan interest payments

  // Fallback
  "uncategorized", // When uncertain
  "other", // Miscellaneous expenses
] as const;

// Structured output schema for LLM response (for use with output: "array")
export const enrichmentSchema = z.object({
  merchant: z
    .string()
    .nullable()
    .describe("The formal legal business entity name"),
  category: z
    .enum(transactionCategories)
    .nullable()
    .describe(
      "The category of the transaction - only return if confidence is high",
    ),
  categoryConfidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Confidence score for the category assignment (0-1, where 1 is highest confidence)",
    ),
  merchantConfidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Confidence score for the merchant name extraction (0-1, where 1 is highest confidence)",
    ),
});

// Types
export type TransactionData = {
  description: string;
  amount: string;
  currency: string;
};

export type EnrichmentResult = z.infer<typeof enrichmentSchema>;

export type UpdateData = {
  merchantName?: string;
  categorySlug?: string;
};

// Confidence thresholds for accepting LLM results
export const CONFIDENCE_THRESHOLDS = {
  CATEGORY_MIN: 0.7, // Only accept category if confidence >= 70%
  MERCHANT_MIN: 0.6, // Only accept merchant if confidence >= 60%
  HIGH_CONFIDENCE: 0.9, // Consider this high confidence
} as const;

// Helper function to determine if we should use the LLM result
export function shouldUseCategoryResult(result: EnrichmentResult): boolean {
  return (
    result.category !== null &&
    result.categoryConfidence >= CONFIDENCE_THRESHOLDS.CATEGORY_MIN
  );
}

export function shouldUseMerchantResult(result: EnrichmentResult): boolean {
  return (
    result.merchant !== null &&
    result.merchantConfidence >= CONFIDENCE_THRESHOLDS.MERCHANT_MIN
  );
}

export function isHighConfidenceResult(result: EnrichmentResult): boolean {
  return (
    result.categoryConfidence >= CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE &&
    result.merchantConfidence >= CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE
  );
}
