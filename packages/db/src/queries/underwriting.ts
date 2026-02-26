import type { Database } from "@db/client";
import { underwritingBuyBox } from "@db/schema";
import { eq } from "drizzle-orm";

export type GetBuyBoxParams = {
  teamId: string;
};

export const getUnderwritingBuyBox = async (
  db: Database,
  params: GetBuyBoxParams,
) => {
  const [result] = await db
    .select()
    .from(underwritingBuyBox)
    .where(eq(underwritingBuyBox.teamId, params.teamId))
    .limit(1);

  return result ?? null;
};

export type UpsertBuyBoxParams = {
  teamId: string;
  minMonthlyRevenue?: number | null;
  minTimeInBusiness?: number | null;
  maxExistingPositions?: number | null;
  minAvgDailyBalance?: number | null;
  maxNsfCount?: number | null;
  excludedIndustries?: string[] | null;
  minCreditScore?: number | null;
};

export const upsertUnderwritingBuyBox = async (
  db: Database,
  params: UpsertBuyBoxParams,
) => {
  const { teamId, ...criteria } = params;

  const [result] = await db
    .insert(underwritingBuyBox)
    .values({
      teamId,
      ...criteria,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: underwritingBuyBox.teamId,
      set: {
        ...criteria,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  return result;
};
