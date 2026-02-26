import type { Database } from "@db/client";
import { riskEvents } from "@db/schema";
import { and, desc, eq } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type CreateRiskEventParams = {
  teamId: string;
  dealId: string;
  paymentId?: string | null;
  eventType: string;
  eventDate?: string;
  rawImpact: number;
  decayedImpact?: number | null;
  metadata?: Record<string, unknown> | null;
};

export type GetRiskEventsParams = {
  dealId: string;
  teamId: string;
  limit?: number;
};

// ============================================================================
// Queries
// ============================================================================

export const createRiskEvent = async (
  db: Database,
  params: CreateRiskEventParams,
) => {
  const [result] = await db
    .insert(riskEvents)
    .values({
      teamId: params.teamId,
      dealId: params.dealId,
      paymentId: params.paymentId,
      eventType: params.eventType,
      eventDate: params.eventDate ?? new Date().toISOString(),
      rawImpact: params.rawImpact,
      decayedImpact: params.decayedImpact,
      metadata: params.metadata,
    })
    .returning();

  return result;
};

export const getRiskEvents = async (
  db: Database,
  params: GetRiskEventsParams,
) => {
  return db
    .select()
    .from(riskEvents)
    .where(
      and(
        eq(riskEvents.dealId, params.dealId),
        eq(riskEvents.teamId, params.teamId),
      ),
    )
    .orderBy(desc(riskEvents.eventDate))
    .limit(params.limit ?? 50);
};
