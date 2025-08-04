import type { Database } from "@db/client";
import { transactionEmbeddings, transactions } from "@db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";

export type GetTransactionsForEmbeddingParams = {
  transactionIds: string[];
  teamId: string;
};

export type TransactionForEmbedding = {
  id: string;
  name: string;
  counterpartyName: string | null;
  description: string | null;
  merchantName: string | null;
};

export async function getTransactionsForEmbedding(
  db: Database,
  params: GetTransactionsForEmbeddingParams,
): Promise<TransactionForEmbedding[]> {
  if (params.transactionIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: transactions.id,
      name: transactions.name,
      counterpartyName: transactions.counterpartyName,
      description: transactions.description,
      merchantName: transactions.merchantName,
    })
    .from(transactions)
    .leftJoin(
      transactionEmbeddings,
      eq(transactionEmbeddings.transactionId, transactions.id),
    )
    .where(
      and(
        inArray(transactions.id, params.transactionIds),
        eq(transactions.teamId, params.teamId),
        isNull(transactionEmbeddings.id), // Only transactions without embeddings
      ),
    );
}

export type CreateTransactionEmbeddingParams = {
  transactionId: string;
  teamId: string;
  embedding: number[];
  sourceText: string;
  model: string;
};

export async function createTransactionEmbeddings(
  db: Database,
  params: CreateTransactionEmbeddingParams[],
) {
  if (params.length === 0) {
    return [];
  }

  return db.insert(transactionEmbeddings).values(params).returning({
    id: transactionEmbeddings.id,
    transactionId: transactionEmbeddings.transactionId,
  });
}

export type CheckTransactionEmbeddingExistsParams = {
  transactionId: string;
};

export async function checkTransactionEmbeddingExists(
  db: Database,
  params: CheckTransactionEmbeddingExistsParams,
) {
  const result = await db
    .select({ id: transactionEmbeddings.id })
    .from(transactionEmbeddings)
    .where(eq(transactionEmbeddings.transactionId, params.transactionId))
    .limit(1);

  return result.length > 0;
}
