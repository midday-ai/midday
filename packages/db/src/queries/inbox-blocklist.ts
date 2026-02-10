import { and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { inboxBlocklist } from "../schema";

export type GetInboxBlocklistParams = {
  teamId: string;
};

export async function getInboxBlocklist(
  db: Database,
  params: GetInboxBlocklistParams,
) {
  const results = await db
    .select({
      id: inboxBlocklist.id,
      teamId: inboxBlocklist.teamId,
      type: inboxBlocklist.type,
      value: inboxBlocklist.value,
      createdAt: inboxBlocklist.createdAt,
    })
    .from(inboxBlocklist)
    .where(eq(inboxBlocklist.teamId, params.teamId))
    .orderBy(inboxBlocklist.createdAt);

  return results;
}

export type CreateInboxBlocklistParams = {
  teamId: string;
  type: "email" | "domain";
  value: string;
};

export async function createInboxBlocklist(
  db: Database,
  params: CreateInboxBlocklistParams,
) {
  const [result] = await db
    .insert(inboxBlocklist)
    .values({
      teamId: params.teamId,
      type: params.type as any,
      value: params.value,
    })
    .returning({
      id: inboxBlocklist.id,
      teamId: inboxBlocklist.teamId,
      type: inboxBlocklist.type,
      value: inboxBlocklist.value,
      createdAt: inboxBlocklist.createdAt,
    });

  return result;
}

export type DeleteInboxBlocklistParams = {
  id: string;
  teamId: string;
};

export async function deleteInboxBlocklist(
  db: Database,
  params: DeleteInboxBlocklistParams,
) {
  const [result] = await db
    .delete(inboxBlocklist)
    .where(
      and(
        eq(inboxBlocklist.id, params.id),
        eq(inboxBlocklist.teamId, params.teamId),
      ),
    )
    .returning({
      id: inboxBlocklist.id,
    });

  return result;
}
