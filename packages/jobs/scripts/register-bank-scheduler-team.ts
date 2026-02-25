#!/usr/bin/env bun
import { createJobDb } from "@midday/db/job-client";
import { schedules } from "@trigger.dev/sdk";
import { bankSyncScheduler } from "../src/tasks/bank/scheduler/bank-scheduler";
import { generateCronTag } from "../src/utils/generate-cron-tag";

const PROD_ENV_VALUES = new Set(["prod", "production"]);

type ExistingScheduler = {
  id: string;
  externalId?: string | null;
  deduplicationKey?: string | null;
  cron?: string | null;
  timezone?: string | null;
  enabled: boolean;
};

type CliOptions = {
  teamId?: string;
  dryRun: boolean;
};

type RegisterOptions = {
  teamId?: string;
  dryRun?: boolean;
};

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  let teamId: string | undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === "--dry-run" || arg === "--dryRun") {
      dryRun = true;
      continue;
    }

    if (arg.startsWith("--team-id=") || arg.startsWith("--teamId=")) {
      teamId = arg.split("=")[1];
      continue;
    }

    if (arg === "--team-id" || arg === "--teamId") {
      teamId = args[i + 1];
      i++;
      continue;
    }

    // First non-flag argument is treated as team id.
    if (!arg.startsWith("-") && !teamId) {
      teamId = arg;
    }
  }

  return { teamId, dryRun };
}

function getTeamId(opts: { teamId?: string }) {
  const teamId =
    opts.teamId ?? process.env.BANK_SYNC_TEAM_ID ?? process.env.TEAM_ID;

  if (!teamId) {
    throw new Error(
      "Missing team id. Pass --team-id <id> (or positional id), or set BANK_SYNC_TEAM_ID / TEAM_ID.",
    );
  }

  return teamId;
}

function validateTriggerTarget() {
  const targetEnv = (process.env.TRIGGER_TARGET_ENV ?? "dev").toLowerCase();

  if (
    PROD_ENV_VALUES.has(targetEnv) &&
    process.env.CONFIRM_TRIGGER_PROD !== "true"
  ) {
    throw new Error(
      "Refusing to run against Trigger production without CONFIRM_TRIGGER_PROD=true.",
    );
  }

  return targetEnv;
}

async function getTeamBankContext(teamId: string) {
  const { db, disconnect } = createJobDb();

  try {
    const teams = await db.query.teams.findMany({
      columns: {
        id: true,
        name: true,
        plan: true,
      },
      with: {
        bankConnections: {
          columns: {
            id: true,
            provider: true,
          },
        },
      },
    });

    return teams.find((team) => team.id === teamId) ?? null;
  } finally {
    await disconnect();
  }
}

async function findExistingScheduler(
  teamId: string,
): Promise<ExistingScheduler | null> {
  let page = 1;
  let totalPages = 1;
  const expectedDeduplicationKey = `${teamId}-${bankSyncScheduler.id}`;

  do {
    const schedulesPage = await schedules.list({
      page,
      perPage: 200,
    });

    const pageSchedules = schedulesPage?.data ?? [];
    const match = pageSchedules.find((schedule: any) => {
      if (schedule.task !== bankSyncScheduler.id) return false;

      return (
        schedule.externalId === teamId ||
        schedule.deduplicationKey === expectedDeduplicationKey
      );
    });

    if (match) {
      return {
        id: match.id,
        externalId: match.externalId,
        deduplicationKey: match.deduplicationKey,
        cron: match.generator?.expression,
        timezone: match.timezone,
        enabled: match.active,
      };
    }

    if (!schedulesPage.pagination) break;

    totalPages = schedulesPage.pagination.totalPages;
    page++;
  } while (page <= totalPages);

  return null;
}

async function registerBankSchedulerForTeam(options: RegisterOptions = {}) {
  const teamId = getTeamId(options);
  const dryRun = options.dryRun ?? false;
  const targetEnv = validateTriggerTarget();

  console.log(`Target Trigger environment: ${targetEnv}`);
  console.log(`Looking up team: ${teamId}`);
  console.log(`Dry run: ${dryRun ? "yes" : "no"}`);

  const team = await getTeamBankContext(teamId);

  if (!team) {
    throw new Error(`Team not found: ${teamId}`);
  }

  if (!team.bankConnections.length) {
    throw new Error(
      `Team ${teamId} has no bank connections. Refusing scheduler registration.`,
    );
  }

  const existing = await findExistingScheduler(teamId);

  if (existing) {
    console.log("Scheduler already exists, skipping creation.");
    console.log(`  ID: ${existing.id}`);
    console.log(`  Enabled: ${existing.enabled}`);
    console.log(`  Cron: ${existing.cron ?? "N/A"}`);
    console.log(`  Timezone: ${existing.timezone ?? "N/A"}`);
    console.log(`  External ID: ${existing.externalId ?? "N/A"}`);
    console.log(`  Deduplication key: ${existing.deduplicationKey ?? "N/A"}`);

    return { status: "exists" as const, scheduler: existing };
  }

  if (dryRun) {
    const cron = generateCronTag(teamId);
    console.log(
      "Dry run enabled. Scheduler does not exist and would be created.",
    );
    console.log(`  Team: ${team.name ?? "Unnamed"} (${team.id})`);
    console.log(`  Plan: ${team.plan}`);
    console.log(`  Bank connections: ${team.bankConnections.length}`);
    console.log(`  Task: ${bankSyncScheduler.id}`);
    console.log(`  Cron: ${cron}`);
    console.log("  Timezone: UTC");
    console.log(`  External ID: ${teamId}`);
    console.log(`  Deduplication key: ${teamId}-${bankSyncScheduler.id}`);

    return { status: "dry_run" as const };
  }

  const schedule = await schedules.create({
    task: bankSyncScheduler.id,
    cron: generateCronTag(teamId),
    timezone: "UTC",
    externalId: teamId,
    deduplicationKey: `${teamId}-${bankSyncScheduler.id}`,
  });

  console.log("Created bank scheduler successfully.");
  console.log(`  Team: ${team.name ?? "Unnamed"} (${team.id})`);
  console.log(`  Plan: ${team.plan}`);
  console.log(`  Bank connections: ${team.bankConnections.length}`);
  console.log(`  Scheduler ID: ${schedule.id}`);
  console.log(`  Cron: ${generateCronTag(teamId)}`);

  return { status: "created" as const, schedulerId: schedule.id };
}

async function main() {
  try {
    const cliOptions = parseCliArgs();
    const result = await registerBankSchedulerForTeam(cliOptions);
    console.log(`\nScript completed with status: ${result.status}`);
    process.exit(0);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { registerBankSchedulerForTeam };
