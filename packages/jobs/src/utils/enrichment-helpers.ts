import type { TransactionForEnrichment } from "@midday/db/queries";
import type { TransactionData, UpdateData } from "./enrichment-schema";

/**
 * Generates the enrichment prompt for the LLM
 */
export function generateEnrichmentPrompt(
  transactionData: TransactionData[],
): string {
  const transactionList = transactionData
    .map(
      (tx) =>
        `${tx.index}. Description: "${tx.description}", Amount: ${tx.amount}, Currency: ${tx.currency}`,
    )
    .join("\n");

  return `You are a financial transaction enrichment function.

Process each transaction with its description, amount, and currency.

Return:
1. The most likely legal merchant or company name. If you cannot confidently identify the legal name, return a cleaned and lowercase version of the merchant string, suitable for use in embeddings.
2. The best-fit category from the allowed categories based on the transaction's content and context.

Transactions to process:
${transactionList}

Respond with structured data for each transaction.`;
}

/**
 * Prepares transaction data for LLM processing
 */
export function prepareTransactionData(
  batch: TransactionForEnrichment[],
): TransactionData[] {
  return batch.map((tx, index) => {
    const description = tx.counterpartyName || tx.name;
    return {
      index: index + 1,
      description: description + (tx.description ? ` - ${tx.description}` : ""),
      amount: tx.amount,
      currency: tx.currency,
    };
  });
}

/**
 * Prepares update data, respecting existing category classifications
 */
export function prepareUpdateData(
  transaction: { categorySlug: string | null },
  result: { merchant: string; category: string },
): UpdateData {
  const updateData: UpdateData = {
    merchantName: result.merchant,
  };

  // Only update categorySlug if it's currently null
  if (!transaction.categorySlug) {
    updateData.categorySlug = result.category;
  }

  return updateData;
}
