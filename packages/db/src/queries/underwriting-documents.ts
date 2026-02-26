import type { Database } from "@db/client";
import { underwritingDocuments } from "@db/schema";
import { and, eq } from "drizzle-orm";

// ============================================================================
// Underwriting Document Queries
// ============================================================================

type GetUnderwritingDocumentsParams = {
  applicationId: string;
  teamId: string;
};

export const getUnderwritingDocuments = async (
  db: Database,
  params: GetUnderwritingDocumentsParams,
) => {
  const data = await db
    .select()
    .from(underwritingDocuments)
    .where(
      and(
        eq(underwritingDocuments.applicationId, params.applicationId),
        eq(underwritingDocuments.teamId, params.teamId),
      ),
    );

  return data;
};

// ============================================================================
// Underwriting Document Mutations
// ============================================================================

type CreateUnderwritingDocumentParams = {
  applicationId: string;
  teamId: string;
  requirementId?: string | null;
  filePath: string;
  fileName: string;
  fileSize?: number | null;
  documentType?: string | null;
};

export const createUnderwritingDocument = async (
  db: Database,
  params: CreateUnderwritingDocumentParams,
) => {
  const [result] = await db
    .insert(underwritingDocuments)
    .values({
      applicationId: params.applicationId,
      teamId: params.teamId,
      requirementId: params.requirementId,
      filePath: params.filePath,
      fileName: params.fileName,
      fileSize: params.fileSize,
      documentType: params.documentType,
    })
    .returning();

  return result;
};

type UpdateUnderwritingDocumentParams = {
  id: string;
  teamId: string;
  processingStatus?: string;
  extractionResults?: unknown;
  waived?: boolean;
  waiveReason?: string | null;
};

export const updateUnderwritingDocument = async (
  db: Database,
  params: UpdateUnderwritingDocumentParams,
) => {
  const { id, teamId, ...updateData } = params;

  const updateValues: Partial<typeof underwritingDocuments.$inferInsert> = {};

  if (updateData.processingStatus !== undefined) {
    updateValues.processingStatus =
      updateData.processingStatus as (typeof underwritingDocuments.processingStatus.enumValues)[number];
  }
  if (updateData.extractionResults !== undefined) {
    updateValues.extractionResults = updateData.extractionResults;
  }
  if (updateData.waived !== undefined) {
    updateValues.waived = updateData.waived;
  }
  if (updateData.waiveReason !== undefined) {
    updateValues.waiveReason = updateData.waiveReason;
  }

  const [result] = await db
    .update(underwritingDocuments)
    .set(updateValues)
    .where(
      and(
        eq(underwritingDocuments.id, id),
        eq(underwritingDocuments.teamId, teamId),
      ),
    )
    .returning();

  return result;
};
