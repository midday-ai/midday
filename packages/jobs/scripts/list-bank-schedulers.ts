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

async function listBankSchedulers() {
  try {
    console.log("Fetching all bank-sync-scheduler schedules...\n");

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

    if (bankSchedules.length === 0) {
      console.log("No bank-sync-scheduler schedules found.");
      return [];
    }

    console.log(
      `Found ${bankSchedules.length} bank-sync-scheduler schedules\n`,
    );

    const schedulerInfos: SchedulerInfo[] = bankSchedules.map(
      (schedule: any) => ({
        id: schedule.id,
        taskIdentifier: schedule.task,
        cron: schedule.generator?.expression,
        timezone: schedule.timezone,
        externalId: schedule.externalId,
        deduplicationKey: schedule.deduplicationKey,
        enabled: schedule.active,
      }),
    );

    // Display results
    console.log(
      `Listing ${schedulerInfos.length} bank-sync-scheduler schedules:\n`,
    );

    // Display each scheduler
    schedulerInfos.forEach((scheduler, index) => {
      const status = scheduler.enabled ? "🟢 Enabled" : "🔴 Disabled";

      console.log(`📋 Schedule ${index + 1}:`);
      console.log(`  └─ ID: ${scheduler.id}`);
      console.log(`     Status: ${status}`);
      console.log(`     Cron: ${scheduler.cron || "N/A"}`);
      console.log(`     Timezone: ${scheduler.timezone || "N/A"}`);
      console.log(`     External ID: ${scheduler.externalId || "N/A"}`);
      console.log(
        `     Deduplication Key: ${scheduler.deduplicationKey || "N/A"}`,
      );
      console.log("");
    });

    // Summary statistics
    const enabledCount = schedulerInfos.filter((s) => s.enabled).length;
    const disabledCount = schedulerInfos.filter((s) => !s.enabled).length;

    console.log("📊 Summary:");
    console.log(
      `Total bank-sync-scheduler schedules: ${schedulerInfos.length}`,
    );
    console.log(`Enabled: ${enabledCount}`);
    console.log(`Disabled: ${disabledCount}`);

    return schedulerInfos;
  } catch (error) {
    console.error("Error fetching bank schedulers:", error);
    throw error;
  }
}

// Run the script if called directly
async function main() {
  try {
    const schedulers = await listBankSchedulers();
    console.log(
      `\nScript completed successfully. Total bank-sync-scheduler schedules: ${schedulers.length}`,
    );
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

export { listBankSchedulers };
export type { SchedulerInfo };
