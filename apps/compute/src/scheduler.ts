import { enqueueRun } from "@midday/job-client";
import type { Database } from "@midday/db/client";
import {
  acquireSchedulerLock,
  createComputerRun,
  failStaleRunningRuns,
  getEnabledScheduledAgents,
} from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import { Cron } from "croner";

const logger = createLoggerWithContext("compute:scheduler");

let activeCrons: Cron[] = [];
let hasLock = false;

export async function startScheduler(db: Database) {
  const refreshInterval = 60_000;

  async function refreshSchedules() {
    try {
      if (!hasLock) {
        hasLock = await acquireSchedulerLock(db);
        if (!hasLock) {
          logger.info("Another instance holds the scheduler lock, skipping");
          return;
        }
        logger.info("Acquired scheduler lock");
      }

      const staleCount = await failStaleRunningRuns(db, { staleMinutes: 60 });
      if (staleCount > 0) {
        logger.warn("Failed stale running runs", { count: staleCount });
      }

      const agents = await getEnabledScheduledAgents(db);

      for (const cron of activeCrons) {
        cron.stop();
      }
      activeCrons = [];

      for (const agent of agents) {
        if (!agent.scheduleCron) continue;

        try {
          const cron = new Cron(agent.scheduleCron, { timezone: agent.timezone ?? "UTC" }, async () => {
            try {
              const runId = crypto.randomUUID();

              await createComputerRun(db, {
                id: runId,
                agentId: agent.id,
                teamId: agent.teamId,
              });

              await enqueueRun({
                agentId: agent.id,
                teamId: agent.teamId,
                runId,
                triggerType: "schedule",
              });

              logger.info("Scheduled run enqueued", {
                agentId: agent.id,
                slug: agent.slug,
                runId,
              });
            } catch (error) {
              logger.error("Failed to enqueue scheduled run", {
                agentId: agent.id,
                error:
                  error instanceof Error ? error.message : String(error),
              });
            }
          });

          activeCrons.push(cron);
          logger.info("Cron registered", {
            agentId: agent.id,
            slug: agent.slug,
            cron: agent.scheduleCron,
          });
        } catch (error) {
          logger.error("Invalid cron expression", {
            agentId: agent.id,
            cron: agent.scheduleCron,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info("Schedules refreshed", {
        total: agents.length,
        active: activeCrons.length,
      });
    } catch (error) {
      logger.error("Failed to refresh schedules", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await refreshSchedules();
  setInterval(refreshSchedules, refreshInterval);

  logger.info("Scheduler started", {
    refreshInterval: `${refreshInterval}ms`,
  });
}

export function stopScheduler() {
  for (const cron of activeCrons) {
    cron.stop();
  }
  activeCrons = [];
  hasLock = false;
  logger.info("Scheduler stopped");
}
