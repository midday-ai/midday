import type { Database } from "@db/client";
import { inbox, transactionAttachments, transactions } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { createActivity } from "./activities";

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
  userId?: string;
};

export async function createAttachments(
  db: Database,
  params: CreateAttachmentsParams,
) {
  const { attachments, teamId, userId } = params;

  const result = await db
    .insert(transactionAttachments)
    .values(
      attachments.map((attachment) => ({
        ...attachment,
        teamId,
      })),
    )
    .returning();

  // Create activity for each attachment created
  for (const attachment of result) {
    createActivity(db, {
      teamId,
      userId,
      type: "transaction_attachment_created",
      source: "user",
      priority: 7,
      metadata: {
        attachmentId: attachment.id,
        transactionId: attachment.transactionId,
        fileName: attachment.name,
        fileSize: attachment.size,
        fileType: attachment.type,
      },
    });
  }

  return result;
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

  // Find inbox by transaction_id and set transaction_id to null and status to pending if it exists
  if (result.transactionId) {
    await db
      .update(inbox)
      .set({
        transactionId: null,
        status: "pending",
      })
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
