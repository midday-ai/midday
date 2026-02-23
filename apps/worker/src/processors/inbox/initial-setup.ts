import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import type { InboxProviderInitialSetupPayload } from "../../schemas/inbox";
import { BaseProcessor } from "../base";

/**
 * Initial inbox setup processor.
 * Triggers the first sync immediately. Future syncs are handled
 * by the centralized inbox-sync-accounts scheduler.
 */
export class InitialSetupProcessor extends BaseProcessor<InboxProviderInitialSetupPayload> {
  async process(job: Job<InboxProviderInitialSetupPayload>): Promise<{
    inboxAccountId: string;
  }> {
    const { inboxAccountId } = job.data;

    this.logger.info("Starting initial inbox setup", { inboxAccountId });

    await triggerJob(
      "sync-scheduler",
      {
        id: inboxAccountId,
        manualSync: true,
      },
      "inbox-provider",
    );

    this.logger.info("Initial inbox setup completed, first sync triggered", {
      inboxAccountId,
    });

    return { inboxAccountId };
  }
}
