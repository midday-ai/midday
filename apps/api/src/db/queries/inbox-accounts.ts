import type { Database } from "@api/db";
import { inboxAccounts } from "@api/db/schema";
import { and, eq } from "drizzle-orm";

export async function getInboxAccounts(db: Database, teamId: string) {
  return db
    .select({
      id: inboxAccounts.id,
      email: inboxAccounts.email,
      provider: inboxAccounts.provider,
      lastAccessed: inboxAccounts.lastAccessed,
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
    })
    .where(eq(inboxAccounts.id, params.id));
}
