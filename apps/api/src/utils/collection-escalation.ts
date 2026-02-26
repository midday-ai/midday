import type { Database } from "@midday/db/client";
import {
  getEscalationRules,
  updateCollectionCase,
  createCollectionNote,
  createNotification,
} from "@midday/db/queries";
import {
  collectionCases,
  collectionStages,
} from "@midday/db/schema";
import { and, eq, isNull } from "drizzle-orm";

/**
 * Check event-based escalation rules for a deal's active collection case.
 *
 * Called after business events (e.g., NSF, missed payment) to see if the
 * case should be auto-escalated to a different stage.
 *
 * @param eventType - The event type to match against rules (e.g., "nsf_returned", "missed_payment")
 */
export async function checkEventBasedEscalation(
  db: Database,
  params: {
    dealId: string;
    teamId: string;
    eventType: string;
  },
): Promise<{ escalated: boolean; caseId?: string; toStageId?: string }> {
  // Find active collection case for this deal
  const [activeCase] = await db
    .select({
      id: collectionCases.id,
      stageId: collectionCases.stageId,
      assignedTo: collectionCases.assignedTo,
    })
    .from(collectionCases)
    .where(
      and(
        eq(collectionCases.dealId, params.dealId),
        eq(collectionCases.teamId, params.teamId),
        isNull(collectionCases.resolvedAt),
      ),
    )
    .limit(1);

  if (!activeCase) {
    return { escalated: false };
  }

  // Get event-based escalation rules for this team
  const rules = await getEscalationRules(db, { teamId: params.teamId });
  const eventRules = rules.filter(
    (r) =>
      r.triggerType === "event_based" &&
      r.isActive &&
      r.fromStageId === activeCase.stageId,
  );

  // Find a matching rule
  for (const rule of eventRules) {
    const condition = rule.condition as { eventType?: string };
    if (condition.eventType !== params.eventType) continue;

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

    // Transition the case
    await updateCollectionCase(db, {
      id: activeCase.id,
      teamId: params.teamId,
      stageId: rule.toStageId,
    });

    // Create system note
    await createCollectionNote(db, {
      caseId: activeCase.id,
      authorId: "system",
      summary: `Event-based escalation: "${params.eventType}" triggered move from "${fromStage?.name ?? "unknown"}" to "${toStage?.name ?? "unknown"}".`,
    });

    // Notify assigned user
    if (activeCase.assignedTo) {
      await createNotification(db, {
        teamId: params.teamId,
        userId: activeCase.assignedTo,
        caseId: activeCase.id,
        type: "escalation",
        message: `Case escalated to "${toStage?.name ?? "unknown"}" due to ${params.eventType} event.`,
      });
    }

    return {
      escalated: true,
      caseId: activeCase.id,
      toStageId: rule.toStageId,
    };
  }

  return { escalated: false };
}
