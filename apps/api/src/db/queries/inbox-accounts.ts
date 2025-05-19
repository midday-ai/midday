import type { Database } from "@api/db";
import { inboxAccounts } from "@api/db/schema";
import { eq } from "drizzle-orm";

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

export async function getInboxAccountById(db: Database, id: string) {
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
    .where(eq(inboxAccounts.id, id));

  return result;
}

export async function deleteInboxAccount(db: Database, id: string) {
  const [deleted] = await db
    .delete(inboxAccounts)
    .where(eq(inboxAccounts.id, id))
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
