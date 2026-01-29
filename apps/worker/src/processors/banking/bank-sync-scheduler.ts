import { getBankConnections } from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import {
  type BankSyncSchedulerPayload,
  bankSyncSchedulerSchema,
} from "../../schemas/banking";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Daily bank sync scheduler.
 * Triggered by cron for each team, fans out to sync all connections.
 */
export class BankSyncSchedulerProcessor extends BaseProcessor<BankSyncSchedulerPayload> {
  protected getPayloadSchema() {
    return bankSyncSchedulerSchema;
  }

  async process(job: Job<BankSyncSchedulerPayload>): Promise<void> {
    const { teamId } = job.data;
    const db = getDb();

    const isEnabled =
      process.env.BANK_SYNC_SCHEDULER_ENABLED ??
      (process.env.NODE_ENV === "production" ? "true" : "false");

    if (isEnabled !== "true") {
      this.logger.info("Skipping bank sync scheduler (disabled)", { teamId });
      return;
    }

    this.logger.info("Running bank sync scheduler", { teamId });

    // Get all bank connections for this team
    const connections = await getBankConnections(db, { teamId });

    if (!connections || connections.length === 0) {
      this.logger.info("No bank connections to sync", { teamId });
      return;
    }

    this.logger.info("Triggering sync for connections", {
      teamId,
      connectionCount: connections.length,
    });

    // Trigger sync for each connection (parallel, non-blocking)
    const triggerPromises = connections.map((connection) =>
      triggerJob(
        "sync-connection",
        {
          connectionId: connection.id,
          manualSync: false, // Background sync
        },
        "banking",
      ),
    );

    await Promise.all(triggerPromises);

    this.logger.info("Bank sync triggered for all connections", {
      teamId,
      connectionCount: connections.length,
    });
  }
}
