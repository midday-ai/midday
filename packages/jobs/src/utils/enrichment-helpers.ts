import type { TransactionForEnrichment } from "@midday/db/queries";
import type {
  EnrichmentResult,
  TransactionData,
  UpdateData,
} from "./enrichment-schema";
import {
  shouldUseCategoryResult,
  shouldUseMerchantResult,
  transactionCategories,
} from "./enrichment-schema";

/**
 * Generates the enrichment prompt for the LLM
 */
export function generateEnrichmentPrompt(
  transactionData: TransactionData[],
  batch: TransactionForEnrichment[],
): string {
  const transactionList = transactionData
    .map((tx, index) => {
      const transaction = batch[index];
      const hasExistingMerchant = transaction?.merchantName;

      return `${index + 1}. Description: "${tx.description}", Amount: ${tx.amount}, Currency: ${tx.currency}${hasExistingMerchant ? ` (Current Merchant: ${transaction.merchantName})` : ""}`;
    })
    .join("\n");

  const needsCategories = batch.some((tx) => !tx.categorySlug);

  let returnInstructions = "Return:\n";

  if (needsCategories) {
    returnInstructions +=
      "1. Legal entity name: Apply the transformation rules above\n";
    returnInstructions +=
      "2. Category: Select the best-fit category from the allowed list\n";
  } else {
    returnInstructions +=
      "Legal entity name: Apply the transformation rules above\n";
  }

  return `You are a legal entity identification system for business expense transactions.

TASK: For EVERY transaction, identify the formal legal business entity name with proper entity suffixes (Inc, LLC, Corp, Ltd, Co, etc.).

INPUT HIERARCHY (use in this priority order):
1. "Current Merchant": Existing name from provider → enhance to legal entity
2. "Counterparty": Bank-parsed name → identify legal entity
3. "Raw": Transaction description → extract legal entity
4. "Description": Additional context → supplement identification

TRANSFORMATION EXAMPLES:
✓ "Anthropic" → "Anthropic Inc"
✓ "Google Pay" → "Google LLC" 
✓ "AMZN MKTP" → "Amazon.com Inc"
✓ "Starbucks #1234" → "Starbucks Corporation"
✓ "MSFT*Office365" → "Microsoft Corporation"
✓ "Apple Store" → "Apple Inc"

REQUIREMENTS:
- Use official legal entity suffixes: Inc, LLC, Corp, Corporation, Ltd, Co, etc.
- Prefer the parent company's legal entity (Google LLC, not Google Pay LLC)
- Ignore location codes, store numbers, and transaction details
- If genuinely unknown, provide best cleaned/capitalized version available

CONFIDENCE SCORING:
- categoryConfidence: Rate your confidence in the category assignment (0-1)
  • 1.0 = Very certain (e.g., "Slack" → software)
  • 0.8 = Quite confident (e.g., "Hotel booking" → travel)  
  • 0.5 = Unsure (e.g., ambiguous merchant)
  • 0.2 = Very uncertain
- merchantConfidence: Rate your confidence in the merchant name (0-1)
  • 1.0 = Official company name found
  • 0.8 = Strong match with known entity
  • 0.5 = Best guess from available info
  • 0.2 = Very uncertain
- Only return category if confidence >= 0.7, otherwise return null

${
  needsCategories
    ? `
CATEGORIZATION RULES:
Assign categories based on merchant name and business purpose. Only return category if confidence >= 0.7, otherwise return null.

CONFIDENCE EXAMPLES:
• "Slack Technologies" → software (0.95) ✅
• "Delta Air Lines" → travel (0.95) ✅
• "ConEd Electric" → utilities (0.90) ✅
• "ABC Corp payment" → null (0.4) ❌ Too uncertain

COMMON CATEGORIES (only use if confident):
• software: SaaS tools (Slack, Google Workspace, GitHub, AWS)
• travel: Business trips (airlines, hotels, Uber to meetings)
• meals: Business dining (restaurants, client meals, catering)
• office-supplies: Stationery, consumables (paper, pens, supplies)
• equipment: Computers, furniture, tools >$500
• utilities: Utility bills (electric, water, gas, internet)
• rent: Office space, co-working, storage facilities
• marketing: Marketing services, agencies, SEO
• advertising: Ad platforms (Google Ads, Facebook Ads)
• insurance: Business insurance premiums
• contractors: Freelancer payments, 1099 contractors
• fees: Bank charges, processing fees, service fees
• website: Domains, hosting, web development
• domain-hosting: Specific hosting services (GoDaddy, Cloudflare)
• cloud-storage: Cloud services (Dropbox, Google Drive, AWS S3)
• training: Courses, certifications, conferences
• maintenance-repairs: Equipment repairs, building maintenance
• cleaning-supplies: Cleaning services, janitorial supplies
• security: Security systems, monitoring services
• credit-card-payment: Credit card transactions
• interest-expense: Loan interest payments
• uncategorized: Use when uncertain

RULES:
1. Only categorize if confidence >= 0.7
2. When uncertain, return null for category
3. Focus on merchant name for clues
4. Consider business context and amount
`
    : ""
}

${returnInstructions}

Transactions to process:
${transactionList}

Return exactly ${batch.length} results in order. Apply the transformation rules consistently.
`;
}

/**
 * Prepares transaction data for LLM processing
 */
export function prepareTransactionData(
  batch: TransactionForEnrichment[],
): TransactionData[] {
  return batch.map((tx) => {
    // Build a comprehensive description with all available information
    const parts: string[] = [];

    if (tx.counterpartyName) {
      parts.push(`Counterparty: ${tx.counterpartyName}`);
    }

    if (tx.name && tx.name !== tx.counterpartyName) {
      parts.push(`Raw: ${tx.name}`);
    }

    if (
      tx.description &&
      tx.description !== tx.counterpartyName &&
      tx.description !== tx.name
    ) {
      parts.push(`Description: ${tx.description}`);
    }

    // Fallback to just name if no counterparty
    const description = parts.length > 0 ? parts.join(" | ") : tx.name;

    return {
      description,
      amount: tx.amount.toString(),
      currency: tx.currency,
    };
  });
}

/**
 * Validates if a category is in the allowed list
 */
function isValidCategory(category: string): boolean {
  return transactionCategories.includes(
    category as (typeof transactionCategories)[number],
  );
}

/**
 * Prepares update data, enhancing merchant names to legal entity names and category classifications
 */
export function prepareUpdateData(
  transaction: {
    categorySlug: string | null;
    merchantName: string | null;
    amount: number;
  },
  result: EnrichmentResult,
): UpdateData {
  const updateData: UpdateData = {};

  // Only update merchantName if confidence is high enough
  if (shouldUseMerchantResult(result)) {
    updateData.merchantName = result.merchant!;
  }

  // Category assignment logic
  if (!transaction.categorySlug && transaction.amount <= 0) {
    if (
      shouldUseCategoryResult(result) &&
      result.category &&
      isValidCategory(result.category)
    ) {
      // High confidence: use the suggested category
      updateData.categorySlug = result.category;
    } else {
      // Low confidence or no category: mark as uncategorized to prevent reprocessing
      updateData.categorySlug = "uncategorized";
    }
  }

  return updateData;
}
