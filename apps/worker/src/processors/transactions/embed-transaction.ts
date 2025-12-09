import {
  type CreateTransactionEmbeddingParams,
  createTransactionEmbeddings,
  getTransactionsForEmbedding,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import type { EmbedTransactionPayload } from "../../schemas/transactions";
import { getDb } from "../../utils/db";
import { generateEmbeddings } from "../../utils/embeddings";
import { processBatch } from "../../utils/process-batch";
import { prepareTransactionText } from "../../utils/text-preparation";
import { BaseProcessor } from "../base";

const BATCH_SIZE = 50;

/**
 * Creates transaction embeddings for search/matching
 * First attempts to enrich transactions, then creates embeddings
 */
export class EmbedTransactionProcessor extends BaseProcessor<EmbedTransactionPayload> {
  async process(job: Job<EmbedTransactionPayload>): Promise<void> {
    const { transactionIds, teamId } = job.data;
    const db = getDb();

    this.logger.info("Starting embed-transaction job", {
      jobId: job.id,
      teamId,
      transactionCount: transactionIds.length,
    });

    // Step 1: Attempt to enrich transactions first (non-blocking)
    try {
      this.logger.info("Triggering transaction enrichment", {
        jobId: job.id,
        teamId,
        transactionCount: transactionIds.length,
      });

      await triggerJob(
        "enrich-transactions",
        {
          transactionIds,
          teamId,
        },
        "transactions",
      );

      this.logger.info("Transaction enrichment triggered successfully", {
        teamId,
      });
    } catch (error) {
      this.logger.warn(
        "Transaction enrichment failed, proceeding with embedding anyway",
        {
          teamId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }

    // Step 2: Get transactions that need embedding
    const transactionsToEmbed = await getTransactionsForEmbedding(db, {
      transactionIds,
      teamId,
    });

    if (transactionsToEmbed.length === 0) {
      this.logger.info("No transactions need embedding", {
        teamId,
        requestedCount: transactionIds.length,
      });
      return;
    }

    this.logger.info("Starting transaction embedding", {
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
        this.logger.warn("No valid text content in batch", {
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

      this.logger.info("Transaction embeddings batch created", {
        batchSize: embeddingsToInsert.length,
        teamId,
      });

      return result;
    });

    this.logger.info("All transaction embeddings created", {
      totalCount: transactionsToEmbed.length,
      teamId,
    });
  }
}
