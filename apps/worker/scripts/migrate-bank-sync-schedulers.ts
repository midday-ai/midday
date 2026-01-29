#!/usr/bin/env bun
/**
 * One-time migration script to register existing teams with the new BullMQ bank-sync scheduler.
 *
 * This script is needed after migrating from Trigger.dev to BullMQ to ensure
 * existing teams with bank connections get their daily sync schedulers registered.
 *
 * Eligibility criteria:
 * - Team has at least one bank connection
 * - Team is on 'starter' or 'pro' plan
 * - OR team is on 'trial' plan, not canceled, and created within last 30 days
 *
 * Usage:
 *   cd apps/worker
 *   bun run scripts/migrate-bank-sync-schedulers.ts
 *
 * Options:
 *   --dry-run    Show what would be done without making changes
 */

import { bankConnections, teams } from "@midday/db/schema";
import { getWorkerDb } from "@midday/db/worker-client";
import { Queue } from "bullmq";
import { subDays } from "date-fns";
import { and, eq, gte, inArray, isNull, or } from "drizzle-orm";

// Generate deterministic cron pattern based on teamId
// This distributes load across different times of day
function generateCronTag(id: string): string {
  const hash = Array.from(id).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  const minute = hash % 60;
  const hour = hash % 24;
  return `${minute} ${hour} * * *`;
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("\n🔄 Bank Sync Scheduler Migration Script");
  console.log("=".repeat(50));

  if (isDryRun) {
    console.log("⚠️  DRY RUN MODE - No changes will be made\n");
  }

  // Connect to database
  const db = getWorkerDb();

  // Calculate trial eligibility cutoff (30 days ago)
  const trialCutoffDate = subDays(new Date(), 30).toISOString();

  console.log("📋 Querying eligible teams...");
  console.log(`   Trial cutoff date: ${trialCutoffDate}`);

  // Build plan condition:
  // - Paying: plan is 'starter' or 'pro'
  // - Active trial: plan is 'trial' AND not canceled AND created within 30 days
  const planCondition = or(
    eq(teams.plan, "starter"),
    eq(teams.plan, "pro"),
    and(
      eq(teams.plan, "trial"),
      isNull(teams.canceledAt),
      gte(teams.createdAt, trialCutoffDate),
    ),
  );

  // First, get all team IDs that have bank connections
  const teamsWithConnections = await db
    .selectDistinct({ teamId: bankConnections.teamId })
    .from(bankConnections);

  const teamIdsWithConnections = teamsWithConnections.map((t) => t.teamId);

  if (teamIdsWithConnections.length === 0) {
    console.log(
      "\n✅ No teams with bank connections found. Nothing to migrate.",
    );
    process.exit(0);
  }

  console.log(
    `   Found ${teamIdsWithConnections.length} teams with bank connections`,
  );

  // Query eligible teams that have bank connections
  const eligibleTeams = await db
    .select({
      id: teams.id,
      plan: teams.plan,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .where(and(planCondition, inArray(teams.id, teamIdsWithConnections)));

  console.log(`   Found ${eligibleTeams.length} eligible teams\n`);

  if (eligibleTeams.length === 0) {
    console.log("✅ No eligible teams to migrate.");
    process.exit(0);
  }

  // Show plan distribution
  const planCounts = eligibleTeams.reduce(
    (acc, team) => {
      acc[team.plan] = (acc[team.plan] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log("📊 Plan distribution:");
  for (const [plan, count] of Object.entries(planCounts)) {
    console.log(`   ${plan}: ${count} teams`);
  }
  console.log();

  if (isDryRun) {
    console.log("📋 Would register the following schedulers:\n");
    for (const team of eligibleTeams) {
      const cronPattern = generateCronTag(team.id);
      console.log(
        `   Team ${team.id.slice(0, 8)}... (${team.plan}) → ${cronPattern}`,
      );
    }
    console.log(
      "\n✅ Dry run complete. Run without --dry-run to apply changes.",
    );
    process.exit(0);
  }

  // Connect to Redis
  const redisUrl = process.env.REDIS_QUEUE_URL || process.env.REDIS_URL;

  if (!redisUrl) {
    console.error(
      "❌ REDIS_QUEUE_URL or REDIS_URL environment variable is required",
    );
    process.exit(1);
  }

  const bankingQueue = new Queue("banking", {
    connection: {
      url: redisUrl,
      enableOfflineQueue: false,
    },
  });

  console.log("🔗 Connected to Redis\n");
  console.log("📝 Registering schedulers...\n");

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ teamId: string; error: string }> = [];

  for (const team of eligibleTeams) {
    const cronPattern = generateCronTag(team.id);
    const jobKey = `bank-sync-${team.id}`;

    try {
      // Use upsertJobScheduler for idempotent registration
      await bankingQueue.upsertJobScheduler(
        `scheduler:${jobKey}`,
        {
          pattern: cronPattern,
          tz: "UTC",
        },
        {
          name: "bank-sync-scheduler",
          data: { teamId: team.id },
          opts: {},
        },
      );

      successCount++;
      console.log(
        `   ✅ ${team.id.slice(0, 8)}... (${team.plan}) → ${cronPattern}`,
      );
    } catch (error) {
      errorCount++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push({ teamId: team.id, error: errorMessage });
      console.log(`   ❌ ${team.id.slice(0, 8)}... - Error: ${errorMessage}`);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 Migration Summary:");
  console.log(`   Total teams: ${eligibleTeams.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${errorCount}`);

  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    for (const { teamId, error } of errors) {
      console.log(`   ${teamId}: ${error}`);
    }
  }

  await bankingQueue.close();

  if (errorCount > 0) {
    console.log("\n⚠️  Migration completed with errors.");
    process.exit(1);
  }

  console.log("\n✅ Migration completed successfully!");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
