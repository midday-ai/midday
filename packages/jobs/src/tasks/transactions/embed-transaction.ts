import { getDb } from "@jobs/init";
import { generateEmbeddings } from "@jobs/utils/embeddings";
import { prepareTransactionText } from "@jobs/utils/text-preparation";
import {
  type CreateTransactionEmbeddingParams,
  createTransactionEmbeddings,
  getTransactionsForEmbedding,
} from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

const BATCH_SIZE = 50;

type TransactionForEmbedding = {
  id: string;
  name: string;
  counterpartyName: string | null;
  description: string | null;
};

export const embedTransaction = schemaTask({
  id: "embed-transaction",
  schema: z.object({
    transactionIds: z.array(z.string().uuid()),
    teamId: z.string().uuid(),
  }),
  machine: "micro",
  maxDuration: 180,
  queue: {
    concurrencyLimit: 3,
  },
  run: async ({ transactionIds, teamId }) => {
    const db = getDb();

    // Get transactions that need embedding
    const transactionsToEmbed = await getTransactionsForEmbedding(db, {
      transactionIds,
      teamId,
    });

    if (transactionsToEmbed.length === 0) {
      logger.info("No transactions need embedding", {
        teamId,
        requestedCount: transactionIds.length,
      });
      return;
    }

    logger.info("Starting transaction embedding", {
      teamId,
      transactionCount: transactionsToEmbed.length,
      requestedCount: transactionIds.length,
    });

    // Process in batches
    for (let i = 0; i < transactionsToEmbed.length; i += BATCH_SIZE) {
      const batch = transactionsToEmbed.slice(i, i + BATCH_SIZE);

      try {
        // Prepare text content
        const contents = batch.map((tx: TransactionForEmbedding) =>
          prepareTransactionText(tx),
        );

        // Filter out empty texts
        const validContents = contents.filter(
          (text: string) => text.trim().length > 0,
        );
        const validTransactions = batch.filter(
          (tx: TransactionForEmbedding, index: number) =>
            contents[index].trim().length > 0,
        );

        if (validContents.length === 0) {
          logger.warn("No valid text content in batch", {
            batchSize: batch.length,
            teamId,
          });
          continue;
        }

        const { embeddings, model } = await generateEmbeddings(validContents);

        const embeddingsToInsert: CreateTransactionEmbeddingParams[] =
          validTransactions.map(
            (tx: TransactionForEmbedding, index: number) => ({
              transactionId: tx.id,
              teamId,
              embedding: embeddings[index],
              model,
            }),
          );

        // Insert embeddings
        await createTransactionEmbeddings(db, embeddingsToInsert);

        logger.info("Transaction embeddings batch created", {
          batchSize: embeddingsToInsert.length,
          teamId,
        });
      } catch (error) {
        logger.error("Transaction embedding batch failed", {
          error: error instanceof Error ? error.message : "Unknown error",
          batchSize: batch.length,
          teamId,
        });
        throw error;
      }
    }

    logger.info("All transaction embeddings created", {
      totalCount: transactionsToEmbed.length,
      teamId,
    });
  },
});
