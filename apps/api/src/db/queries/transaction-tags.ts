import type { Database } from "@api/db";
import { transactionTags } from "@api/db/schema";
import { and, eq } from "drizzle-orm";

type CreateTransactionTagParams = {
  teamId: string;
  transactionId: string;
  tagId: string;
};

export async function createTransactionTag(
  db: Database,
  params: CreateTransactionTagParams,
) {
  return db
    .insert(transactionTags)
    .values({
      teamId: params.teamId,
      transactionId: params.transactionId,
      tagId: params.tagId,
    })
    .returning();
}

type DeleteTransactionTagParams = {
  transactionId: string;
  tagId: string;
};

export async function deleteTransactionTag(
  db: Database,
  params: DeleteTransactionTagParams,
) {
  const { transactionId, tagId } = params;

  return db
    .delete(transactionTags)
    .where(
      and(
        eq(transactionTags.transactionId, transactionId),
        eq(transactionTags.tagId, tagId),
      ),
    );
}
