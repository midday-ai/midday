#!/usr/bin/env tsx

import { CategoryEmbeddings } from "@midday/categories";
import { logger } from "@midday/logger";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  transactionCategories,
  transactionCategoryEmbeddings,
} from "../src/schema";

// Initialize the embedding service
const embedService = new CategoryEmbeddings();

async function generateUserCategoryEmbeddings(dryRun = false) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  logger.info("Starting user category embeddings generation...");
  if (dryRun) {
    logger.info("DRY RUN MODE - No changes will be made");
  }

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get all non-system categories (user-created categories)
    const userCategories = await db
      .select({
        name: transactionCategories.name,
      })
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.system, false),
          isNull(transactionCategories.parentId), // Only get parent categories for now
        ),
      )
      .groupBy(transactionCategories.name); // Group by name to avoid duplicates across teams

    logger.info(
      `Found ${userCategories.length} unique user categories to check`,
    );

    if (userCategories.length === 0) {
      logger.info("No user categories found. Exiting.");
      return;
    }

    // Get category names that already have embeddings
    const categoryNames = userCategories.map((cat) => cat.name);
    const existingEmbeddings = await db
      .select({ name: transactionCategoryEmbeddings.name })
      .from(transactionCategoryEmbeddings)
      .where(inArray(transactionCategoryEmbeddings.name, categoryNames));

    const existingNames = new Set(existingEmbeddings.map((e) => e.name));
    const categoriesToProcess = userCategories.filter(
      (cat) => !existingNames.has(cat.name),
    );

    logger.info(`Categories with existing embeddings: ${existingNames.size}`);
    logger.info(`Categories needing embeddings: ${categoriesToProcess.length}`);

    if (categoriesToProcess.length === 0) {
      logger.info(
        "All user categories already have embeddings. Nothing to do.",
      );
      return;
    }

    if (dryRun) {
      logger.info("Categories that would have embeddings generated:");
      for (const category of categoriesToProcess) {
        logger.info(`  - ${category.name}`);
      }
      logger.info(`Total: ${categoriesToProcess.length} categories`);
      return;
    }

    // Process categories in batches to avoid overwhelming the API
    const BATCH_SIZE = 50;
    for (let i = 0; i < categoriesToProcess.length; i += BATCH_SIZE) {
      const batch = categoriesToProcess.slice(i, i + BATCH_SIZE);

      logger.info(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(categoriesToProcess.length / BATCH_SIZE)}`,
      );

      for (const category of batch) {
        try {
          // Double-check that embedding doesn't exist (race condition protection)
          const existing = await db
            .select()
            .from(transactionCategoryEmbeddings)
            .where(eq(transactionCategoryEmbeddings.name, category.name))
            .limit(1);

          if (existing.length > 0) {
            logger.info(
              `Skipping "${category.name}" - embedding already exists`,
            );
            skipped++;
            continue;
          }

          // Generate embedding using Vercel AI SDK
          const { embedding, model } = await embedService.embed(category.name);

          // Insert into database
          await db.insert(transactionCategoryEmbeddings).values({
            name: category.name,
            embedding,
            system: false, // User-created category
            model,
          });

          logger.info(`Generated embedding for: "${category.name}"`);
          processed++;

          // Small delay to be respectful to the API
          await new Promise((resolve) => setTimeout(resolve, 250));
        } catch (error) {
          logger.error(`Error processing "${category.name}":`, error);
          errors++;
        }
      }

      // Longer delay between batches
      if (i + BATCH_SIZE < categoriesToProcess.length) {
        logger.info("Waiting 2 seconds before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    logger.info("User category embeddings generation completed!");
    logger.info("Summary:", {
      totalUserCategories: userCategories.length,
      categoriesWithExistingEmbeddings: existingNames.size,
      categoriesProcessed: processed,
      categoriesSkipped: skipped,
      errors,
    });
  } catch (error) {
    logger.error("Failed to generate user category embeddings:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

async function main() {
  const command = process.argv[2];

  if (command === "--help" || command === "-h") {
    logger.info("Generate User Category Embeddings Script");
    logger.info(
      "This script generates embeddings for user-created (non-system) categories",
    );
    logger.info(
      "that don't already have embeddings in the category_embeddings table.",
    );
    logger.info("");
    logger.info("Usage: tsx generate-user-category-embeddings.ts [options]");
    logger.info("Options:");
    logger.info("  --help, -h     Show this help message");
    logger.info(
      "  --dry-run      Show what would be processed without making changes",
    );
    logger.info("");
    logger.info("Environment Variables:");
    logger.info("  DATABASE_URL   PostgreSQL connection string (required)");
    logger.info("");
    logger.info("Examples:");
    logger.info("  tsx generate-user-category-embeddings.ts");
    logger.info("  tsx generate-user-category-embeddings.ts --dry-run");
    return;
  }

  const dryRun = command === "--dry-run";
  await generateUserCategoryEmbeddings(dryRun);
}

main().catch((error) => {
  logger.error("Script failed:", error);
  process.exit(1);
});
