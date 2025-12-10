import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";
import { getExtensionFromMimeType } from "@midday/utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// Constants
export const POSTMARK_IP_RANGE = [
  "3.134.147.250",
  "50.31.156.6",
  "50.31.156.77",
  "18.217.206.57",
] as const;

export const FORWARD_FROM_EMAIL = "inbox@midday.ai";
export const ALLOWED_FORWARDING_EMAILS = [
  "forwarding-noreply@google.com",
] as const;
export const MIN_ATTACHMENT_SIZE_BYTES = 100000; // 100KB
export const FILE_EXTENSION_REGEX = /\.[^.]+$/;

// Types
export type InboxAttachment = {
  Name: string;
  Content: string;
  ContentType: string;
  ContentLength: number;
};

export type UploadResult = {
  display_name: string;
  team_id: string;
  file_path: string[];
  file_name: string;
  content_type: string;
  sender_email: string | null;
  reference_id: string;
  size: number;
};

/**
 * Generate a unique file name by appending a random 4-character string before the extension
 */
export function generateUniqueFileName(
  name: string,
  contentType: string,
): string {
  const hasExtension = FILE_EXTENSION_REGEX.test(name);
  if (hasExtension) {
    return name.replace(/(\.[^.]+)$/, (ext) => `_${nanoid(4)}${ext}`);
  }
  return `${name}_${nanoid(4)}${getExtensionFromMimeType(contentType)}`;
}

/**
 * Filter attachments by size - exclude small images (<100KB) except PDFs
 * This helps avoid processing logos, favicons, and tracking pixels
 */
export function filterAttachments(
  attachments: InboxAttachment[],
): InboxAttachment[] {
  return attachments.filter(
    (attachment) =>
      !(
        attachment.ContentLength < MIN_ATTACHMENT_SIZE_BYTES &&
        attachment.ContentType !== "application/pdf" &&
        attachment.ContentType !== "application/octet-stream"
      ),
  );
}

/**
 * Upload a single attachment to Supabase storage
 * Returns null if upload fails
 */
export async function uploadAttachment(
  supabase: SupabaseClient,
  teamId: string,
  attachment: InboxAttachment,
  senderEmail: string | null,
  subject: string | undefined,
  messageId: string,
) {
  try {
    const uniqueFileName = generateUniqueFileName(
      attachment.Name,
      attachment.ContentType,
    );

    const { data, error } = await supabase.storage
      .from("vault")
      .upload(
        `${teamId}/inbox/${uniqueFileName}`,
        Buffer.from(attachment.Content, "base64"),
        {
          contentType: attachment.ContentType,
          upsert: true,
        },
      );

    if (error || !data?.path) {
      logger.error("Failed to upload attachment", {
        fileName: attachment.Name,
        teamId,
        error: error?.message,
        size: attachment.ContentLength,
      });

      return null;
    }

    return {
      display_name: subject || attachment.Name,
      team_id: teamId,
      file_path: data.path.split("/"),
      file_name: uniqueFileName,
      content_type: attachment.ContentType,
      sender_email: senderEmail,
      reference_id: `${messageId}_${attachment.Name}`,
      size: attachment.ContentLength,
    };
  } catch (error) {
    logger.error("Exception during attachment upload", {
      fileName: attachment.Name,
      teamId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

/**
 * Trigger processing jobs for uploaded attachments
 * Triggers process-attachment jobs in parallel and sends notification
 */
export async function triggerProcessingJobs(
  teamId: string,
  uploadResults: UploadResult[],
) {
  // Trigger process-attachment jobs in parallel
  const jobPromises = uploadResults.map((item) =>
    triggerJob(
      "process-attachment",
      {
        filePath: item.file_path,
        mimetype: item.content_type,
        size: item.size,
        senderEmail: item.sender_email || undefined,
        teamId,
        referenceId: item.reference_id,
      },
      "inbox",
    ),
  );

  const jobResults = await Promise.all(jobPromises);

  logger.info("Triggered process-attachment jobs", {
    teamId,
    jobCount: jobResults.length,
    jobIds: jobResults.map((r) => r.id),
  });

  // Send notification for email attachments
  // This is a non-critical side effect - fire-and-forget to prevent webhook failures
  // if notification job fails to enqueue
  triggerJob(
    "notification",
    {
      type: "inbox_new",
      teamId,
      totalCount: uploadResults.length,
      inboxType: "email",
    },
    "notifications",
  ).catch((error) => {
    // Log error but don't propagate - notification failure shouldn't fail the webhook
    logger.warn("Failed to trigger inbox_new notification", {
      teamId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  });
}
