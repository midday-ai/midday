import { client } from "@midday/engine-client";
import { job } from "@worker/core/job";
import { teamsQueue } from "@worker/queues/queues";
import { deleteConnectionSchema } from "@worker/schemas/jobs";

export const deleteConnectionJob = job(
  "delete-connection",
  deleteConnectionSchema,
  {
    queue: teamsQueue,
  },
  async (payload, ctx) => {
    const { referenceId, provider, accessToken } = payload;

    ctx.logger.info("Deleting bank connection", {
      referenceId,
      provider,
    });

    try {
      await client.connections.delete.$delete({
        json: {
          id: referenceId,
          provider,
          accessToken: accessToken ?? undefined,
        },
      });

      ctx.logger.info("Successfully deleted bank connection", {
        referenceId,
        provider,
      });

      return {
        type: "connection-deleted",
        referenceId,
        provider,
        deletedAt: new Date(),
      };
    } catch (error) {
      ctx.logger.error("Failed to delete bank connection", {
        referenceId,
        provider,
        error,
      });
      throw error;
    }
  },
);
