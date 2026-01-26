import {
  checkInsightDataQuality,
  createInsight,
  getInsightByPeriod,
  updateInsight,
} from "@midday/db/queries";
import type { InsightMetric } from "@midday/db/schema";
import {
  type PeriodType,
  createInsightsService,
  formatDateForQuery,
  getPeriodInfo,
  getPeriodLabel,
} from "@midday/insights";
import {
  buildAudioScript,
  generateAudio,
  getAudioPresignedUrl,
  isAudioEnabled,
  uploadInsightAudio,
} from "@midday/insights/audio";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

type GenerateTeamInsightsPayload = {
  teamId: string;
  periodType: PeriodType;
  periodYear: number;
  periodNumber: number;
  currency: string;
  /** Owner's locale for formatting (e.g., "en", "sv", "de") */
  locale?: string;
  /** If true, bypass data quality checks (for testing) */
  skipDataQualityCheck?: boolean;
};

type ProcessResult = {
  insightId?: string;
  teamId: string;
  periodLabel: string;
  metricsCount: number;
  status: "created" | "updated" | "skipped" | "skipped_insufficient_data";
  skipReason?: string;
};

/**
 * Generates AI-powered business insights for a team.
 *
 * This processor uses @midday/insights to:
 * 1. Fetch current and previous period data
 * 2. Calculate all relevant metrics
 * 3. Select the 4 most important metrics using smart scoring
 * 4. Generate AI narrative content (good news first, story, actions)
 * 5. Store the complete insight in the database
 */
export class GenerateInsightsProcessor extends BaseProcessor<GenerateTeamInsightsPayload> {
  async process(job: Job<GenerateTeamInsightsPayload>): Promise<ProcessResult> {
    const {
      teamId,
      periodType,
      periodYear,
      periodNumber,
      currency,
      locale,
      skipDataQualityCheck,
    } = job.data;
    const db = getDb();

    this.logger.info("Starting insight generation", {
      teamId,
      periodType,
      periodYear,
      periodNumber,
      skipDataQualityCheck: !!skipDataQualityCheck,
    });

    // Check if insight already exists
    const existingInsight = await getInsightByPeriod(db, {
      teamId,
      periodType,
      periodYear,
      periodNumber,
    });

    if (existingInsight?.status === "completed") {
      this.logger.info("Insight already exists and is completed, skipping", {
        teamId,
        insightId: existingInsight.id,
      });
      return {
        insightId: existingInsight.id,
        teamId,
        periodLabel: getPeriodLabel(periodType, periodYear, periodNumber),
        metricsCount: existingInsight.selectedMetrics?.length ?? 0,
        status: "skipped",
      };
    }

    // Get period info from the job payload (not recalculated from current date)
    const period = getPeriodInfo(periodType, periodYear, periodNumber);

    // Check data quality before generating (unless explicitly skipped for testing)
    if (!skipDataQualityCheck) {
      const dataQuality = await checkInsightDataQuality(db, {
        teamId,
        periodStart: formatDateForQuery(period.periodStart),
        periodEnd: formatDateForQuery(period.periodEnd),
      });

      if (!dataQuality.hasSufficientData) {
        this.logger.info(
          "Skipping insight generation due to insufficient data",
          {
            teamId,
            periodType,
            periodLabel: period.periodLabel,
            skipReason: dataQuality.skipReason,
            metrics: dataQuality.metrics,
          },
        );

        return {
          teamId,
          periodLabel: period.periodLabel,
          metricsCount: 0,
          status: "skipped_insufficient_data",
          skipReason: dataQuality.skipReason,
        };
      }

      this.logger.info("Data quality check passed", {
        teamId,
        metrics: dataQuality.metrics,
      });
    } else {
      this.logger.warn("Skipping data quality check (force mode)", { teamId });
    }

    // Create or update insight record with "generating" status
    let insightId: string;
    if (existingInsight) {
      insightId = existingInsight.id;
      await updateInsight(db, {
        id: insightId,
        teamId,
        status: "generating",
      });
    } else {
      const created = await createInsight(db, {
        teamId,
        periodType,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        periodYear: period.periodYear,
        periodNumber: period.periodNumber,
        currency,
      });
      if (!created) {
        throw new Error("Failed to create insight record");
      }
      insightId = created.id;
      await updateInsight(db, {
        id: insightId,
        teamId,
        status: "generating",
      });
    }

    try {
      // Use InsightsService to generate the insight
      const insightsService = createInsightsService(db);
      const result = await insightsService.generateInsight({
        teamId,
        periodType,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        periodLabel: period.periodLabel,
        periodYear: period.periodYear,
        periodNumber: period.periodNumber,
        currency,
        locale,
      });

      // Generate audio if ElevenLabs is configured
      let audioPath: string | undefined;
      let audioPresignedUrl: string | undefined;

      if (isAudioEnabled()) {
        try {
          const supabase = createClient();

          // Build audio script that narrates the visual content
          const script = buildAudioScript(
            result.content,
            period.periodLabel,
            result.selectedMetrics,
            result.activity,
            currency,
          );

          this.logger.info("Generating audio for insight", {
            teamId,
            insightId,
            scriptLength: script.length,
          });

          // Generate audio via ElevenLabs v3
          const audioBuffer = await generateAudio(script);

          // Upload to Supabase storage
          audioPath = await uploadInsightAudio(
            supabase,
            teamId,
            insightId,
            audioBuffer,
          );

          // Generate 7-day presigned URL for email notification
          audioPresignedUrl = await getAudioPresignedUrl(
            supabase,
            audioPath,
            7 * 24 * 60 * 60, // 7 days
          );

          this.logger.info("Audio generated successfully", {
            teamId,
            insightId,
            audioPath,
          });
        } catch (error) {
          // Don't fail the insight if audio generation fails - it's optional
          this.logger.warn(
            "Audio generation failed, continuing without audio",
            {
              teamId,
              insightId,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          );
        }
      }

      // Update insight with all data (including audio path and predictions for next week)
      await updateInsight(db, {
        id: insightId,
        teamId,
        status: "completed",
        title: result.content.title,
        selectedMetrics: result.selectedMetrics,
        allMetrics: result.allMetrics as Record<string, InsightMetric>,
        anomalies: result.anomalies,
        expenseAnomalies: result.expenseAnomalies,
        activity: result.activity,
        content: result.content,
        predictions: result.predictions,
        audioPath,
        generatedAt: new Date(),
      });

      this.logger.info("Insight generation completed", {
        teamId,
        insightId,
        periodLabel: period.periodLabel,
        metricsCount: result.selectedMetrics.length,
        hasAudio: !!audioPath,
      });

      // Trigger notification for new insights (not updates)
      if (!existingInsight) {
        try {
          await triggerJob(
            "notification",
            {
              type: "insight_ready",
              teamId,
              insightId,
              periodType,
              periodLabel: period.periodLabel,
              periodNumber: period.periodNumber,
              periodYear: period.periodYear,
              title: result.content.title,
              audioPresignedUrl,
            },
            "notifications",
          );
        } catch (error) {
          // Don't fail the entire process if notification fails
          this.logger.warn("Failed to trigger insight_ready notification", {
            teamId,
            insightId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        insightId,
        teamId,
        periodLabel: period.periodLabel,
        metricsCount: result.selectedMetrics.length,
        status: existingInsight ? "updated" : "created",
      };
    } catch (error) {
      // Mark insight as failed
      await updateInsight(db, {
        id: insightId,
        teamId,
        status: "failed",
      });
      throw error;
    }
  }
}
