#!/usr/bin/env bun
/**
 * Script to manually trigger insight generation for testing
 *
 * Usage:
 *   bun run scripts/generate-test-insight.ts <teamId> [periodType] [periodYear] [periodNumber] [--force]
 *
 * Examples:
 *   # Generate weekly insight for previous week
 *   bun run scripts/generate-test-insight.ts abc123-team-id
 *
 *   # Generate specific weekly insight
 *   bun run scripts/generate-test-insight.ts abc123-team-id weekly 2026 2
 *
 *   # Generate monthly insight
 *   bun run scripts/generate-test-insight.ts abc123-team-id monthly 2026 1
 *
 *   # Force generation (bypass data quality checks)
 *   bun run scripts/generate-test-insight.ts abc123-team-id --force
 *   bun run scripts/generate-test-insight.ts abc123-team-id weekly 2026 2 --force
 */

import { Queue } from "bullmq";
import { getWeek, getYear, subWeeks } from "date-fns";

type PeriodType = "weekly" | "monthly" | "quarterly" | "yearly";

function getPreviousCompletePeriod(periodType: PeriodType) {
  const now = new Date();

  switch (periodType) {
    case "weekly": {
      const previousWeek = subWeeks(now, 1);
      return {
        periodYear: getYear(previousWeek),
        periodNumber: getWeek(previousWeek, { weekStartsOn: 1 }),
      };
    }
    case "monthly": {
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        periodYear: previousMonth.getFullYear(),
        periodNumber: previousMonth.getMonth() + 1,
      };
    }
    case "quarterly": {
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
      const previousQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
      const year =
        currentQuarter === 1 ? now.getFullYear() - 1 : now.getFullYear();
      return {
        periodYear: year,
        periodNumber: previousQuarter,
      };
    }
    case "yearly": {
      return {
        periodYear: now.getFullYear() - 1,
        periodNumber: 1,
      };
    }
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);

  // Parse --force flag
  const forceIndex = rawArgs.indexOf("--force");
  const skipDataQualityCheck = forceIndex !== -1;
  const args = rawArgs.filter((arg) => arg !== "--force");

  if (args.length < 1) {
    console.error(
      "Usage: bun run scripts/generate-test-insight.ts <teamId> [periodType] [periodYear] [periodNumber] [--force]",
    );
    console.error("\nExamples:");
    console.error("  bun run scripts/generate-test-insight.ts abc123-team-id");
    console.error(
      "  bun run scripts/generate-test-insight.ts abc123-team-id weekly 2026 2",
    );
    console.error(
      "  bun run scripts/generate-test-insight.ts abc123-team-id monthly 2026 1",
    );
    console.error(
      "  bun run scripts/generate-test-insight.ts abc123-team-id --force",
    );
    process.exit(1);
  }

  const teamId = args[0];
  const periodType = (args[1] as PeriodType) || "weekly";
  const currency = args[4] || "USD";

  // Get period info - either from args or calculate previous complete period
  let periodYear: number;
  let periodNumber: number;

  if (args[2] && args[3]) {
    periodYear = Number.parseInt(args[2], 10);
    periodNumber = Number.parseInt(args[3], 10);
  } else {
    const period = getPreviousCompletePeriod(periodType);
    periodYear = period.periodYear;
    periodNumber = period.periodNumber;
  }

  console.log("\n🔍 Generating test insight with parameters:");
  console.log(`   Team ID: ${teamId}`);
  console.log(`   Period Type: ${periodType}`);
  console.log(`   Period Year: ${periodYear}`);
  console.log(`   Period Number: ${periodNumber}`);
  console.log(`   Currency: ${currency}`);
  if (skipDataQualityCheck) {
    console.log("   ⚠️  Force mode: bypassing data quality checks");
  }
  console.log();

  // Create queue connection directly
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

  if (!redisUrl) {
    console.error(
      "❌ REDIS_URL or UPSTASH_REDIS_URL environment variable is required",
    );
    process.exit(1);
  }

  const insightsQueue = new Queue("insights", {
    connection: {
      url: redisUrl,
      enableOfflineQueue: false,
    },
  });

  try {
    const jobId = `test-insights-${teamId}-${periodType}-${periodYear}-${periodNumber}-${Date.now()}`;

    console.log("📤 Adding job to insights queue...");

    const job = await insightsQueue.add(
      "generate-team-insights",
      {
        teamId,
        periodType,
        periodYear,
        periodNumber,
        currency,
        skipDataQualityCheck,
      },
      {
        jobId,
        attempts: 1,
      },
    );

    console.log("✅ Job added successfully!");
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Job Name: ${job.name}`);
    console.log();
    console.log("💡 The job will be processed by the worker.");
    console.log(
      "   Make sure the worker is running: bun run dev (in apps/worker)",
    );
    console.log();
    console.log(
      "   To monitor progress, check the worker logs or the insights table.",
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await insightsQueue.close();
    process.exit(0);
  }
}

main();
