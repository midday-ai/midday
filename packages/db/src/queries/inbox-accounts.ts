import type { Database } from "@db/client";
import { inboxAccounts } from "@db/schema";
import { and, eq } from "drizzle-orm";

export async function getInboxAccounts(db: Database, teamId: string) {
  return db
    .select({
      id: inboxAccounts.id,
      email: inboxAccounts.email,
      provider: inboxAccounts.provider,
      lastAccessed: inboxAccounts.lastAccessed,
      status: inboxAccounts.status,
      errorMessage: inboxAccounts.errorMessage,
    })
    .from(inboxAccounts)
    .where(eq(inboxAccounts.teamId, teamId));
}

type GetInboxAccountByIdParams = {
  id: string;
  teamId: string;
};

export async function getInboxAccountById(
  db: Database,
  params: GetInboxAccountByIdParams,
) {
  const [result] = await db
    .select({
      id: inboxAccounts.id,
      email: inboxAccounts.email,
      provider: inboxAccounts.provider,
      accessToken: inboxAccounts.accessToken,
      refreshToken: inboxAccounts.refreshToken,
      expiryDate: inboxAccounts.expiryDate,
      lastAccessed: inboxAccounts.lastAccessed,
    })
    .from(inboxAccounts)
    .where(
      and(
        eq(inboxAccounts.id, params.id),
        eq(inboxAccounts.teamId, params.teamId),
      ),
    );

  return result;
}

type DeleteInboxAccountParams = {
  id: string;
  teamId: string;
};

export async function deleteInboxAccount(
  db: Database,
  params: DeleteInboxAccountParams,
) {
  const [deleted] = await db
    .delete(inboxAccounts)
    .where(
      and(
        eq(inboxAccounts.id, params.id),
        eq(inboxAccounts.teamId, params.teamId),
      ),
    )
    .returning({
      id: inboxAccounts.id,
      scheduleId: inboxAccounts.scheduleId,
    });

  return deleted;
}

export type UpdateInboxAccountParams = {
  id: string;
  refreshToken?: string;
  accessToken?: string;
  expiryDate?: string;
  scheduleId?: string;
  lastAccessed?: string;
  status?: "connected" | "disconnected";
  errorMessage?: string | null;
};

export async function updateInboxAccount(
  db: Database,
  params: UpdateInboxAccountParams,
) {
  return db
    .update(inboxAccounts)
    .set({
      refreshToken: params.refreshToken,
      accessToken: params.accessToken,
      expiryDate: params.expiryDate,
      scheduleId: params.scheduleId,
      lastAccessed: params.lastAccessed,
      status: params.status as any,
      errorMessage: params.errorMessage,
    })
    .where(eq(inboxAccounts.id, params.id));
}

export type UpsertInboxAccountParams = {
  teamId: string;
  provider: string;
  accessToken: string;
  refreshToken: string;
  email: string;
  lastAccessed: string;
  externalId: string;
  expiryDate: string;
};

export async function upsertInboxAccount(
  db: Database,
  params: UpsertInboxAccountParams,
) {
  const [result] = await db
    .insert(inboxAccounts)
    .values({
      teamId: params.teamId,
      provider: params.provider as any,
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      email: params.email,
      lastAccessed: params.lastAccessed,
      externalId: params.externalId,
      expiryDate: params.expiryDate,
    })
    .onConflictDoUpdate({
      target: inboxAccounts.externalId,
      set: {
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        lastAccessed: params.lastAccessed,
        expiryDate: params.expiryDate,
        status: "connected",
        errorMessage: null,
      },
    })
    .returning({
      id: inboxAccounts.id,
      provider: inboxAccounts.provider,
      external_id: inboxAccounts.externalId,
    });

  return result;
}

type GetInboxAccountInfoParams = {
  id: string;
};

export async function getInboxAccountInfo(
  db: Database,
  params: GetInboxAccountInfoParams,
) {
  const [result] = await db
    .select({
      id: inboxAccounts.id,
      provider: inboxAccounts.provider,
      teamId: inboxAccounts.teamId,
      lastAccessed: inboxAccounts.lastAccessed,
    })
    .from(inboxAccounts)
    .where(eq(inboxAccounts.id, params.id))
    .limit(1);

  return result;
}
