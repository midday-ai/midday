import { and, eq, sql } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../client";
import { bankConnections } from "../schema";

// Optional teamId is only for scheduler jobs resolving a trusted connection ID.
export async function getBankConnectionById(
  db: DatabaseOrTransaction,
  params: { id: string; teamId?: string },
) {
  const [row] = await db
    .select({
      id: bankConnections.id,
      provider: bankConnections.provider,
      accessToken: bankConnections.accessToken,
      referenceId: bankConnections.referenceId,
      teamId: bankConnections.teamId,
      enrollmentId: bankConnections.enrollmentId,
      institutionId: bankConnections.institutionId,
      status: bankConnections.status,
    })
    .from(bankConnections)
    .where(
      and(
        eq(bankConnections.id, params.id),
        params.teamId ? eq(bankConnections.teamId, params.teamId) : undefined,
      ),
    );
  return row;
}

export async function updateBankConnectionReferenceId(
  db: DatabaseOrTransaction,
  params: { id: string; teamId: string; referenceId: string },
) {
  const [row] = await db
    .update(bankConnections)
    .set({ referenceId: params.referenceId })
    .where(
      and(
        eq(bankConnections.id, params.id),
        eq(bankConnections.teamId, params.teamId),
      ),
    )
    .returning({ id: bankConnections.id });
  return row;
}

export async function getBankConnectionCount(
  db: DatabaseOrTransaction,
  params: { teamId: string },
) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bankConnections)
    .where(eq(bankConnections.teamId, params.teamId));
  return row?.count ?? 0;
}

export async function updateBankConnectionExpiry(
  db: DatabaseOrTransaction,
  params: {
    id: string;
    teamId: string;
    referenceId?: string;
    expiresAt: string;
  },
) {
  const [row] = await db
    .update(bankConnections)
    .set({ referenceId: params.referenceId, expiresAt: params.expiresAt })
    .where(
      and(
        eq(bankConnections.id, params.id),
        eq(bankConnections.teamId, params.teamId),
      ),
    )
    .returning({ id: bankConnections.id });
  return row;
}
