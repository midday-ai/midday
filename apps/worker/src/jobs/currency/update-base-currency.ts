import { job } from "@worker/core/job";
import { updateBaseCurrencySchema } from "@worker/schemas/jobs";

export const updateBaseCurrencyJob = job(
  "update-base-currency",
  updateBaseCurrencySchema,
  {
    queue: "teams",
    priority: 2,
    attempts: 3,
  },
  async (data, { logger, job: bullMQJob }) => {
    const { teamId, baseCurrency } = data;

    logger.info("Starting team base currency update", {
      teamId,
      baseCurrency,
    });

    try {
      // Get results from all child jobs (account currency updates)
      const childrenValues = await bullMQJob.getChildrenValues();
      const childResults = Object.values(childrenValues || {});

      logger.info("Child job results received", {
        teamId,
        baseCurrency,
        childCount: childResults.length,
      });

      return {
        teamId,
        baseCurrency,
        accountsProcessed: childResults.length,
        childResults,
        success: true,
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Failed to update team base currency", {
        teamId,
        baseCurrency,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  },
);
