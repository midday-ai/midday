import { getTeamsForInsights } from "@midday/db/queries";
import {
  type PeriodType,
  getEnabledTeamIds,
  getPreviousCompletePeriod,
} from "@midday/insights";
import type { Job } from "bullmq";
import { insightsQueue } from "../../queues/insights";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

type DispatchInsightsPayload = {
  periodType: PeriodType;
};

type ProcessResult = {
  dispatched: number;
  skipped: number;
  errors: Array<{ teamId: string; error: string }>;
};

/**
 * Batch size for processing teams.
 * Processes teams in batches to avoid memory issues with large team counts.
 */
const BATCH_SIZE = 100;

/**
 * Number of days a trial team remains eligible for insights
 */
const TRIAL_ELIGIBILITY_DAYS = 30;

/**
 * Dispatches insight generation jobs for teams.
 *
 * This processor runs hourly on the appropriate day (e.g., every Monday for weekly).
 * For MVP, it processes all active teams at 7 AM UTC.
 *
 * Only processes:
 * - Paying customers (starter/pro plans)
 * - Active trial users (created within past 30 days, not canceled)
 *
 * Future: Add timezone column to teams table and dispatch based on local time.
 */
export class DispatchInsightsProcessor extends BaseProcessor<DispatchInsightsPayload> {
  async process(job: Job<DispatchInsightsPayload>): Promise<ProcessResult> {
    const { periodType } = job.data;
    const db = getDb();

    this.logger.info("Starting insights dispatcher", { periodType });

    // Check which teams are enabled for insights
    const enabledTeamIds = getEnabledTeamIds();

    // Empty array = no teams enabled (safe default for staging)
    if (enabledTeamIds !== undefined && enabledTeamIds.length === 0) {
      this.logger.info(
        "No teams configured for insights (INSIGHTS_ENABLED_TEAM_IDS is empty), skipping dispatch",
        { periodType },
      );
      return { dispatched: 0, skipped: 0, errors: [] };
    }

    if (enabledTeamIds !== undefined) {
      this.logger.info("Insights enabled for specific teams", {
        periodType,
        enabledTeamIds,
      });
    } else {
      this.logger.info("Insights enabled for all teams", { periodType });
    }

    // Get the period we're generating insights for
    const period = getPreviousCompletePeriod(periodType);

    // For MVP: Process all active teams at 7 AM UTC
    // Check if it's 7 AM UTC
    const currentHourUTC = new Date().getUTCHours();
    if (currentHourUTC !== 7) {
      this.logger.info("Not 7 AM UTC, skipping dispatch", {
        periodType,
        currentHourUTC,
      });
      return { dispatched: 0, skipped: 0, errors: [] };
    }

    const errors: Array<{ teamId: string; error: string }> = [];
    let dispatched = 0;
    let skipped = 0;
    let cursor: string | null = null;
    let totalTeamsProcessed = 0;

    // Process teams in batches using cursor-based pagination
    while (true) {
      // Fetch batch of eligible teams using db query
      const eligibleTeams = await getTeamsForInsights(db, {
        enabledTeamIds,
        cursor,
        limit: BATCH_SIZE,
        trialEligibilityDays: TRIAL_ELIGIBILITY_DAYS,
      });

      // No more teams to process
      if (eligibleTeams.length === 0) {
        break;
      }

      totalTeamsProcessed += eligibleTeams.length;

      this.logger.info(`Processing batch of ${eligibleTeams.length} teams`, {
        periodType,
        batchStart: eligibleTeams[0]?.id,
        batchEnd: eligibleTeams[eligibleTeams.length - 1]?.id,
      });

      // Process each team in the batch
      for (const team of eligibleTeams) {
        try {
          // Queue individual insight generation job
          await insightsQueue.add(
            "generate-team-insights",
            {
              teamId: team.id,
              periodType,
              periodYear: period.periodYear,
              periodNumber: period.periodNumber,
              currency: team.baseCurrency ?? "USD",
            },
            {
              jobId: `insights-${team.id}-${periodType}-${period.periodYear}-${period.periodNumber}`,
              // Prevent duplicate jobs
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 60000, // 1 minute initial delay
              },
            },
          );

          dispatched++;
          this.logger.debug("Queued insight generation", {
            teamId: team.id,
            periodType,
            periodLabel: period.periodLabel,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          // Check if it's a duplicate job error (expected, not an error)
          if (
            errorMessage.includes("Job with id") ||
            errorMessage.includes("already exists")
          ) {
            this.logger.debug("Insight already queued, skipping", {
              teamId: team.id,
              periodType,
            });
            skipped++;
          } else {
            this.logger.error("Failed to queue insight generation", {
              teamId: team.id,
              error: errorMessage,
            });
            errors.push({ teamId: team.id, error: errorMessage });
          }
        }
      }

      // Update cursor for next batch
      cursor = eligibleTeams[eligibleTeams.length - 1]?.id ?? null;

      // If we got fewer than BATCH_SIZE, we've reached the end
      if (eligibleTeams.length < BATCH_SIZE) {
        break;
      }
    }

    if (totalTeamsProcessed === 0) {
      this.logger.info("No teams eligible for insights at this hour", {
        periodType,
      });
      return { dispatched: 0, skipped: 0, errors: [] };
    }

    this.logger.info("Insights dispatcher completed", {
      periodType,
      totalTeamsProcessed,
      dispatched,
      skipped,
      errors: errors.length,
    });

    return { dispatched, skipped, errors };
  }
}
