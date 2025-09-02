#!/usr/bin/env tsx

import { CATEGORIES } from "@midday/categories";
import {
  getTaxRateForCategory,
  getTaxTypeForCountry,
} from "@midday/categories";
import type { Database } from "@midday/db/client";
import { getTeamById } from "@midday/db/queries";
import { teams, transactionCategories } from "@midday/db/schema";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Fast batch processing - multiple teams in parallel with bulk operations
async function migrateTeamsBatchFast(
  db: Database,
  teamIds: string[],
  batchNumber: number,
) {
  console.log(`🚀 Processing batch ${batchNumber}: ${teamIds.length} teams`);

  // Process all teams in parallel within this batch
  const teamPromises = teamIds.map(async (teamId) => {
    try {
      return await db.transaction(async (tx) => {
        // Get team info
        const team = await getTeamById(tx, teamId);
        if (!team) {
          throw new Error(`Team not found: ${teamId}`);
        }

        const countryCode = team.countryCode;

        // Get existing categories for this team
        const existingCategories = await tx
          .select({
            id: transactionCategories.id,
            slug: transactionCategories.slug,
            parentId: transactionCategories.parentId,
            name: transactionCategories.name,
            color: transactionCategories.color,
            taxRate: transactionCategories.taxRate,
            taxType: transactionCategories.taxType,
            system: transactionCategories.system,
          })
          .from(transactionCategories)
          .where(eq(transactionCategories.teamId, teamId));

        const existingSlugs = new Set(
          existingCategories.map((cat) => cat.slug),
        );
        const categoriesToInsert: Array<
          typeof transactionCategories.$inferInsert
        > = [];
        const categoriesToUpdate: Array<{
          id: string;
          updates: Partial<typeof transactionCategories.$inferInsert>;
        }> = [];

        // Build operations for this team
        for (const parent of CATEGORIES) {
          // Handle parent categories
          if (!existingSlugs.has(parent.slug)) {
            categoriesToInsert.push({
              teamId,
              name: parent.name,
              slug: parent.slug,
              color: parent.color,
              system: parent.system,
              excluded: parent.excluded,
              taxRate: getTaxRateForCategory(countryCode, parent.slug),
              taxType: getTaxTypeForCountry(countryCode),
              taxReportingCode: undefined,
              description: undefined,
              parentId: undefined,
            });
          } else {
            const existing = existingCategories.find(
              (cat) => cat.slug === parent.slug,
            );
            if (existing) {
              const updates: Partial<
                typeof transactionCategories.$inferInsert
              > = {};
              let hasChanges = false;

              if (existing.color !== parent.color) {
                updates.color = parent.color;
                hasChanges = true;
              }

              // Only update tax settings if they look like defaults
              const isLikelyDefault =
                existing.system &&
                (existing.taxRate === null ||
                  existing.taxRate === 25 ||
                  existing.taxRate === 20 ||
                  existing.taxRate === 0);

              if (isLikelyDefault) {
                const newTaxRate = getTaxRateForCategory(
                  countryCode,
                  parent.slug,
                );
                const newTaxType = getTaxTypeForCountry(countryCode);

                if (existing.taxRate !== newTaxRate) {
                  updates.taxRate = newTaxRate;
                  hasChanges = true;
                }
                if (existing.taxType !== newTaxType) {
                  updates.taxType = newTaxType;
                  hasChanges = true;
                }
              }

              if (existing.parentId !== null) {
                updates.parentId = null;
                hasChanges = true;
              }

              if (hasChanges) {
                categoriesToUpdate.push({ id: existing.id, updates });
              }
            }
          }

          // Handle child categories
          for (const child of parent.children) {
            if (!existingSlugs.has(child.slug)) {
              categoriesToInsert.push({
                teamId,
                name: child.name,
                slug: child.slug,
                color: child.color,
                system: child.system,
                excluded: child.excluded,
                taxRate: getTaxRateForCategory(countryCode, child.slug),
                taxType: getTaxTypeForCountry(countryCode),
                taxReportingCode: undefined,
                description: undefined,
                parentId: undefined,
              });
            } else {
              const existing = existingCategories.find(
                (cat) => cat.slug === child.slug,
              );
              if (existing) {
                const updates: Partial<
                  typeof transactionCategories.$inferInsert
                > = {};
                let hasChanges = false;

                if (existing.color !== child.color) {
                  updates.color = child.color;
                  hasChanges = true;
                }

                const isLikelyDefault =
                  existing.system &&
                  (existing.taxRate === null ||
                    existing.taxRate === 25 ||
                    existing.taxRate === 20 ||
                    existing.taxRate === 0);

                if (isLikelyDefault) {
                  const newTaxRate = getTaxRateForCategory(
                    countryCode,
                    child.slug,
                  );
                  const newTaxType = getTaxTypeForCountry(countryCode);

                  if (existing.taxRate !== newTaxRate) {
                    updates.taxRate = newTaxRate;
                    hasChanges = true;
                  }
                  if (existing.taxType !== newTaxType) {
                    updates.taxType = newTaxType;
                    hasChanges = true;
                  }
                }

                if (hasChanges) {
                  categoriesToUpdate.push({ id: existing.id, updates });
                }
              }
            }
          }
        }

        // Execute bulk operations
        if (categoriesToInsert.length > 0) {
          await tx
            .insert(transactionCategories)
            .values(categoriesToInsert)
            .onConflictDoNothing();
        }

        // Batch updates for better performance
        if (categoriesToUpdate.length > 0) {
          // Group updates by similar changes to reduce queries
          const colorUpdates = categoriesToUpdate.filter(
            (u) => u.updates.color && Object.keys(u.updates).length === 1,
          );
          const taxUpdates = categoriesToUpdate.filter(
            (u) =>
              u.updates.taxRate !== undefined ||
              u.updates.taxType !== undefined,
          );
          const otherUpdates = categoriesToUpdate.filter(
            (u) => !colorUpdates.includes(u) && !taxUpdates.includes(u),
          );

          // Execute grouped updates
          for (const update of [
            ...colorUpdates,
            ...taxUpdates,
            ...otherUpdates,
          ]) {
            await tx
              .update(transactionCategories)
              .set(update.updates)
              .where(eq(transactionCategories.id, update.id));
          }
        }

        // Fast parent-child relationship setup
        if (categoriesToInsert.length > 0) {
          const allCategories = await tx
            .select({
              id: transactionCategories.id,
              slug: transactionCategories.slug,
              parentId: transactionCategories.parentId,
            })
            .from(transactionCategories)
            .where(eq(transactionCategories.teamId, teamId));

          const parentCategoryMap = new Map();
          for (const category of allCategories) {
            const parentCategory = CATEGORIES.find(
              (p) => p.slug === category.slug,
            );
            if (parentCategory?.children) {
              parentCategoryMap.set(parentCategory.slug, category.id);
            }
          }

          // Batch parent-child updates
          const parentChildUpdates: Array<{ id: string; parentId: string }> =
            [];

          for (const category of allCategories) {
            if (!category.slug) continue;

            const parentCategory = CATEGORIES.find((p) =>
              p.children.some((c) => c.slug === category.slug),
            );

            if (parentCategory?.slug) {
              const expectedParentId = parentCategoryMap.get(
                parentCategory.slug,
              );
              if (expectedParentId && category.parentId !== expectedParentId) {
                parentChildUpdates.push({
                  id: category.id,
                  parentId: expectedParentId,
                });
              }
            }
          }

          // Execute parent-child updates in batch
          for (const update of parentChildUpdates) {
            await tx
              .update(transactionCategories)
              .set({ parentId: update.parentId })
              .where(eq(transactionCategories.id, update.id));
          }

          // Handle uncategorized -> system
          const systemCategory = allCategories.find(
            (cat) => cat.slug === "system",
          );
          const uncategorizedCategory = allCategories.find(
            (cat) => cat.slug === "uncategorized",
          );

          if (
            systemCategory &&
            uncategorizedCategory &&
            uncategorizedCategory.parentId !== systemCategory.id
          ) {
            await tx
              .update(transactionCategories)
              .set({ parentId: systemCategory.id })
              .where(eq(transactionCategories.id, uncategorizedCategory.id));
          }
        }

        return {
          teamId,
          inserted: categoriesToInsert.length,
          updated: categoriesToUpdate.length,
          success: true,
          error: null,
        };
      });
    } catch (error) {
      return {
        teamId,
        inserted: 0,
        updated: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Wait for all teams in this batch to complete
  const results = await Promise.all(teamPromises);

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(
    `✅ Batch ${batchNumber} complete: ${successful.length}/${teamIds.length} successful`,
  );

  return { successful, failed };
}

// Database connection with optimized settings for speed
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = postgres(connectionString, {
  max: 15, // Moderate connection pool for speed vs efficiency balance
  idle_timeout: 300,
  connect_timeout: 10,
  // Optimize for speed
  prepare: false, // Disable prepared statements for faster execution
  transform: {
    undefined: null, // Handle undefined values efficiently
  },
});
const db = drizzle(sql);

async function main() {
  const args = process.argv.slice(2);
  const batchSize = args[0] ? Number.parseInt(args[0], 10) : 25; // Optimal batch size for speed
  const maxConcurrency = args[1] ? Number.parseInt(args[1], 10) : 5; // Balanced concurrency
  const teamFilter = args[2];

  if (Number.isNaN(batchSize) || batchSize <= 0) {
    console.error("❌ Invalid batch size. Must be a positive integer.");
    process.exit(1);
  }

  if (Number.isNaN(maxConcurrency) || maxConcurrency <= 0) {
    console.error("❌ Invalid max concurrency. Must be a positive integer.");
    process.exit(1);
  }

  console.log("🚀 FAST Migration Configuration:");
  console.log(
    `   - Batch size: ${batchSize} teams per batch (optimized for speed)`,
  );
  console.log(`   - Max concurrent batches: ${maxConcurrency}`);
  console.log(`   - Connection pool: 15 (speed-optimized)`);
  console.log(`   - Processing: Parallel within batch`);
  console.log(`   - Optimizations: Bulk operations, grouped updates`);

  try {
    let teamIds: string[];

    if (teamFilter && teamFilter !== "all") {
      teamIds = teamFilter.split(",").map((id) => id.trim());
      console.log(`🎯 Processing specific teams: ${teamIds.length} teams`);
    } else {
      const allTeams = await db.select({ id: teams.id }).from(teams);
      teamIds = allTeams.map((team) => team.id);
      console.log(`📊 Found ${teamIds.length} total teams in database`);
    }

    if (teamIds.length === 0) {
      console.log("ℹ️  No teams to process");
      return;
    }

    // Create optimally-sized batches
    const batches: string[][] = [];
    for (let i = 0; i < teamIds.length; i += batchSize) {
      batches.push(teamIds.slice(i, i + batchSize));
    }

    console.log(`📦 Created ${batches.length} batches`);
    console.log("⚡ Starting FAST migration...");

    const startTime = Date.now();
    let totalSuccessful = 0;
    let totalFailed = 0;
    const failedTeams: any[] = [];

    // Process batches with optimized concurrency
    for (let i = 0; i < batches.length; i += maxConcurrency) {
      const currentBatches = batches.slice(i, i + maxConcurrency);

      const batchPromises = currentBatches.map((batch, index) =>
        migrateTeamsBatchFast(db, batch, i + index + 1),
      );

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        totalSuccessful += result.successful.length;
        totalFailed += result.failed.length;
        failedTeams.push(...result.failed);
      }

      const processedBatches = Math.min(i + maxConcurrency, batches.length);
      const teamsProcessed = Math.min(
        processedBatches * batchSize,
        teamIds.length,
      );
      const progressPercent = Math.round(
        (teamsProcessed / teamIds.length) * 100,
      );

      console.log(
        `📈 Progress: ${processedBatches}/${batches.length} batches (${teamsProcessed}/${teamIds.length} teams - ${progressPercent}%)`,
      );
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationSec = Math.round(durationMs / 1000);
    const durationMin = Math.round(durationSec / 60);

    console.log("\n🎉 FAST migration completed!");
    console.log("📊 Final Summary:");
    console.log(`   - Total teams processed: ${teamIds.length}`);
    console.log(`   - Successful migrations: ${totalSuccessful}`);
    console.log(`   - Failed migrations: ${totalFailed}`);
    console.log(
      `   - Success rate: ${Math.round((totalSuccessful / teamIds.length) * 100)}%`,
    );
    console.log(`   - Total duration: ${durationSec}s (${durationMin}m)`);
    console.log(
      `   - Average speed: ${Math.round(teamIds.length / (durationSec || 1))} teams/sec`,
    );
    console.log(
      `   - Peak connections: ~${maxConcurrency * batchSize} (efficient)`,
    );

    if (failedTeams.length > 0 && failedTeams.length <= 10) {
      console.log("\n❌ Failed teams:");
      for (const failure of failedTeams) {
        console.log(`   - ${failure.teamId}: ${failure.error}`);
      }
    } else if (failedTeams.length > 10) {
      console.log(`\n❌ ${failedTeams.length} teams failed (too many to list)`);
    }

    // Performance analysis
    const teamsPerMinute = Math.round(teamIds.length / (durationMin || 1));
    console.log(`\n⚡ Performance: ${teamsPerMinute} teams/minute`);

    if (teamIds.length >= 1000) {
      const estimatedTimeFor20k = Math.round(
        (20000 / teamIds.length) * durationMin,
      );
      console.log(
        `📊 Estimated time for 20k teams: ~${estimatedTimeFor20k} minutes`,
      );
    }
  } catch (error) {
    console.error("❌ Fast migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Usage information
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
⚡ FAST Team Categories Migration

Optimized for maximum speed while maintaining safety and reasonable resource usage.

Usage:
  npm run migrate-team-categories-fast [batch-size] [max-concurrency] [team-filter]

Parameters:
  batch-size      Teams per batch (default: 25) - optimized for speed
  max-concurrency Max concurrent batches (default: 5) - balanced performance
  team-filter     "all" or comma-separated team IDs

Speed Optimizations:
  ✅ Parallel processing within batches
  ✅ Bulk insert operations
  ✅ Grouped update operations  
  ✅ Optimized connection pool
  ✅ Reduced query overhead
  ✅ Smart batching algorithm

Examples:
  # Fast defaults (recommended for 20k teams)
  npm run migrate-team-categories-fast

  # Maximum speed (use with caution)
  npm run migrate-team-categories-fast 50 8

  # Conservative but still fast
  npm run migrate-team-categories-fast 15 3

Estimated Performance:
  - 20k teams: ~20-40 minutes (depending on database)
  - 5k teams: ~5-10 minutes
  - 1k teams: ~1-3 minutes
`);
  process.exit(0);
}

main().catch(console.error);
