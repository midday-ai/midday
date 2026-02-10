import { and, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  accountingSyncRecords,
  inbox,
  transactionAttachments,
  transactions,
} from "../schema";
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

  // Reset export status for affected transactions so they reappear in review
  const transactionIds = [
    ...new Set(
      result
        .map((a) => a.transactionId)
        .filter((id): id is string => id !== null),
    ),
  ];

  if (transactionIds.length > 0) {
    await db
      .delete(accountingSyncRecords)
      .where(
        and(
          inArray(accountingSyncRecords.transactionId, transactionIds),
          eq(accountingSyncRecords.teamId, teamId),
        ),
      );
  }

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

type GetTransactionAttachmentParams = {
  transactionId: string;
  attachmentId: string;
  teamId: string;
};

export async function getTransactionAttachment(
  db: Database,
  params: GetTransactionAttachmentParams,
) {
  const { transactionId, attachmentId, teamId } = params;

  const [result] = await db
    .select({
      id: transactionAttachments.id,
      name: transactionAttachments.name,
      path: transactionAttachments.path,
      type: transactionAttachments.type,
      size: transactionAttachments.size,
      transactionId: transactionAttachments.transactionId,
      teamId: transactionAttachments.teamId,
    })
    .from(transactionAttachments)
    .innerJoin(
      transactions,
      eq(transactionAttachments.transactionId, transactions.id),
    )
    .where(
      and(
        eq(transactionAttachments.id, attachmentId),
        eq(transactionAttachments.transactionId, transactionId),
        eq(transactionAttachments.teamId, teamId),
        eq(transactions.teamId, teamId),
      ),
    );

  return result;
}

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

  // Update inbox items connected to this attachment
  // First, update inbox items that have this specific attachmentId
  await db
    .update(inbox)
    .set({
      attachmentId: null,
      transactionId: null,
      status: "pending",
    })
    .where(eq(inbox.attachmentId, result.id));

  // Also update inbox items by transaction_id (in case there are multiple inbox items for the same transaction)
  if (result.transactionId) {
    await db
      .update(inbox)
      .set({
        transactionId: null,
        status: "pending",
      })
      .where(
        and(
          eq(inbox.transactionId, result.transactionId),
          // Only update if attachmentId is null or doesn't match (to avoid double updates)
          sql`(${inbox.attachmentId} IS NULL OR ${inbox.attachmentId} != ${result.id})`,
        ),
      );
  }

  // Delete tax_rate and tax_type from the transaction
  if (result.transactionId) {
    await db
      .update(transactions)
      .set({ taxRate: null, taxType: null })
      .where(eq(transactions.id, result.transactionId));

    // Reset export status so transaction reappears in review
    await db
      .delete(accountingSyncRecords)
      .where(
        and(
          eq(accountingSyncRecords.transactionId, result.transactionId),
          eq(accountingSyncRecords.teamId, params.teamId),
        ),
      );
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
