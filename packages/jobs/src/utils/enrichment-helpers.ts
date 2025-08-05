import type { TransactionForEnrichment } from "@midday/db/queries";
import type { TransactionData, UpdateData } from "./enrichment-schema";
import { transactionCategories } from "./enrichment-schema";

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

${
  needsCategories
    ? `
CATEGORY RULES:
Categorize based on the core business entity, not location/transaction details.

• software - Google, Microsoft, Adobe, AWS, Stripe, Slack, any SaaS/tech service
• travel - Airlines, hotels, Uber/Lyft, rental cars, parking
• meals - Restaurants, cafes, Starbucks, food/beverage only
• office-supplies - Staples, Office Depot, paper, pens, small supplies
• equipment - Apple hardware, computers, phones, machinery >$500  
• internet-and-telephone - Verizon, AT&T, ISPs, phone/internet bills
• rent - Office/warehouse rent, WeWork, coworking spaces
• facilities-expenses - Utilities, maintenance, security, cleaning
• activity - Conferences, training, team events, workshops
• fees - Bank fees, legal, accounting, payment processing
• transfer - Transfers between accounts, wire transfers, ACH transfers
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
  result: { merchant: string | null; category: string },
): UpdateData {
  const updateData: UpdateData = {};

  // Always update merchantName if the LLM provides one
  // This allows enhancement of existing simplified names to formal legal entity names
  if (result.merchant) {
    updateData.merchantName = result.merchant;
  }

  const validCategory = isValidCategory(result.category);

  // Only update categorySlug if it's currently null AND amount is not positive
  // Positive amounts are typically income and shouldn't be categorized as business expenses
  if (!transaction.categorySlug && validCategory && transaction.amount <= 0) {
    updateData.categorySlug = result.category;
  }

  return updateData;
}
