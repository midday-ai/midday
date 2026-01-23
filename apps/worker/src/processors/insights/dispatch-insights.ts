import { getInsightByPeriod, getTeamsForInsights } from "@midday/db/queries";
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
  /** If true, skips timezone filter and generates for all teams without insight */
  catchUp?: boolean;
};

type SkipReasons = {
  duplicate: number;
  queueError: number;
  alreadyGenerated: number;
  wrongTimezone: number;
};

type ProcessResult = {
  dispatched: number;
  skipped: number;
  skipReasons: SkipReasons;
  errors: Array<{ teamId: string; error: string }>;
  mode: "primary" | "catchup";
};

/**
 * Batch size for processing teams.
 */
const BATCH_SIZE = 100;

/**
 * Number of days a trial team remains eligible for insights
 */
const TRIAL_ELIGIBILITY_DAYS = 30;

/**
 * Stagger delay between jobs (milliseconds).
 * 15 seconds between each team = prevents rate limit issues.
 */
const STAGGER_DELAY_MS = 15000;

/**
 * Target local hour for insight delivery (7 AM)
 */
const TARGET_LOCAL_HOUR = 7;

/**
 * Timezone-aware insight dispatcher.
 *
 * Primary mode (Monday, every 30 min):
 * - Finds teams where it's currently 7 AM local
 * - Generates insights immediately with stagger delay
 * - 48 runs = 2 chances per timezone band
 *
 * Catch-up mode (Tuesday 10 AM UTC):
 * - Finds ALL teams without insight for the period
 * - Generates immediately (regardless of timezone)
 * - Safety net for any Monday failures
 *
 * Rate limiting:
 * - Jobs staggered by 15s
 * - BullMQ worker concurrency + limiter prevents overload
 */
export class DispatchInsightsProcessor extends BaseProcessor<DispatchInsightsPayload> {
  async process(job: Job<DispatchInsightsPayload>): Promise<ProcessResult> {
    const { periodType, catchUp = false } = job.data;
    const db = getDb();
    const mode = catchUp ? "catchup" : "primary";

    this.logger.info(`Starting insights dispatcher (${mode} mode)`, {
      periodType,
      catchUp,
      currentUtcHour: new Date().getUTCHours(),
    });

    // Check which teams are enabled for insights (env var override for testing)
    const enabledTeamIds = getEnabledTeamIds();

    // Empty array = no teams enabled (safe default for staging)
    if (enabledTeamIds !== undefined && enabledTeamIds.length === 0) {
      this.logger.info(
        "No teams configured for insights (INSIGHTS_ENABLED_TEAM_IDS is empty)",
        { periodType },
      );
      return emptyResult(mode);
    }

    if (enabledTeamIds !== undefined) {
      this.logger.info("Insights restricted to specific teams (env override)", {
        periodType,
        enabledTeamIds,
      });
    }

    // Get the period we're generating insights for (previous complete week)
    const period = getPreviousCompletePeriod(periodType);

    const errors: Array<{ teamId: string; error: string }> = [];
    const skipReasons: SkipReasons = {
      duplicate: 0,
      queueError: 0,
      alreadyGenerated: 0,
      wrongTimezone: 0,
    };
    let dispatched = 0;
    let skipped = 0;
    let cursor: string | null = null;
    let totalTeamsProcessed = 0;

    this.logger.info(
      catchUp
        ? "Catch-up mode: generating for all teams without insight"
        : `Primary mode: generating for teams where it's ${TARGET_LOCAL_HOUR} AM local`,
      {
        periodType,
        periodLabel: period.periodLabel,
      },
    );

    // Process teams in batches using cursor-based pagination
    while (true) {
      // In primary mode, filter by timezone. In catch-up mode, get all teams.
      const eligibleTeams = await getTeamsForInsights(db, {
        enabledTeamIds,
        cursor,
        limit: BATCH_SIZE,
        trialEligibilityDays: TRIAL_ELIGIBILITY_DAYS,
        targetLocalHour: catchUp ? undefined : TARGET_LOCAL_HOUR,
      });

      if (eligibleTeams.length === 0) {
        break;
      }

      totalTeamsProcessed += eligibleTeams.length;

      this.logger.debug(`Processing batch of ${eligibleTeams.length} teams`, {
        periodType,
        mode,
        batchStart: eligibleTeams[0]?.id,
        batchEnd: eligibleTeams[eligibleTeams.length - 1]?.id,
      });

      for (const team of eligibleTeams) {
        // Check if insight already exists for this period
        const existingInsight = await getInsightByPeriod(db, {
          teamId: team.id,
          periodType,
          periodYear: period.periodYear,
          periodNumber: period.periodNumber,
        });

        if (existingInsight) {
          this.logger.debug("Insight already exists for period, skipping", {
            teamId: team.id,
            periodLabel: period.periodLabel,
            insightId: existingInsight.id,
          });
          skipped++;
          skipReasons.alreadyGenerated++;
          continue;
        }

        // Stagger jobs to prevent rate limit issues
        const jobDelay = dispatched * STAGGER_DELAY_MS;

        try {
          await insightsQueue.add(
            "generate-team-insights",
            {
              teamId: team.id,
              periodType,
              periodYear: period.periodYear,
              periodNumber: period.periodNumber,
              currency: team.baseCurrency ?? "USD",
              locale: team.ownerLocale,
            },
            {
              jobId: `insights-${team.id}-${periodType}-${period.periodYear}-${period.periodNumber}`,
              delay: jobDelay,
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 60000,
              },
            },
          );

          dispatched++;

          this.logger.debug("Queued insight generation", {
            teamId: team.id,
            periodType,
            periodLabel: period.periodLabel,
            delay: `${jobDelay / 1000}s`,
            mode,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          if (
            errorMessage.includes("Job with id") ||
            errorMessage.includes("already exists")
          ) {
            this.logger.debug("Job already queued, skipping", {
              teamId: team.id,
            });
            skipped++;
            skipReasons.duplicate++;
          } else {
            this.logger.error("Failed to queue insight generation", {
              teamId: team.id,
              error: errorMessage,
            });
            errors.push({ teamId: team.id, error: errorMessage });
            skipped++;
            skipReasons.queueError++;
          }
        }
      }

      cursor = eligibleTeams[eligibleTeams.length - 1]?.id ?? null;

      if (eligibleTeams.length < BATCH_SIZE) {
        break;
      }
    }

    if (totalTeamsProcessed === 0) {
      this.logger.info(
        catchUp
          ? "No teams need catch-up (all have insights)"
          : "No teams where it's 7 AM local right now",
        { periodType, mode },
      );
      return emptyResult(mode);
    }

    // Calculate estimated completion time
    const estimatedCompletionSeconds =
      dispatched > 0 ? (dispatched * STAGGER_DELAY_MS) / 1000 : 0;

    this.logger.info("Insights dispatch complete", {
      periodType,
      periodLabel: period.periodLabel,
      mode,
      totalTeamsChecked: totalTeamsProcessed,
      dispatched,
      skipped,
      skipReasons,
      errorCount: errors.length,
      estimatedCompletionMinutes: Math.round(estimatedCompletionSeconds / 60),
    });

    return {
      dispatched,
      skipped,
      skipReasons,
      errors,
      mode,
    };
  }
}

function emptyResult(mode: "primary" | "catchup"): ProcessResult {
  return {
    dispatched: 0,
    skipped: 0,
    skipReasons: {
      duplicate: 0,
      queueError: 0,
      alreadyGenerated: 0,
      wrongTimezone: 0,
    },
    errors: [],
    mode,
  };
}
