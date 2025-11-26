import type { Database } from "@db/client";
import { inbox, inboxBlocklist } from "@db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { separateBlocklistEntries } from "../utils/blocklist";

export type GetInboxBlocklistParams = {
  teamId: string;
};

export async function getInboxBlocklist(
  db: Database,
  params: GetInboxBlocklistParams,
) {
  const entries = await db
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

  // Count blocked items if there are blocklist entries
  let blockedItemsCount = 0;
  if (entries.length > 0) {
    const { blockedDomains, blockedEmails } = separateBlocklistEntries(entries);

    // Count items matching any blocklist entry
    if (blockedDomains.length > 0 || blockedEmails.length > 0) {
      const [result] = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(inbox)
        .where(
          and(
            eq(inbox.teamId, params.teamId),
            ne(inbox.status, "deleted"),
            sql`(${
              blockedDomains.length > 0
                ? sql`(${inbox.website} IS NOT NULL AND ${sql.join(
                    blockedDomains.map(
                      (domain) =>
                        sql`LOWER(${inbox.website}) = LOWER(${domain})`,
                    ),
                    sql` OR `,
                  )})`
                : sql`false`
            } OR ${
              blockedEmails.length > 0
                ? sql`(${inbox.senderEmail} IS NOT NULL AND ${sql.join(
                    blockedEmails.map(
                      (email) =>
                        sql`LOWER(${inbox.senderEmail}) = LOWER(${email})`,
                    ),
                    sql` OR `,
                  )})`
                : sql`false`
            })`,
          ),
        );

      blockedItemsCount = Number(result?.count || 0);
    }
  }

  return {
    entries,
    count: blockedItemsCount,
  };
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
