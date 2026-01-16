import type { Database } from "@db/client";
import { invoiceAttachments, invoices } from "@db/schema";
import { and, count, eq } from "drizzle-orm";

export type InvoiceAttachment = {
  name: string;
  size: number;
  path: string[];
  invoiceId: string;
};

type CreateInvoiceAttachmentsParams = {
  attachments: InvoiceAttachment[];
  teamId: string;
};

export async function createInvoiceAttachments(
  db: Database,
  params: CreateInvoiceAttachmentsParams,
) {
  const { attachments, teamId } = params;

  // Check current attachment count for the invoice
  if (attachments.length > 0) {
    const invoiceId = attachments[0]!.invoiceId;
    const [currentCount] = await db
      .select({ count: count() })
      .from(invoiceAttachments)
      .where(
        and(
          eq(invoiceAttachments.invoiceId, invoiceId),
          eq(invoiceAttachments.teamId, teamId),
        ),
      );

    const existingCount = currentCount?.count ?? 0;
    const totalAfterUpload = existingCount + attachments.length;

    if (totalAfterUpload > 5) {
      throw new Error(
        `Cannot add ${attachments.length} attachment(s). Invoice already has ${existingCount} attachment(s). Maximum is 5.`,
      );
    }
  }

  const result = await db
    .insert(invoiceAttachments)
    .values(
      attachments.map((attachment) => ({
        ...attachment,
        teamId,
      })),
    )
    .returning();

  return result;
}

type DeleteInvoiceAttachmentParams = {
  id: string;
  teamId: string;
};

export async function deleteInvoiceAttachment(
  db: Database,
  params: DeleteInvoiceAttachmentParams,
) {
  const { id, teamId } = params;

  // Get the attachment first to return its path for storage deletion
  const [result] = await db
    .select({
      id: invoiceAttachments.id,
      invoiceId: invoiceAttachments.invoiceId,
      name: invoiceAttachments.name,
      path: invoiceAttachments.path,
      teamId: invoiceAttachments.teamId,
    })
    .from(invoiceAttachments)
    .where(
      and(
        eq(invoiceAttachments.id, id),
        eq(invoiceAttachments.teamId, teamId),
      ),
    );

  if (!result) {
    throw new Error("Attachment not found");
  }

  // Delete the attachment
  await db
    .delete(invoiceAttachments)
    .where(
      and(
        eq(invoiceAttachments.id, id),
        eq(invoiceAttachments.teamId, teamId),
      ),
    );

  return result;
}

type GetInvoiceAttachmentsParams = {
  invoiceId: string;
  teamId?: string;
};

export async function getInvoiceAttachments(
  db: Database,
  params: GetInvoiceAttachmentsParams,
) {
  const { invoiceId, teamId } = params;

  const conditions = [eq(invoiceAttachments.invoiceId, invoiceId)];

  if (teamId) {
    conditions.push(eq(invoiceAttachments.teamId, teamId));
  }

  const result = await db
    .select({
      id: invoiceAttachments.id,
      createdAt: invoiceAttachments.createdAt,
      invoiceId: invoiceAttachments.invoiceId,
      name: invoiceAttachments.name,
      path: invoiceAttachments.path,
      size: invoiceAttachments.size,
      teamId: invoiceAttachments.teamId,
    })
    .from(invoiceAttachments)
    .where(and(...conditions));

  return result;
}

type GetInvoiceAttachmentCountParams = {
  invoiceId: string;
  teamId: string;
};

export async function getInvoiceAttachmentCount(
  db: Database,
  params: GetInvoiceAttachmentCountParams,
) {
  const { invoiceId, teamId } = params;

  const [result] = await db
    .select({ count: count() })
    .from(invoiceAttachments)
    .where(
      and(
        eq(invoiceAttachments.invoiceId, invoiceId),
        eq(invoiceAttachments.teamId, teamId),
      ),
    );

  return result?.count ?? 0;
}

type GetInvoiceAttachmentsByTokenParams = {
  invoiceId: string;
};

/**
 * Get invoice attachments by invoice ID (used for public access via token)
 * No team ID required as access is validated via invoice token
 */
export async function getInvoiceAttachmentsByInvoiceId(
  db: Database,
  params: GetInvoiceAttachmentsByTokenParams,
) {
  const { invoiceId } = params;

  const result = await db
    .select({
      id: invoiceAttachments.id,
      createdAt: invoiceAttachments.createdAt,
      invoiceId: invoiceAttachments.invoiceId,
      name: invoiceAttachments.name,
      path: invoiceAttachments.path,
      size: invoiceAttachments.size,
      teamId: invoiceAttachments.teamId,
    })
    .from(invoiceAttachments)
    .innerJoin(invoices, eq(invoiceAttachments.invoiceId, invoices.id))
    .where(eq(invoiceAttachments.invoiceId, invoiceId));

  return result;
}
