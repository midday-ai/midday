import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getDb } from "@jobs/init";
import {
  generateEnrichmentPrompt,
  prepareTransactionData,
  prepareUpdateData,
} from "@jobs/utils/enrichment-helpers";
import { enrichmentSchema } from "@jobs/utils/enrichment-schema";
import { processBatch } from "@jobs/utils/process-batch";
import {
  type UpdateTransactionEnrichmentParams,
  getTransactionsForEnrichment,
  updateTransactionEnrichments,
} from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { z } from "zod";

const BATCH_SIZE = 50;
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

const google = createGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
});

export const enrichTransactions = schemaTask({
  id: "enrich-transactions",
  schema: z.object({
    transactionIds: z.array(z.string().uuid()),
    teamId: z.string().uuid(),
  }),
  machine: "micro",
  maxDuration: 300, // 5 minutes for batch processing
  queue: {
    concurrencyLimit: 2, // Lower to manage API costs
  },
  run: async ({ transactionIds, teamId }) => {
    const db = getDb();

    // Get transactions that need enrichment
    const transactionsToEnrich = await getTransactionsForEnrichment(db, {
      transactionIds,
      teamId,
    });

    if (transactionsToEnrich.length === 0) {
      logger.info("No transactions need enrichment", { teamId });
      return { enrichedCount: 0, teamId };
    }

    logger.info("Starting transaction enrichment", {
      teamId,
      transactionCount: transactionsToEnrich.length,
    });

    let totalEnriched = 0;

    // Process in batches of 50
    await processBatch(transactionsToEnrich, BATCH_SIZE, async (batch) => {
      // Prepare transactions for LLM
      const transactionData = prepareTransactionData(batch);
      const prompt = generateEnrichmentPrompt(transactionData);

      try {
        const { object } = await generateObject({
          model: google("gemini-2.5-flash-lite"),
          prompt,
          schema: enrichmentSchema,
          temperature: 0.1, // Low temperature for consistency
        });

        // Prepare updates for batch processing
        const updates: UpdateTransactionEnrichmentParams[] = [];
        let categoriesUpdated = 0;

        for (const result of object.results) {
          const transaction = batch[result.index - 1];
          if (transaction) {
            const updateData = prepareUpdateData(transaction, result);

            // Track if category was updated
            if (updateData.categorySlug) {
              categoriesUpdated++;
            }

            updates.push({
              transactionId: transaction.id,
              data: updateData,
            });
          }
        }

        // Execute all updates
        if (updates.length > 0) {
          await updateTransactionEnrichments(db, updates);
          totalEnriched += updates.length;

          logger.info("Enriched transaction batch", {
            batchSize: batch.length,
            enrichedCount: updates.length,
            merchantNamesUpdated: updates.length,
            categoriesUpdated,
            teamId,
          });
        }
      } catch (error) {
        logger.error("Failed to enrich transaction batch", {
          error: error instanceof Error ? error.message : "Unknown error",
          batchSize: batch.length,
          teamId,
        });
        throw error;
      }
    });

    logger.info("Transaction enrichment completed", {
      totalEnriched,
      teamId,
    });

    return { enrichedCount: totalEnriched, teamId };
  },
});
