import { client } from "@midday/engine-client";
import { Polar } from "@polar-sh/sdk";
import type { Job } from "bullmq";
import type { DeleteTeamPayload } from "../../schemas/teams";
import { BaseProcessor } from "../base";

/**
 * Delete team processor
 *
 * Handles all cleanup tasks when a team is deleted:
 * 1. Cancel Polar subscription (if paid plan)
 * 2. Delete bank connections via engine client
 *
 * Data is passed in payload since team is deleted before job runs.
 */
export class DeleteTeamProcessor extends BaseProcessor<DeleteTeamPayload> {
  private polar: Polar;

  constructor() {
    super();
    this.polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      server: process.env.POLAR_ENVIRONMENT as "production" | "sandbox",
    });
  }

  async process(job: Job<DeleteTeamPayload>): Promise<{
    teamId: string;
    subscriptionCancelled: boolean;
    connectionsDeleted: number;
  }> {
    const { teamId, plan, connections } = job.data;

    this.logger.info("Starting team deletion cleanup", {
      jobId: job.id,
      teamId,
      plan,
      connectionsCount: connections.length,
    });

    const hasPaidPlan = plan === "starter" || plan === "pro";
    let subscriptionCancelled = false;

    // 1. Cancel Polar subscription if paid plan
    if (hasPaidPlan) {
      try {
        subscriptionCancelled = await this.cancelSubscription(teamId);
      } catch (error) {
        this.logger.error("Failed to cancel subscription", {
          teamId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Continue with other cleanup even if subscription cancellation fails
      }
    }

    // 2. Delete bank connections
    const connectionsDeleted = await this.deleteBankConnections(
      teamId,
      connections,
    );

    this.logger.info("Team deletion cleanup completed", {
      teamId,
      subscriptionCancelled,
      connectionsDeleted,
    });

    return {
      teamId,
      subscriptionCancelled,
      connectionsDeleted,
    };
  }

  private async cancelSubscription(teamId: string): Promise<boolean> {
    this.logger.info("Looking for subscriptions to cancel", { teamId });

    try {
      // List subscriptions for this team (using externalCustomerId)
      const subscriptions = await this.polar.subscriptions.list({
        externalCustomerId: teamId,
      });

      let cancelled = false;

      for (const subscription of subscriptions.result.items) {
        if (subscription.status === "active") {
          this.logger.info("Revoking subscription", {
            teamId,
            subscriptionId: subscription.id,
          });

          // Revoke immediately (vs cancel at period end)
          await this.polar.subscriptions.revoke({
            id: subscription.id,
          });

          cancelled = true;
        }
      }

      if (cancelled) {
        this.logger.info("Subscription revoked successfully", { teamId });
      } else {
        this.logger.info("No active subscriptions found to cancel", { teamId });
      }

      return cancelled;
    } catch (error) {
      this.logger.error("Error revoking subscription", {
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private async deleteBankConnections(
    teamId: string,
    connections: DeleteTeamPayload["connections"],
  ): Promise<number> {
    if (connections.length === 0) {
      this.logger.info("No bank connections to delete", { teamId });
      return 0;
    }

    this.logger.info("Deleting bank connections", {
      teamId,
      count: connections.length,
    });

    const deletePromises = connections.map(async (connection) => {
      if (!connection.referenceId) {
        return false;
      }

      try {
        await client.connections.delete.$delete({
          json: {
            id: connection.referenceId,
            provider: connection.provider as
              | "gocardless"
              | "teller"
              | "plaid"
              | "enablebanking",
            accessToken: connection.accessToken ?? undefined,
          },
        });
        return true;
      } catch (error) {
        this.logger.warn("Failed to delete connection from provider", {
          teamId,
          referenceId: connection.referenceId,
          provider: connection.provider,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return false;
      }
    });

    const results = await Promise.all(deletePromises);
    const deletedCount = results.filter(Boolean).length;

    this.logger.info("Bank connections deletion completed", {
      teamId,
      attempted: connections.length,
      deleted: deletedCount,
    });

    return deletedCount;
  }
}
