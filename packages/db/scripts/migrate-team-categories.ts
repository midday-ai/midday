#!/usr/bin/env tsx

import { CATEGORIES } from "@midday/categories";
import {
  getTaxRateForCategory,
  getTaxTypeForCountry,
} from "@midday/categories";
import type { Database } from "@midday/db/client";
import { getTeamById } from "@midday/db/queries";
import { transactionCategories } from "@midday/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Migration function to update existing teams to the new category structure
async function migrateExistingTeamCategories(db: Database, teamId: string) {
  console.log(`🔄 Starting migration for team: ${teamId}`);

  // Wrap the entire migration in a transaction for atomicity
  return await db.transaction(async (tx) => {
    // Get team info to determine country code
    const team = await getTeamById(tx, teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const countryCode = team.countryCode;
    console.log(`📍 Team country: ${countryCode || "DEFAULT"}`);

    // Get all existing categories for this team
    const existingCategories = await tx
      .select({
        id: transactionCategories.id,
        slug: transactionCategories.slug,
        parentId: transactionCategories.parentId,
        name: transactionCategories.name,
        color: transactionCategories.color,
        taxRate: transactionCategories.taxRate,
        taxType: transactionCategories.taxType,
      })
      .from(transactionCategories)
      .where(eq(transactionCategories.teamId, teamId));

    console.log(`📊 Found ${existingCategories.length} existing categories`);

    const existingSlugs = new Set(existingCategories.map((cat) => cat.slug));
    const categoriesToInsert: Array<typeof transactionCategories.$inferInsert> =
      [];
    const categoriesToUpdate: Array<{
      id: string;
      updates: Partial<typeof transactionCategories.$inferInsert>;
    }> = [];

    // Step 1: Identify categories to insert and update
    for (const parent of CATEGORIES) {
      // Handle parent categories
      if (!existingSlugs.has(parent.slug)) {
        // Insert new parent category
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
        console.log(`➕ Will insert parent: ${parent.slug}`);
      } else {
        // Update existing parent category
        const existing = existingCategories.find(
          (cat) => cat.slug === parent.slug,
        );
        if (existing) {
          const updates: Partial<typeof transactionCategories.$inferInsert> =
            {};
          let hasChanges = false;

          // Check if updates are needed
          if (existing.color !== parent.color) {
            updates.color = parent.color;
            hasChanges = true;
          }
          if (
            existing.taxRate !==
            getTaxRateForCategory(countryCode || undefined, parent.slug)
          ) {
            updates.taxRate = getTaxRateForCategory(
              countryCode || undefined,
              parent.slug,
            );
            hasChanges = true;
          }
          if (
            existing.taxType !== getTaxTypeForCountry(countryCode || undefined)
          ) {
            updates.taxType = getTaxTypeForCountry(countryCode || undefined);
            hasChanges = true;
          }
          if (existing.parentId !== null) {
            updates.parentId = null; // Ensure parent has no parent
            hasChanges = true;
          }

          if (hasChanges) {
            categoriesToUpdate.push({
              id: existing.id,
              updates,
            });
            console.log(`🔄 Will update parent: ${parent.slug}`);
          }
        }
      }

      // Handle child categories
      for (const child of parent.children) {
        if (!existingSlugs.has(child.slug)) {
          // Insert new child category
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
            parentId: undefined, // Will be set after all categories are created
          });
          console.log(`➕ Will insert child: ${child.slug}`);
        } else {
          // Update existing child category
          const existing = existingCategories.find(
            (cat) => cat.slug === child.slug,
          );
          if (existing) {
            const updates: Partial<typeof transactionCategories.$inferInsert> =
              {};
            let hasChanges = false;

            // Check if updates are needed
            if (existing.color !== child.color) {
              updates.color = child.color;
              hasChanges = true;
            }
            if (
              existing.taxRate !==
              getTaxRateForCategory(countryCode, child.slug)
            ) {
              updates.taxRate = getTaxRateForCategory(countryCode, child.slug);
              hasChanges = true;
            }
            if (existing.taxType !== getTaxTypeForCountry(countryCode)) {
              updates.taxType = getTaxTypeForCountry(countryCode);
              hasChanges = true;
            }

            if (hasChanges) {
              categoriesToUpdate.push({
                id: existing.id,
                updates,
              });
              console.log(`🔄 Will update child: ${child.slug}`);
            }
          }
        }
      }
    }

    // Step 2: Insert new categories
    if (categoriesToInsert.length > 0) {
      console.log(
        `📝 Inserting ${categoriesToInsert.length} new categories...`,
      );
      try {
        await tx
          .insert(transactionCategories)
          .values(categoriesToInsert)
          .onConflictDoNothing(); // Ignore if already exists
        console.log(`✅ Inserted ${categoriesToInsert.length} new categories`);
      } catch (error) {
        console.error("❌ Failed to insert categories:", error);
        throw new Error(`Failed to insert categories: ${error}`);
      }
    }

    // Step 3: Update existing categories
    if (categoriesToUpdate.length > 0) {
      console.log(
        `📝 Updating ${categoriesToUpdate.length} existing categories...`,
      );
      try {
        for (const category of categoriesToUpdate) {
          await tx
            .update(transactionCategories)
            .set(category.updates)
            .where(eq(transactionCategories.id, category.id));
        }
        console.log(
          `✅ Updated ${categoriesToUpdate.length} existing categories`,
        );
      } catch (error) {
        console.error("❌ Failed to update categories:", error);
        throw new Error(`Failed to update categories: ${error}`);
      }
    }

    // Step 4: Establish parent-child relationships
    console.log("🔗 Establishing parent-child relationships...");

    // Get all categories again (including newly created ones)
    const allCategories = await tx
      .select({
        id: transactionCategories.id,
        slug: transactionCategories.slug,
        parentId: transactionCategories.parentId,
      })
      .from(transactionCategories)
      .where(eq(transactionCategories.teamId, teamId));

    // Build parent category ID map
    const parentCategoryMap = new Map();
    for (const category of allCategories) {
      const parentCategory = CATEGORIES.find((p) => p.slug === category.slug);
      if (parentCategory?.children) {
        parentCategoryMap.set(parentCategory.slug, category.id);
      }
    }

    // Update child categories with correct parentIds
    let parentChildUpdates = 0;
    try {
      for (const category of allCategories) {
        if (!category.slug) continue;

        const parentCategory = CATEGORIES.find((p) =>
          p.children.some((c) => c.slug === category.slug),
        );

        if (parentCategory?.slug) {
          const expectedParentId = parentCategoryMap.get(parentCategory.slug);

          if (expectedParentId && category.parentId !== expectedParentId) {
            await tx
              .update(transactionCategories)
              .set({ parentId: expectedParentId })
              .where(eq(transactionCategories.id, category.id));
            parentChildUpdates++;
          }
        }
      }
      console.log(
        `🔗 Updated ${parentChildUpdates} parent-child relationships`,
      );
    } catch (error) {
      console.error("❌ Failed to update parent-child relationships:", error);
      throw new Error(`Failed to update parent-child relationships: ${error}`);
    }

    // Step 5: Handle special case - ensure "uncategorized" is child of "system"
    const systemCategory = allCategories.find((cat) => cat.slug === "system");
    const uncategorizedCategory = allCategories.find(
      (cat) => cat.slug === "uncategorized",
    );

    if (
      systemCategory &&
      uncategorizedCategory &&
      uncategorizedCategory.parentId !== systemCategory.id
    ) {
      try {
        await tx
          .update(transactionCategories)
          .set({ parentId: systemCategory.id })
          .where(eq(transactionCategories.id, uncategorizedCategory.id));
        console.log("🔧 Fixed uncategorized parent relationship");
      } catch (error) {
        console.error(
          "❌ Failed to fix uncategorized parent relationship:",
          error,
        );
        throw new Error(
          `Failed to fix uncategorized parent relationship: ${error}`,
        );
      }
    }

    // Step 6: Final verification
    const finalCategories = await tx
      .select({
        id: transactionCategories.id,
        slug: transactionCategories.slug,
        parentId: transactionCategories.parentId,
      })
      .from(transactionCategories)
      .where(eq(transactionCategories.teamId, teamId));

    const finalParentCount = finalCategories.filter(
      (cat) => cat.parentId === null,
    ).length;
    const finalChildCount = finalCategories.filter(
      (cat) => cat.parentId !== null,
    ).length;

    console.log("📊 Migration complete!");
    console.log(`   - Total categories: ${finalCategories.length}`);
    console.log(`   - Parent categories: ${finalParentCount}`);
    console.log(`   - Child categories: ${finalChildCount}`);

    return {
      totalCategories: finalCategories.length,
      parentCategories: finalParentCount,
      childCategories: finalChildCount,
      inserted: categoriesToInsert.length,
      updated: categoriesToUpdate.length,
      parentChildUpdates,
    };
  }); // End transaction
}

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function main() {
  const teamId = process.argv[2];

  if (!teamId) {
    console.error("❌ Usage: npm run migrate-team-categories <team-id>");
    console.error(
      "   Example: npm run migrate-team-categories 123e4567-e89b-12d3-a456-426614174000",
    );
    process.exit(1);
  }

  try {
    console.log(`🚀 Starting category migration for team: ${teamId}`);

    // @ts-expect-error
    const result = await migrateExistingTeamCategories(db, teamId);

    console.log("\n✅ Migration completed successfully!");
    console.log("📊 Summary:");
    console.log(`   - Total categories: ${result.totalCategories}`);
    console.log(`   - Parent categories: ${result.parentCategories}`);
    console.log(`   - Child categories: ${result.childCategories}`);
    console.log(`   - New categories inserted: ${result.inserted}`);
    console.log(`   - Existing categories updated: ${result.updated}`);
    console.log(
      `   - Parent-child relationships updated: ${result.parentChildUpdates}`,
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error(
      "🔄 All changes have been rolled back due to transaction failure",
    );
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main().catch(console.error);
