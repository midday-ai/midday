import {
  getSlaConfigs,
  createNotification,
} from "@midday/db/queries";
import {
  collectionCases,
  collectionNotifications,
  collectionSlaConfigs,
  collectionStages,
} from "@midday/db/schema";
import type { Job } from "bullmq";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { CollectionsSlaCheckPayload } from "../../schemas/collections";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * SLA breach check processor
 *
 * Runs daily. For each team:
 * 1. Fetch SLA configs
 * 2. For each active case, check metrics against thresholds
 * 3. Create notifications for breaches (deduplicate: no repeat if already notified today)
 */
export class CollectionsSlaCheckProcessor extends BaseProcessor<CollectionsSlaCheckPayload> {
  async process(
    job: Job<CollectionsSlaCheckPayload>,
  ): Promise<{ breaches: number; teamsProcessed: number }> {
    const db = getDb();
    let totalBreaches = 0;
    let teamsProcessed = 0;

    // Get all teams that have SLA configs
    const teamIds = await db
      .selectDistinct({ teamId: collectionSlaConfigs.teamId })
      .from(collectionSlaConfigs);

    for (const { teamId } of teamIds) {
      teamsProcessed++;

      const slaConfigs = await getSlaConfigs(db, { teamId });
      if (slaConfigs.length === 0) continue;

      // Get all active cases for this team
      const activeCases = await db
        .select({
          id: collectionCases.id,
          stageId: collectionCases.stageId,
          assignedTo: collectionCases.assignedTo,
          stageEnteredAt: collectionCases.stageEnteredAt,
          enteredCollectionsAt: collectionCases.enteredCollectionsAt,
          nextFollowUp: collectionCases.nextFollowUp,
          stageName: collectionStages.name,
        })
        .from(collectionCases)
        .leftJoin(
          collectionStages,
          eq(collectionStages.id, collectionCases.stageId),
        )
        .where(
          and(
            eq(collectionCases.teamId, teamId),
            isNull(collectionCases.resolvedAt),
          ),
        );

      for (const caseRow of activeCases) {
        for (const sla of slaConfigs) {
          // Skip stage-specific SLAs that don't match this case's stage
          if (sla.stageId && sla.stageId !== caseRow.stageId) continue;

          const breached = this.checkBreach(sla.metric, sla.thresholdMinutes, caseRow);
          if (!breached) continue;

          // Check if we already sent a notification for this SLA today
          const today = new Date().toISOString().split("T")[0];
          const [existing] = await db
            .select({ id: collectionNotifications.id })
            .from(collectionNotifications)
            .where(
              and(
                eq(collectionNotifications.caseId, caseRow.id),
                eq(collectionNotifications.type, "sla_breach"),
                sql`${collectionNotifications.createdAt}::date = ${today}::date`,
              ),
            )
            .limit(1);

          if (existing) continue;

          // Notify the assigned user (or skip if unassigned — will show in dashboard)
          if (caseRow.assignedTo) {
            await createNotification(db, {
              teamId,
              userId: caseRow.assignedTo,
              caseId: caseRow.id,
              type: "sla_breach",
              message: `SLA breach: ${this.formatMetricName(sla.metric)} exceeded ${this.formatThreshold(sla.thresholdMinutes)} for case in "${caseRow.stageName ?? "unknown"}" stage.`,
            });
          }

          totalBreaches++;
        }
      }

      await job.updateProgress(
        Math.round((teamsProcessed / teamIds.length) * 100),
      );
    }

    this.logger.info("SLA breach check complete", {
      breaches: totalBreaches,
      teamsProcessed,
    });

    return { breaches: totalBreaches, teamsProcessed };
  }

  private checkBreach(
    metric: string,
    thresholdMinutes: number,
    caseRow: {
      stageEnteredAt: string;
      enteredCollectionsAt: string;
      nextFollowUp: string | null;
    },
  ): boolean {
    const now = Date.now();

    switch (metric) {
      case "time_in_stage": {
        const stageEntered = new Date(caseRow.stageEnteredAt).getTime();
        const minutesInStage = (now - stageEntered) / 60_000;
        return minutesInStage > thresholdMinutes;
      }
      case "response_time": {
        // Response time: how long since the follow-up was due
        if (!caseRow.nextFollowUp) return false;
        const followUpDue = new Date(caseRow.nextFollowUp).getTime();
        if (followUpDue > now) return false; // Not yet due
        const minutesOverdue = (now - followUpDue) / 60_000;
        return minutesOverdue > thresholdMinutes;
      }
      case "resolution_time": {
        const entered = new Date(caseRow.enteredCollectionsAt).getTime();
        const minutesInCollections = (now - entered) / 60_000;
        return minutesInCollections > thresholdMinutes;
      }
      default:
        return false;
    }
  }

  private formatMetricName(metric: string): string {
    switch (metric) {
      case "time_in_stage":
        return "Time in stage";
      case "response_time":
        return "Response time";
      case "resolution_time":
        return "Resolution time";
      default:
        return metric;
    }
  }

  private formatThreshold(minutes: number): string {
    if (minutes >= 1440) {
      const days = Math.round(minutes / 1440);
      return `${days} day${days !== 1 ? "s" : ""}`;
    }
    if (minutes >= 60) {
      const hours = Math.round(minutes / 60);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
}
