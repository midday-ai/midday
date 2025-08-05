import { getDb } from "@jobs/init";
import { generateEmbeddings } from "@jobs/utils/embeddings";
import { processBatch } from "@jobs/utils/process-batch";
import { prepareTransactionText } from "@jobs/utils/text-preparation";
import {
  type CreateTransactionEmbeddingParams,
  createTransactionEmbeddings,
  getTransactionsForEmbedding,
} from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { enrichTransactions } from "./enrich-transaction";

const BATCH_SIZE = 50;

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
    // Step 1: Attempt to enrich transactions first (non-blocking)
    try {
      await enrichTransactions.triggerAndWait({
        transactionIds,
        teamId,
      });
      logger.info("Transaction enrichment completed successfully", { teamId });
    } catch (error) {
      logger.warn(
        "Transaction enrichment failed, proceeding with embedding anyway",
        {
          teamId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }

    const db = getDb();

    // Step 2: Get transactions that need embedding
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

    // Process in batches using utility
    await processBatch(transactionsToEmbed, BATCH_SIZE, async (batch) => {
      const validItems = [];

      for (const tx of batch) {
        const text = prepareTransactionText(tx);
        if (text.trim().length > 0) {
          validItems.push({ transaction: tx, text });
        }
      }

      if (validItems.length === 0) {
        logger.warn("No valid text content in batch", {
          batchSize: batch.length,
          teamId,
        });
        return [];
      }

      // Extract texts and generate embeddings
      const texts = validItems.map((item) => item.text);
      const { embeddings, model } = await generateEmbeddings(texts);

      // Validate embeddings array length
      if (embeddings.length !== validItems.length) {
        throw new Error(
          `Embeddings count mismatch: expected ${validItems.length}, got ${embeddings.length}`,
        );
      }

      // Create embedding records
      const embeddingsToInsert: CreateTransactionEmbeddingParams[] =
        validItems.map((item, index: number) => {
          const embedding = embeddings[index];
          if (!embedding) {
            throw new Error(`Missing embedding at index ${index}`);
          }
          return {
            transactionId: item.transaction.id,
            teamId,
            embedding,
            sourceText: item.text,
            model,
          };
        });

      // Insert embeddings
      const result = await createTransactionEmbeddings(db, embeddingsToInsert);

      logger.info("Transaction embeddings batch created", {
        batchSize: embeddingsToInsert.length,
        teamId,
      });

      return result;
    });

    logger.info("All transaction embeddings created", {
      totalCount: transactionsToEmbed.length,
      teamId,
    });
  },
});
