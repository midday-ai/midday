import type { Database } from "@midday/db/client";
import {
  createInbox,
  groupRelatedInboxItems,
  updateInbox,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";
import { createClient } from "@midday/supabase/job";
import { getExtensionFromMimeType } from "@midday/utils";
import { nanoid } from "nanoid";

export type InboxUploadPlatform =
  | "dashboard"
  | "whatsapp"
  | "telegram"
  | "slack"
  | "sendblue";

export type ProcessInboxUploadParams = {
  db: Database;
  teamId: string;
  userId?: string;
  fileData: Uint8Array;
  mimeType: string;
  fileName?: string;
  caption?: string;
  referenceId?: string;
  platform: InboxUploadPlatform;
  platformMeta?: Record<string, unknown>;
};

export type ProcessInboxUploadResult = {
  inboxId: string;
  status: "processed" | "other" | "pending";
  displayName: string | null;
  amount: number | null;
  currency: string | null;
  date: string | null;
  type: "invoice" | "expense" | "other" | null;
  invoiceNumber?: string | null;
  taxAmount?: number | null;
  taxType?: string | null;
};

export function isSupportedInboxUploadMediaType(mediaType?: string | null) {
  if (!mediaType) return false;

  return (
    mediaType.startsWith("image/") ||
    mediaType === "application/pdf" ||
    mediaType === "application/octet-stream"
  );
}

function resolveFileName(fileName: string | undefined, mimeType: string) {
  const baseFileName = fileName?.trim() || `upload_${nanoid(8)}`;
  const hasExtension = /\.[^.]+$/.test(baseFileName);

  return hasExtension
    ? baseFileName
    : `${baseFileName}${getExtensionFromMimeType(mimeType)}`;
}

export function formatInboxResultMessage(
  result: ProcessInboxUploadResult,
): string {
  if (result.status === "other") {
    return `${result.displayName ?? "File"} added to your inbox.`;
  }

  if (result.status === "pending") {
    return `${result.displayName ?? "File"} added to your inbox — needs manual review.`;
  }

  const isInvoice = result.type === "invoice";
  const lines: string[] = [];

  if (result.displayName) lines.push(result.displayName);
  if (result.invoiceNumber) lines.push(result.invoiceNumber);

  const amountParts: string[] = [];
  if (result.amount != null && result.currency)
    amountParts.push(`${result.amount} ${result.currency}`);
  if (result.taxAmount != null && result.taxType)
    amountParts.push(`${result.taxType} ${result.taxAmount}`);
  if (amountParts.length > 0)
    lines.push(
      amountParts.join(" (incl. ") + (amountParts.length > 1 ? ")" : ""),
    );

  if (result.date) lines.push(isInvoice ? `Due: ${result.date}` : result.date);

  const header = isInvoice ? "Invoice received" : "Receipt received";
  const footer = isInvoice
    ? "Added to your inbox."
    : "Added to your inbox — we'll match it to a transaction automatically.";

  return `${header}\n${lines.join("\n")}\n${footer}`;
}

export function formatProcessedUploadSummary(result: ProcessInboxUploadResult) {
  if (result.status === "other") {
    return `${result.displayName ?? "File"} was added to your inbox as an other document.`;
  }

  if (result.status === "pending") {
    return `${result.displayName ?? "File"} was added to your inbox, but automatic extraction needs manual review.`;
  }

  const details = [
    result.displayName ?? "Document",
    result.amount != null && result.currency
      ? `${result.amount} ${result.currency}`
      : null,
    result.date,
  ].filter(Boolean);

  return `${details.join(" • ")} was added to your inbox.`;
}

export async function processInboxUpload(
  params: ProcessInboxUploadParams,
): Promise<ProcessInboxUploadResult> {
  const {
    db,
    teamId,
    userId,
    fileData,
    mimeType,
    fileName,
    caption,
    referenceId,
    platform,
    platformMeta,
  } = params;

  const supabase = createClient();
  const resolvedFileName = resolveFileName(fileName, mimeType);
  const filePath = [teamId, "inbox", resolvedFileName];
  const filePathStr = filePath.join("/");

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("vault")
    .upload(filePathStr, fileData, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  const inboxData = await createInbox(db, {
    displayName: caption || resolvedFileName,
    teamId,
    filePath,
    fileName: resolvedFileName,
    contentType: mimeType,
    size: fileData.byteLength,
    referenceId,
    meta: {
      source: platform,
      submittedByUserId: userId ?? null,
      sourceMetadata: platformMeta,
    },
    status: "processing",
  });

  if (!inboxData) {
    throw new Error("Failed to create inbox entry");
  }

  try {
    const pathForSignedUrl = uploadData?.path || filePathStr;
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("vault")
        .createSignedUrl(pathForSignedUrl, 1800);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(
        `Failed to create signed URL: ${signedUrlError?.message || "No URL returned"}`,
      );
    }

    const document = new DocumentClient();
    const result = await document.getInvoiceOrReceipt({
      documentUrl: signedUrlData.signedUrl,
      mimetype: mimeType,
    });

    if (result.document_type === "other") {
      const updatedOther = await updateInboxWithProcessedData(db, {
        id: inboxData.id,
        displayName: result.name ?? (caption || resolvedFileName),
        type: "other",
        status: "other",
      });

      return {
        inboxId: inboxData.id,
        status: "other",
        displayName: updatedOther?.displayName ?? (caption || resolvedFileName),
        amount: null,
        currency: null,
        date: null,
        type: "other",
      };
    }

    const updatedInbox = await updateInboxWithProcessedData(db, {
      id: inboxData.id,
      amount: result.amount ?? undefined,
      currency: result.currency ?? undefined,
      displayName: result.name ?? undefined,
      website: result.website ?? undefined,
      date: result.date ?? undefined,
      taxAmount: result.tax_amount ?? undefined,
      taxRate: result.tax_rate ?? undefined,
      taxType: result.tax_type ?? undefined,
      type: result.type as "invoice" | "expense" | null | undefined,
      invoiceNumber: result.invoice_number ?? undefined,
      status: "analyzing",
    });

    try {
      await groupRelatedInboxItems(db, {
        inboxId: inboxData.id,
        teamId,
      });
    } catch (error) {
      logger.error("Failed to group related inbox items", {
        inboxId: inboxData.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    await triggerJob(
      "process-document",
      {
        mimetype: mimeType,
        filePath,
        teamId,
      },
      "documents",
    );

    await triggerJob(
      "batch-process-matching",
      {
        teamId,
        inboxIds: [inboxData.id],
      },
      "inbox",
    );

    return {
      inboxId: inboxData.id,
      status: "processed",
      displayName: updatedInbox?.displayName ?? (caption || resolvedFileName),
      amount: updatedInbox?.amount ?? null,
      currency: updatedInbox?.currency ?? null,
      date: updatedInbox?.date ?? null,
      type: updatedInbox?.type ?? null,
      invoiceNumber: updatedInbox?.invoiceNumber ?? null,
      taxAmount: updatedInbox?.taxAmount ?? null,
      taxType: updatedInbox?.taxType ?? null,
    };
  } catch (error) {
    logger.error("Failed to process inbox upload", {
      inboxId: inboxData.id,
      platform,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    await updateInbox(db, {
      id: inboxData.id,
      teamId,
      status: "pending",
    });

    return {
      inboxId: inboxData.id,
      status: "pending",
      displayName: caption || resolvedFileName,
      amount: null,
      currency: null,
      date: null,
      type: null,
    };
  }
}
