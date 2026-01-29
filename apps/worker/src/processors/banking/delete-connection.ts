import type { Job } from "bullmq";
import { trpc } from "../../client/trpc";
import {
  deleteConnectionSchema,
  type DeleteConnectionPayload,
} from "../../schemas/banking";
import { BaseProcessor } from "../base";

/**
 * Deletes a bank connection from the provider.
 * Called after the connection is deleted from our database.
 */
export class DeleteConnectionProcessor extends BaseProcessor<DeleteConnectionPayload> {
  protected getPayloadSchema() {
    return deleteConnectionSchema;
  }

  async process(job: Job<DeleteConnectionPayload>): Promise<void> {
    const { referenceId, provider, accessToken } = job.data;

    if (!referenceId) {
      this.logger.warn("No referenceId provided, skipping provider deletion", {
        provider,
      });
      return;
    }

    this.logger.info("Deleting connection from provider", {
      provider,
      referenceId,
    });

    try {
      await trpc.bankingService.deleteConnection.mutate({
        provider,
        id: referenceId,
        accessToken: accessToken ?? undefined,
      });

      this.logger.info("Connection deleted from provider", {
        provider,
        referenceId,
      });
    } catch (error) {
      // Log but don't fail - the connection is already deleted from our DB
      // Provider cleanup is best-effort
      this.logger.error("Failed to delete connection from provider", {
        provider,
        referenceId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
