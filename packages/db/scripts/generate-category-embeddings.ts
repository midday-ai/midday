#!/usr/bin/env tsx

import { CATEGORIES, CategoryEmbeddings } from "@midday/categories";
import { logger } from "@midday/logger";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { transactionCategoryEmbeddings } from "../src/schema";

// Initialize the embedding service
const embedService = new CategoryEmbeddings();

async function generateSystemCategoryEmbeddings() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  logger.info("Starting system category embeddings generation...");

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Collect all category names (both parent and child categories)
    const allCategories: Array<{ name: string; system: boolean }> = [];

    // Add parent categories
    for (const parent of CATEGORIES) {
      allCategories.push({ name: parent.name, system: true });

      // Add child categories
      for (const child of parent.children) {
        allCategories.push({ name: child.name, system: true });
      }
    }

    logger.info(`Found ${allCategories.length} system categories to process`);

    for (const category of allCategories) {
      try {
        // Check if embedding already exists
        const existing = await db
          .select()
          .from(transactionCategoryEmbeddings)
          .where(eq(transactionCategoryEmbeddings.name, category.name))
          .limit(1);

        if (existing.length > 0) {
          logger.info(`Skipping "${category.name}" - embedding already exists`);
          skipped++;
          continue;
        }

        // Generate embedding using Vercel AI SDK
        const { embedding, model } = await embedService.embed(category.name);

        // Insert into database
        await db.insert(transactionCategoryEmbeddings).values({
          name: category.name,
          embedding,
          system: category.system,
          model,
        });

        logger.info(`Generated embedding for: "${category.name}"`);
        processed++;

        // Add a small delay to avoid hitting rate limits (only needed for system categories bulk generation)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Error processing "${category.name}":`, error);
        errors++;
      }
    }

    logger.info("Category embeddings generation completed!");
    logger.info("Summary:", {
      totalCategories: allCategories.length,
      processed,
      skipped,
      errors,
    });
  } catch (error) {
    logger.error("Failed to generate category embeddings:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

async function main() {
  const command = process.argv[2];

  if (command === "--help" || command === "-h") {
    logger.info("Generate Category Embeddings Script");
    logger.info("Usage: tsx generate-category-embeddings.ts [options]");
    logger.info("Options:");
    logger.info("  --help, -h     Show this help message");
    logger.info(
      "  --dry-run      Show what would be processed without making changes",
    );
    logger.info("Environment Variables:");
    logger.info("  DATABASE_URL   PostgreSQL connection string (required)");
    logger.info("Examples:");
    logger.info("  tsx generate-category-embeddings.ts");
    logger.info("  tsx generate-category-embeddings.ts --dry-run");
    return;
  }

  if (command === "--dry-run") {
    logger.info("DRY RUN - Showing what would be processed:");

    let totalCategories = 0;
    for (const parent of CATEGORIES) {
      logger.info(`${parent.name} (parent)`);
      totalCategories++;

      for (const child of parent.children) {
        logger.info(`  ${child.name} (child)`);
        totalCategories++;
      }
    }

    logger.info(`Total categories that would be processed: ${totalCategories}`);
    logger.info("To run for real, execute without --dry-run flag");
    return;
  }

  await generateSystemCategoryEmbeddings();
}

main().catch((error) => {
  logger.error("Script failed:", error);
  process.exit(1);
});
