#!/usr/bin/env bun
import { schedules } from "@trigger.dev/sdk";

type SchedulerInfo = {
  id: string;
  taskIdentifier: string;
  cron?: string;
  timezone?: string;
  externalId?: string;
  deduplicationKey?: string;
  enabled: boolean;
};

async function getBankSchedulers(): Promise<SchedulerInfo[]> {
  console.log("Fetching all registered schedulers...\n");

  // Fetch all pages of schedules
  let allSchedules: any[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    console.log(`Fetching page ${currentPage}...`);
    const schedulesPage = await schedules.list({
      page: currentPage,
      perPage: 200,
    });

    if (!schedulesPage || !schedulesPage.data) {
      break;
    }

    allSchedules = allSchedules.concat(schedulesPage.data);

    if (schedulesPage.pagination) {
      totalPages = schedulesPage.pagination.totalPages;
      currentPage++;
    } else {
      break;
    }
  } while (currentPage <= totalPages);

  console.log(`Found ${allSchedules.length} total schedules`);

  // Filter for only bank-sync-scheduler tasks
  const bankSchedules = allSchedules.filter(
    (schedule: any) => schedule.task === "bank-sync-scheduler",
  );

  console.log(`Found ${bankSchedules.length} bank-sync-scheduler schedules\n`);

  return bankSchedules.map((schedule: any) => ({
    id: schedule.id,
    taskIdentifier: schedule.task,
    cron: schedule.generator?.expression,
    timezone: schedule.timezone,
    externalId: schedule.externalId,
    deduplicationKey: schedule.deduplicationKey,
    enabled: schedule.active,
  }));
}

async function deleteBankSchedulers() {
  try {
    // Get all bank schedulers
    const bankSchedulers = await getBankSchedulers();

    if (bankSchedulers.length === 0) {
      console.log("No bank-sync-scheduler schedules found to delete.");
      return;
    }

    console.log(
      `⚠️  About to delete ${bankSchedulers.length} bank-sync-scheduler schedules:\n`,
    );

    // Display what will be deleted
    for (const [index, scheduler] of bankSchedulers.entries()) {
      const status = scheduler.enabled ? "🟢 Enabled" : "🔴 Disabled";
      console.log(`${index + 1}. ID: ${scheduler.id}`);
      console.log(`   Status: ${status}`);
      console.log(`   External ID: ${scheduler.externalId || "N/A"}`);
      console.log(`   Cron: ${scheduler.cron || "N/A"}`);
      console.log("");
    }

    // Ask for confirmation
    console.log("🚨 This action cannot be undone!");
    console.log("Are you sure you want to delete all these schedulers? (y/N)");

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
      console.log("❌ Deletion cancelled.");
      return;
    }

    console.log("\n🗑️  Starting deletion process...\n");

    // Delete each scheduler
    const results = {
      deleted: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (let i = 0; i < bankSchedulers.length; i++) {
      const scheduler = bankSchedulers[i];
      if (!scheduler) continue;

      console.log(
        `Deleting ${i + 1}/${bankSchedulers.length}: ${scheduler.id} (External ID: ${scheduler.externalId || "N/A"})...`,
      );

      try {
        await schedules.del(scheduler.id);
        results.deleted.push(scheduler.id);
        console.log("  ✅ Successfully deleted");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.failed.push({ id: scheduler.id, error: errorMessage });
        console.log(`  ❌ Failed: ${errorMessage}`);
      }
    }

    // Summary
    console.log("\n📊 Deletion Summary:");
    console.log(`✅ Successfully deleted: ${results.deleted.length}`);
    console.log(`❌ Failed to delete: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log("\n❌ Failed deletions:");
      for (const { id, error } of results.failed) {
        console.log(`  - ${id}: ${error}`);
      }
    }
  } catch (error) {
    console.error("Error during deletion process:", error);
    throw error;
  }
}

// Run the script if called directly
async function main() {
  try {
    await deleteBankSchedulers();
    console.log("\n🎉 Script completed successfully.");
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

export { deleteBankSchedulers, getBankSchedulers };
export type { SchedulerInfo };
