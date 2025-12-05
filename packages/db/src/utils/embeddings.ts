import { CategoryEmbeddings } from "@midday/categories";
import { logger } from "@midday/logger";
import { eq, inArray } from "drizzle-orm";
import type { Database } from "../client";
import { upsertCategoryEmbedding } from "../queries/transaction-category-embeddings";
import { transactionCategoryEmbeddings } from "../schema";

export type GenerateCategoryEmbeddingParams = {
  name: string;
  system?: boolean;
  model?: string;
};

/**
 * Generate and store an embedding for a category name
 * This function is idempotent - it won't regenerate if an embedding already exists
 */
export async function generateCategoryEmbedding(
  db: Database,
  params: GenerateCategoryEmbeddingParams,
) {
  const { name, system = false, model } = params;

  try {
    // First check if embedding already exists
    const existingEmbedding = await db
      .select({ name: transactionCategoryEmbeddings.name })
      .from(transactionCategoryEmbeddings)
      .where(eq(transactionCategoryEmbeddings.name, name))
      .limit(1);

    if (existingEmbedding.length > 0) {
      logger.info(`Embedding already exists for category: "${name}"`);
      return { success: true, existed: true };
    }

    const embedService = new CategoryEmbeddings();

    // Generate the embedding using Vercel AI SDK
    const { embedding, model: embeddingModel } = await embedService.embed(name);

    // Upsert the embedding (create or update)
    await upsertCategoryEmbedding(db, {
      name,
      embedding,
      system,
      model: model || embeddingModel,
    });

    logger.info(`Generated embedding for category: "${name}"`);
    return { success: true, existed: false };
  } catch (error) {
    logger.error(`Failed to generate embedding for "${name}":`, { error });
    return {
      success: false,
      existed: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate embeddings for multiple categories in batch
 * Simple batch processing for user-created categories (typically just a few)
 */
export async function generateCategoryEmbeddingsBatch(
  db: Database,
  categories: Array<{ name: string; system?: boolean }>,
  model?: string,
) {
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  const results: Array<{ name: string; success: boolean; error?: string }> = [];

  try {
    // First, check which embeddings already exist
    const categoryNames = categories.map((cat) => cat.name);
    const existingEmbeddings =
      categoryNames.length > 0
        ? await db
            .select({ name: transactionCategoryEmbeddings.name })
            .from(transactionCategoryEmbeddings)
            .where(inArray(transactionCategoryEmbeddings.name, categoryNames))
        : [];

    // Use a more efficient IN query for multiple categories
    const existingNames = new Set(existingEmbeddings.map((e) => e.name));
    const categoriesToProcess = categories.filter(
      (cat) => !existingNames.has(cat.name),
    );

    // Log skipped categories
    for (const cat of categories) {
      if (existingNames.has(cat.name)) {
        logger.info(`Embedding already exists for category: "${cat.name}"`);
        results.push({ name: cat.name, success: true });
        skipped++;
      }
    }

    if (categoriesToProcess.length === 0) {
      return { processed: 0, skipped, errors: 0, results };
    }

    const embedService = new CategoryEmbeddings();
    const newCategoryNames = categoriesToProcess.map((cat) => cat.name);

    // Generate all embeddings at once using the batch API
    const { embeddings, model: embeddingModel } =
      await embedService.embedMany(newCategoryNames);

    // Store all embeddings in parallel
    const promises = categoriesToProcess.map(async (category, index) => {
      try {
        const embedding = embeddings[index];
        if (!embedding) {
          throw new Error(
            `No embedding generated for category: ${category.name}`,
          );
        }

        await upsertCategoryEmbedding(db, {
          name: category.name,
          embedding,
          system: category.system ?? false,
          model: model || embeddingModel,
        });

        logger.info(`Generated embedding for category: "${category.name}"`);
        return {
          name: category.name,
          success: true,
        };
      } catch (error) {
        logger.error("Failed to store embedding for category", {
          name: category.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        return {
          name: category.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const batchResults = await Promise.allSettled(promises);

    for (const promiseResult of batchResults) {
      if (promiseResult.status === "fulfilled") {
        const result = promiseResult.value;
        results.push(result);

        if (result.success) {
          processed++;
        } else {
          errors++;
        }
      } else {
        // Handle promise rejection
        results.push({
          name: "unknown",
          success: false,
          error: promiseResult.reason?.message || "Promise rejected",
        });
        errors++;
      }
    }
  } catch (error) {
    // Handle batch embedding generation failure
    logger.error("Failed to generate batch embeddings:", { error });

    // Fall back to individual processing
    const promises = categories.map(async (category) => {
      const result = await generateCategoryEmbedding(db, {
        name: category.name,
        system: category.system ?? false,
        model,
      });

      return {
        name: category.name,
        success: result.success,
        error: result.error,
      };
    });

    const fallbackResults = await Promise.allSettled(promises);

    for (const promiseResult of fallbackResults) {
      if (promiseResult.status === "fulfilled") {
        const result = promiseResult.value;
        results.push(result);

        if (result.success) {
          processed++;
        } else {
          errors++;
        }
      } else {
        results.push({
          name: "unknown",
          success: false,
          error: promiseResult.reason?.message || "Promise rejected",
        });
        errors++;
      }
    }
  }

  return { processed, skipped, errors, results };
}
