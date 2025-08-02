#!/usr/bin/env bun
import { schedules } from "@trigger.dev/sdk";
import { bankSyncScheduler } from "../src/tasks/bank/scheduler/bank-scheduler";
import { generateCronTag } from "../src/utils/generate-cron-tag";
import { getEligibleTeamIds } from "./get-eligible-teams";

type SchedulerResult = {
  teamId: string;
  teamName: string | null;
  scheduleId?: string;
  error?: string;
  status: "success" | "failed" | "skipped";
};

async function registerBankSchedulers() {
  try {
    console.log("🔍 Fetching eligible teams...\n");

    // Get all eligible teams
    const eligibleTeams = await getEligibleTeamIds();

    if (eligibleTeams.length === 0) {
      console.log("No eligible teams found.");
      return;
    }

    console.log(`Found ${eligibleTeams.length} eligible teams\n`);

    // Display teams that will get schedulers
    console.log("📋 Teams that will get bank sync schedulers:");
    eligibleTeams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name || "Unnamed"} (${team.id})`);
      console.log(`   Plan: ${team.plan}`);
      console.log(`   Bank connections: ${team.bankConnectionCount}`);
      console.log(`   Bank accounts: ${team.bankAccountCount}`);
      console.log(
        `   Providers: ${team.bankingProviders.join(", ") || "None"}`,
      );
      console.log("");
    });

    // Ask for confirmation
    console.log(
      "🚨 This will create bank sync schedulers for all eligible teams!",
    );
    console.log("Are you sure you want to proceed? (y/N)");

    // Wait for user input
    const response = await new Promise<string>((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", (key) => {
        const char = key.toString().toLowerCase();
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve(char);
      });
    });

    if (response !== "y") {
      console.log("❌ Registration cancelled.");
      return;
    }

    console.log("\n📅 Starting scheduler registration process...\n");

    // Register schedulers for each team
    const results: SchedulerResult[] = [];

    for (let i = 0; i < eligibleTeams.length; i++) {
      const team = eligibleTeams[i];
      if (!team) continue;

      console.log(
        `Registering ${i + 1}/${eligibleTeams.length}: ${team.name || "Unnamed"} (${team.id})...`,
      );

      try {
        // Create scheduler using the same pattern as initial.ts
        const schedule = await schedules.create({
          task: bankSyncScheduler.id,
          cron: generateCronTag(team.id),
          timezone: "UTC",
          externalId: team.id,
          deduplicationKey: `${team.id}-${bankSyncScheduler.id}`,
        });

        results.push({
          teamId: team.id,
          teamName: team.name,
          scheduleId: schedule.id,
          status: "success",
        });

        console.log(`  ✅ Successfully created scheduler: ${schedule.id}`);
        console.log(`     Cron: ${generateCronTag(team.id)}`);
        console.log(
          `     Deduplication key: ${team.id}-${bankSyncScheduler.id}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Check if it's a duplicate scheduler error
        if (
          errorMessage.includes("already exists") ||
          errorMessage.includes("duplicate")
        ) {
          results.push({
            teamId: team.id,
            teamName: team.name,
            status: "skipped",
            error: "Scheduler already exists",
          });
          console.log("  ⚠️  Skipped: Scheduler already exists");
        } else {
          results.push({
            teamId: team.id,
            teamName: team.name,
            status: "failed",
            error: errorMessage,
          });
          console.log(`  ❌ Failed: ${errorMessage}`);
        }
      }

      console.log("");
    }

    // Summary
    const successful = results.filter((r) => r.status === "success");
    const failed = results.filter((r) => r.status === "failed");
    const skipped = results.filter((r) => r.status === "skipped");

    console.log("📊 Registration Summary:");
    console.log(`✅ Successfully created: ${successful.length}`);
    console.log(`⚠️  Skipped (already exists): ${skipped.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
      console.log("\n✅ Successfully created schedulers:");
      for (const result of successful) {
        console.log(
          `  - ${result.teamName || "Unnamed"} (${result.teamId}): ${result.scheduleId}`,
        );
      }
    }

    if (skipped.length > 0) {
      console.log("\n⚠️  Skipped teams (schedulers already exist):");
      for (const result of skipped) {
        console.log(`  - ${result.teamName || "Unnamed"} (${result.teamId})`);
      }
    }

    if (failed.length > 0) {
      console.log("\n❌ Failed registrations:");
      for (const result of failed) {
        console.log(
          `  - ${result.teamName || "Unnamed"} (${result.teamId}): ${result.error}`,
        );
      }
    }

    return results;
  } catch (error) {
    console.error("Error during scheduler registration:", error);
    throw error;
  }
}

// Run the script if called directly
async function main() {
  try {
    const results = await registerBankSchedulers();
    if (results) {
      const successful = results.filter((r) => r.status === "success").length;
      console.log(
        `\n🎉 Script completed successfully. Created ${successful} new schedulers.`,
      );
    }
    process.exit(0);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

// Check if this file is being run directly
if (require.main === module) {
  main();
}

export { registerBankSchedulers };
export type { SchedulerResult };
