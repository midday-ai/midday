import {
  getEscalationRules,
  updateCollectionCase,
  createCollectionNote,
  createNotification,
} from "@midday/db/queries";
import {
  collectionCases,
  collectionEscalationRules,
  collectionStages,
  teams,
} from "@midday/db/schema";
import type { Job } from "bullmq";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { CollectionsAutoEscalatePayload } from "../../schemas/collections";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Auto-escalation processor
 *
 * Runs daily. For each team with active escalation rules:
 * 1. Fetch time-based escalation rules
 * 2. Find cases in fromStage where stageEnteredAt + daysInStage has passed
 * 3. Transition matching cases to toStage
 * 4. Create system notes and notifications
 */
export class CollectionsAutoEscalateProcessor extends BaseProcessor<CollectionsAutoEscalatePayload> {
  async process(
    job: Job<CollectionsAutoEscalatePayload>,
  ): Promise<{ escalated: number; teamsProcessed: number }> {
    const db = getDb();
    let totalEscalated = 0;
    let teamsProcessed = 0;

    // Get all teams that have escalation rules
    const teamIds = await db
      .selectDistinct({ teamId: collectionEscalationRules.teamId })
      .from(collectionEscalationRules)
      .where(eq(collectionEscalationRules.isActive, true));

    for (const { teamId } of teamIds) {
      teamsProcessed++;

      // Get active time-based rules for this team
      const rules = await getEscalationRules(db, { teamId });
      const timeRules = rules.filter(
        (r) => r.triggerType === "time_based" && r.isActive,
      );

      for (const rule of timeRules) {
        const condition = rule.condition as { daysInStage?: number };
        const daysThreshold = condition.daysInStage;

        if (!daysThreshold || daysThreshold <= 0) continue;

        // Find active cases in the fromStage that have exceeded the threshold
        const eligibleCases = await db
          .select({
            id: collectionCases.id,
            teamId: collectionCases.teamId,
            assignedTo: collectionCases.assignedTo,
            stageEnteredAt: collectionCases.stageEnteredAt,
          })
          .from(collectionCases)
          .where(
            and(
              eq(collectionCases.teamId, teamId),
              eq(collectionCases.stageId, rule.fromStageId),
              isNull(collectionCases.resolvedAt),
              sql`${collectionCases.stageEnteredAt} <= now() - interval '1 day' * ${daysThreshold}`,
            ),
          );

        // Get stage names for the note
        const [fromStage, toStage] = await Promise.all([
          db
            .select({ name: collectionStages.name })
            .from(collectionStages)
            .where(eq(collectionStages.id, rule.fromStageId))
            .then((r) => r[0]),
          db
            .select({ name: collectionStages.name })
            .from(collectionStages)
            .where(eq(collectionStages.id, rule.toStageId))
            .then((r) => r[0]),
        ]);

        for (const caseRow of eligibleCases) {
          // Transition the case
          await updateCollectionCase(db, {
            id: caseRow.id,
            teamId: caseRow.teamId,
            stageId: rule.toStageId,
          });

          // Create a system note (null authorId = system-generated)
          await createCollectionNote(db, {
            caseId: caseRow.id,
            authorId: null,
            summary: `Auto-escalated from "${fromStage?.name ?? "unknown"}" to "${toStage?.name ?? "unknown"}" after ${daysThreshold} days in stage.`,
          });

          // Notify assigned user (if any)
          if (caseRow.assignedTo) {
            await createNotification(db, {
              teamId: caseRow.teamId,
              userId: caseRow.assignedTo,
              caseId: caseRow.id,
              type: "escalation",
              message: `Case auto-escalated to "${toStage?.name ?? "unknown"}" after ${daysThreshold} days.`,
            });
          }

          totalEscalated++;
        }
      }

      await job.updateProgress(
        Math.round((teamsProcessed / teamIds.length) * 100),
      );
    }

    this.logger.info("Auto-escalation complete", {
      escalated: totalEscalated,
      teamsProcessed,
    });

    return { escalated: totalEscalated, teamsProcessed };
  }
}
