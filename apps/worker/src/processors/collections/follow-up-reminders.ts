import { createNotification } from "@midday/db/queries";
import { collectionCases, collectionStages } from "@midday/db/schema";
import type { Job } from "bullmq";
import { and, eq, isNull, isNotNull, sql } from "drizzle-orm";
import type { CollectionsFollowUpRemindersPayload } from "../../schemas/collections";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Follow-up reminders processor
 *
 * Runs daily. Finds active cases where nextFollowUp is today or overdue.
 * Creates notifications for assigned users.
 */
export class CollectionsFollowUpRemindersProcessor extends BaseProcessor<CollectionsFollowUpRemindersPayload> {
  async process(
    job: Job<CollectionsFollowUpRemindersPayload>,
  ): Promise<{ reminders: number }> {
    const db = getDb();
    let totalReminders = 0;

    // Find all active cases with follow-ups due today or overdue, assigned to someone
    const dueCases = await db
      .select({
        id: collectionCases.id,
        teamId: collectionCases.teamId,
        assignedTo: collectionCases.assignedTo,
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
          isNull(collectionCases.resolvedAt),
          isNotNull(collectionCases.assignedTo),
          isNotNull(collectionCases.nextFollowUp),
          sql`${collectionCases.nextFollowUp}::date <= current_date`,
        ),
      );

    for (const caseRow of dueCases) {
      if (!caseRow.assignedTo) continue;

      const followUpDate = new Date(caseRow.nextFollowUp!);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isOverdue = followUpDate < today;

      await createNotification(db, {
        teamId: caseRow.teamId,
        userId: caseRow.assignedTo,
        caseId: caseRow.id,
        type: "follow_up_due",
        message: isOverdue
          ? `Overdue follow-up for case in "${caseRow.stageName ?? "unknown"}" stage (was due ${caseRow.nextFollowUp}).`
          : `Follow-up due today for case in "${caseRow.stageName ?? "unknown"}" stage.`,
      });

      totalReminders++;
    }

    this.logger.info("Follow-up reminders complete", {
      reminders: totalReminders,
    });

    return { reminders: totalReminders };
  }
}
