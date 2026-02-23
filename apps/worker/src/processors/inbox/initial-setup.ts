import type { Job } from "bullmq";
import type { InboxProviderInitialSetupPayload } from "../../schemas/inbox";
import { BaseProcessor } from "../base";

/**
 * Initial inbox setup processor.
 * Prepares the account after OAuth. The first sync is triggered by the user
 * from the UI after they choose a time period. Ongoing syncs are handled
 * by the centralized sync-accounts-scheduler.
 */
export class InitialSetupProcessor extends BaseProcessor<InboxProviderInitialSetupPayload> {
  async process(job: Job<InboxProviderInitialSetupPayload>): Promise<{
    inboxAccountId: string;
  }> {
    const { inboxAccountId } = job.data;

    this.logger.info("Initial inbox setup completed", { inboxAccountId });

    return { inboxAccountId };
  }
}
