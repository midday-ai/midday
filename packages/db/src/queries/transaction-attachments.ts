import type { Database } from "@db/client";
import { inbox, transactionAttachments, transactions } from "@db/schema";
import { and, eq } from "drizzle-orm";

export type Attachment = {
  type: string;
  name: string;
  size: number;
  path: string[];
  transactionId?: string;
};

type CreateAttachmentsParams = {
  attachments: Attachment[];
  teamId: string;
};

export async function createAttachments(
  db: Database,
  params: CreateAttachmentsParams,
) {
  const { attachments, teamId } = params;

  return db
    .insert(transactionAttachments)
    .values(
      attachments.map((attachment) => ({
        ...attachment,
        teamId,
      })),
    )
    .returning();
}

type DeleteAttachmentParams = {
  id: string;
  teamId: string;
};

export async function deleteAttachment(
  db: Database,
  params: DeleteAttachmentParams,
) {
  // First get the attachment to delete
  const [result] = await db
    .select({
      id: transactionAttachments.id,
      transactionId: transactionAttachments.transactionId,
      name: transactionAttachments.name,
      teamId: transactionAttachments.teamId,
    })
    .from(transactionAttachments)
    .where(
      and(
        eq(transactionAttachments.id, params.id),
        eq(transactionAttachments.teamId, params.teamId),
      ),
    );

  if (!result) {
    throw new Error("Attachment not found");
  }

  // Find inbox by transaction_id and set transaction_id to null if it exists
  if (result.transactionId) {
    await db
      .update(inbox)
      .set({ transactionId: null })
      .where(eq(inbox.transactionId, result.transactionId));
  }

  // Delete tax_rate and tax_type from the transaction
  if (result.transactionId) {
    await db
      .update(transactions)
      .set({ taxRate: null, taxType: null })
      .where(eq(transactions.id, result.transactionId));
  }

  // Delete the attachment
  return db
    .delete(transactionAttachments)
    .where(
      and(
        eq(transactionAttachments.id, params.id),
        eq(transactionAttachments.teamId, params.teamId),
      ),
    );
}
