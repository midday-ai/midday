import {
  createInsight,
  getInsightByPeriod,
  updateInsight,
} from "@midday/db/queries";
import type { InsightMetric } from "@midday/db/schema";
import {
  type PeriodType,
  createInsightsService,
  getPreviousCompletePeriod,
} from "@midday/insights";
import type { Job } from "bullmq";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

type GenerateTeamInsightsPayload = {
  teamId: string;
  periodType: PeriodType;
  periodYear: number;
  periodNumber: number;
  currency: string;
};

type ProcessResult = {
  insightId: string;
  teamId: string;
  periodLabel: string;
  metricsCount: number;
  status: "created" | "updated" | "skipped";
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
    const { teamId, periodType, periodYear, periodNumber, currency } = job.data;
    const db = getDb();

    this.logger.info("Starting insight generation", {
      teamId,
      periodType,
      periodYear,
      periodNumber,
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
        periodLabel: existingInsight.periodLabel ?? "",
        metricsCount: existingInsight.selectedMetrics?.length ?? 0,
        status: "skipped",
      };
    }

    // Get period info
    const period = getPreviousCompletePeriod(periodType);

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
        periodLabel: period.periodLabel,
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
      });

      // Update insight with all data
      await updateInsight(db, {
        id: insightId,
        teamId,
        status: "completed",
        selectedMetrics: result.selectedMetrics,
        allMetrics: result.allMetrics as Record<string, InsightMetric>,
        anomalies: result.anomalies,
        activity: result.activity,
        content: result.content,
        generatedAt: new Date(),
      });

      this.logger.info("Insight generation completed", {
        teamId,
        insightId,
        periodLabel: period.periodLabel,
        metricsCount: result.selectedMetrics.length,
      });

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
