import type { Database } from "@api/db";
import { inbox, transactionAttachments } from "@api/db/schema";
import { eq } from "drizzle-orm";

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

export async function deleteAttachment(db: Database, id: string) {
  // First get the attachment to delete
  const [result] = await db
    .select({
      id: transactionAttachments.id,
      transactionId: transactionAttachments.transactionId,
      name: transactionAttachments.name,
      teamId: transactionAttachments.teamId,
    })
    .from(transactionAttachments)
    .where(eq(transactionAttachments.id, id));

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

  // Delete the attachment
  return db
    .delete(transactionAttachments)
    .where(eq(transactionAttachments.id, id));
}
