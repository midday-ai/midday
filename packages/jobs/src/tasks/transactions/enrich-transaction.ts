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
  getTransactionsForEnrichment,
  markTransactionsAsEnriched,
  type UpdateTransactionEnrichmentParams,
  updateTransactionEnrichments,
} from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { z } from "zod";

const BATCH_SIZE = 50;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
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
    // Get transactions that need enrichment
    const transactionsToEnrich = await getTransactionsForEnrichment(getDb(), {
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
    await processBatch(
      transactionsToEnrich,
      BATCH_SIZE,
      async (batch): Promise<string[]> => {
        // Prepare transactions for LLM
        const transactionData = prepareTransactionData(batch);
        const prompt = generateEnrichmentPrompt(transactionData, batch);

        // Track transactions enriched in this batch to avoid double counting
        let batchEnrichedCount = 0;

        try {
          const { object } = await generateObject({
            model: google("gemini-2.5-flash-lite"),
            prompt,
            output: "array",
            schema: enrichmentSchema,
            temperature: 0.1, // Low temperature for consistency
          });

          // Prepare updates for batch processing
          const updates: UpdateTransactionEnrichmentParams[] = [];
          const noUpdateNeeded: string[] = [];
          let categoriesUpdated = 0;
          let skippedResults = 0;

          // With output: "array", object is the array directly
          const results = object;
          const resultsToProcess = Math.min(results.length, batch.length);

          for (let i = 0; i < resultsToProcess; i++) {
            const result = results[i];
            const transaction = batch[i];

            if (!result || !transaction) {
              skippedResults++;
              // Still mark the transaction as processed even if LLM result is invalid
              if (transaction) {
                noUpdateNeeded.push(transaction.id);
              }
              continue;
            }

            const updateData = prepareUpdateData(transaction, result);

            // Check if any updates are needed
            if (!updateData.merchantName && !updateData.categorySlug) {
              // No updates needed - mark as enriched separately
              noUpdateNeeded.push(transaction.id);
              continue;
            }

            // Track if category was updated
            if (updateData.categorySlug) {
              categoriesUpdated++;
            }

            updates.push({
              transactionId: transaction.id,
              data: updateData,
            });
          }

          // Log if we have mismatched result counts
          if (results.length !== batch.length) {
            logger.warn(
              "LLM returned different number of results than expected",
              {
                expectedCount: batch.length,
                actualCount: results.length,
                teamId,
              },
            );
          }

          // Execute all updates
          if (updates.length > 0) {
            await updateTransactionEnrichments(getDb(), updates);
            batchEnrichedCount += updates.length;
          }

          // Mark transactions that don't need updates as enriched
          if (noUpdateNeeded.length > 0) {
            await markTransactionsAsEnriched(getDb(), noUpdateNeeded);
            batchEnrichedCount += noUpdateNeeded.length;
          }

          const totalProcessed = updates.length + noUpdateNeeded.length;
          if (totalProcessed > 0) {
            logger.info("Enriched transaction batch", {
              batchSize: batch.length,
              enrichedCount: totalProcessed,
              updatesApplied: updates.length,
              noUpdateNeeded: noUpdateNeeded.length,
              merchantNamesUpdated: updates.filter(
                (update) => update.data.merchantName,
              ).length,
              categoriesUpdated,
              skippedResults,
              teamId,
            });
          }

          // Ensure ALL transactions in the batch are marked as enrichment completed
          // This is critical for UI loading states - enrichment_completed indicates the process finished, not success
          const processedIds = new Set([
            ...updates.map((u) => u.transactionId),
            ...noUpdateNeeded,
          ]);

          const unprocessedTransactions = batch.filter(
            (tx) => !processedIds.has(tx.id),
          );

          // Mark ANY remaining unprocessed transactions as enriched (process completed, even if no data found)
          if (unprocessedTransactions.length > 0) {
            await markTransactionsAsEnriched(
              getDb(),
              unprocessedTransactions.map((tx) => tx.id),
            );
            batchEnrichedCount += unprocessedTransactions.length;

            logger.info(
              "Marked remaining unprocessed transactions as completed",
              {
                count: unprocessedTransactions.length,
                reason: "enrichment_process_finished",
                teamId,
              },
            );
          }

          // Add the actual count of enriched transactions from this batch
          totalEnriched += batchEnrichedCount;

          // Return ALL transaction IDs from the batch (all should now be marked as enriched)
          // Defensive handling for potentially falsy transactions
          return batch.filter((tx) => tx?.id).map((tx) => tx.id);
        } catch (error) {
          logger.error("Failed to enrich transaction batch", {
            error: error instanceof Error ? error.message : "Unknown error",
            batchSize: batch.length,
            teamId,
          });

          // Even if enrichment fails, mark all transactions as completed to prevent infinite loading
          // The enrichment_completed field indicates process completion, not success
          try {
            // Defensive handling for potentially falsy transactions
            const validTransactionIds = batch
              .filter((tx) => tx?.id)
              .map((tx) => tx.id);

            await markTransactionsAsEnriched(getDb(), validTransactionIds);

            logger.info(
              "Marked failed batch transactions as completed to prevent infinite loading",
              {
                count: validTransactionIds.length,
                reason: "enrichment_process_failed_but_completed",
                teamId,
              },
            );

            // Only add transactions that weren't already counted in batchEnrichedCount
            // If batchEnrichedCount > 0, some transactions were already processed and counted
            const uncountedTransactions =
              validTransactionIds.length - batchEnrichedCount;
            if (uncountedTransactions > 0) {
              totalEnriched += uncountedTransactions;
            }

            // Return the valid transaction IDs even though enrichment failed
            return validTransactionIds;
          } catch (markError) {
            logger.error(
              "Failed to mark transactions as completed after enrichment error",
              {
                markError:
                  markError instanceof Error
                    ? markError.message
                    : "Unknown error",
                originalError:
                  error instanceof Error ? error.message : "Unknown error",
                batchSize: batch.length,
                teamId,
              },
            );
            throw error; // Re-throw original error
          }
        }
      },
    );

    logger.info("Transaction enrichment completed", {
      totalEnriched,
      teamId,
    });

    return { enrichedCount: totalEnriched, teamId };
  },
});
