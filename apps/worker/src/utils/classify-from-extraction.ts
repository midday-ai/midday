import { limitWords, mapLanguageCodeToPostgresConfig } from "@midday/documents";
import { triggerJob } from "@midday/job-client";
import type { createLoggerWithContext } from "@midday/logger";
import { getDb } from "./db";
import { updateDocumentWithRetry } from "./document-update";

type Logger = ReturnType<typeof createLoggerWithContext>;

export interface ClassifyFromExtractionParams {
  filePath: string[];
  teamId: string;
  title: string | null;
  summary: string | null;
  tags: string[] | null;
  content: string | null;
  date: string | null;
  language: string | null;
  documentType: string | null;
  vendorName: string | null;
  invoiceNumber: string | null;
  logger: Logger;
}

/**
 * Shared helper that writes classification data to the documents table
 * and triggers tag embedding. Used by all extraction processors.
 *
 * Wrapped entirely in try/catch -- classification failures never fail
 * the parent extraction job.
 */
export async function classifyFromExtraction(
  params: ClassifyFromExtractionParams,
): Promise<void> {
  const {
    filePath,
    teamId,
    title,
    summary,
    tags,
    content,
    date,
    language,
    documentType,
    vendorName,
    invoiceNumber,
    logger,
  } = params;

  try {
    const db = getDb();
    const pathTokens = filePath;

    let finalTitle = title;
    if (!finalTitle || finalTitle.trim().length === 0) {
      finalTitle = generateFallbackTitle({
        documentType,
        vendorName,
        invoiceNumber,
        date,
        fileName: filePath.at(-1) ?? null,
      });
    }

    const updatedDocs = await updateDocumentWithRetry(
      db,
      {
        pathTokens,
        teamId,
        title: finalTitle ?? undefined,
        summary: summary ?? undefined,
        content: content ? limitWords(content, 10000) : undefined,
        date: date ?? undefined,
        language: mapLanguageCodeToPostgresConfig(language),
        processingStatus: "completed",
      },
      logger,
    );

    if (!updatedDocs || updatedDocs.length === 0) {
      logger.warn("classifyFromExtraction: document not found for update", {
        filePath: filePath.join("/"),
        teamId,
      });
      return;
    }

    const doc = updatedDocs[0];
    if (!doc?.id) {
      logger.warn("classifyFromExtraction: update returned invalid data", {
        filePath: filePath.join("/"),
        teamId,
      });
      return;
    }

    if (tags && tags.length > 0) {
      await triggerJob(
        "embed-document-tags",
        { documentId: doc.id, tags, teamId },
        "documents",
        { jobId: `embed-tags_${teamId}_${doc.id}` },
      );

      logger.info("Triggered embed-document-tags", {
        documentId: doc.id,
        tagsCount: tags.length,
      });
    }

    logger.info("classifyFromExtraction completed", {
      documentId: doc.id,
      hasTitle: !!finalTitle,
      hasTags: !!(tags && tags.length > 0),
    });
  } catch (error) {
    logger.warn("classifyFromExtraction failed (non-critical)", {
      filePath: filePath.join("/"),
      teamId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function generateFallbackTitle(params: {
  documentType: string | null;
  vendorName: string | null;
  invoiceNumber: string | null;
  date: string | null;
  fileName: string | null;
}): string {
  const { documentType, vendorName, invoiceNumber, date, fileName } = params;

  const parts: string[] = [];

  const typeLabel =
    documentType === "invoice"
      ? "Invoice"
      : documentType === "receipt"
        ? "Receipt"
        : "Document";

  if (invoiceNumber) {
    parts.push(`${typeLabel} ${invoiceNumber}`);
  } else {
    parts.push(typeLabel);
  }

  if (vendorName) {
    parts.push(`from ${vendorName}`);
  }

  if (date) {
    parts.push(`- ${date}`);
  }

  const generated = parts.join(" ");

  if (generated === "Document" && fileName) {
    return fileName.replace(/\.[^/.]+$/, "");
  }

  return generated;
}
