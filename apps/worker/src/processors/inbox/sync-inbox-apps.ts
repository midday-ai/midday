import { DropboxProvider } from "@midday/app-store/dropbox/server";
import { GoogleDriveProvider } from "@midday/app-store/google-drive/server";
import {
  getExistingInboxAttachmentsByReferenceIds,
  getInboxAppsByTeamId,
  getInboxBlocklist,
  updateDropboxConnection,
  updateGoogleDriveConnection,
} from "@midday/db/queries";
import { separateBlocklistEntries } from "@midday/db/utils/blocklist";
import { isAuthenticationError } from "@midday/inbox/utils";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import { ensureFileExtension } from "@midday/utils";
import type { Job } from "bullmq";
import type { InboxProviderSyncTeamPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { processBatch } from "../../utils/process-batch";
import { BaseProcessor } from "../base";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const BATCH_SIZE = 5;

/**
 * Sync inbox apps processor - handles Dropbox and Google Drive connections from apps table
 * Triggered by team-based scheduler or webhook notifications
 */
export class SyncInboxAppsProcessor extends BaseProcessor<InboxProviderSyncTeamPayload> {
  async process(job: Job<InboxProviderSyncTeamPayload>): Promise<{
    teamId: string;
    attachmentsProcessed: number;
    syncedAt: string;
  }> {
    const { teamId, manualSync = false } = job.data;
    const supabase = createClient();
    const db = getDb();

    if (!teamId) {
      throw new Error("teamId is required");
    }

    this.logger.info("Starting inbox apps sync", {
      teamId,
      manualSync,
    });

    try {
      // Get all inbox apps (Dropbox, Google Drive) for this team
      const inboxApps = await getInboxAppsByTeamId(db, teamId);

      if (inboxApps.length === 0) {
        this.logger.info("No inbox apps found for team", { teamId });
        return {
          teamId,
          attachmentsProcessed: 0,
          syncedAt: new Date().toISOString(),
        };
      }

      // Get blocklist entries for the team
      const blocklistEntries = await getInboxBlocklist(db, { teamId });
      const { blockedDomains, blockedEmails } =
        separateBlocklistEntries(blocklistEntries);

      let totalAttachmentsProcessed = 0;

      // Process each app (Dropbox or Google Drive)
      for (const app of inboxApps) {
        const config = app.config as {
          connections?: Array<{
            accountId: string;
            email: string;
            accessToken: string;
            refreshToken: string;
            expiryDate: string;
            externalId: string;
            folders: string[];
            lastAccessed: string;
            cursors?: Record<string, string>; // Dropbox only
            watchChannels?: Record<
              string,
              { id: string; resourceId: string; expiration: string }
            >; // Google Drive only
          }>;
        };

        const connections = config.connections || [];

        for (const connection of connections) {
          if (!connection.folders || connection.folders.length === 0) {
            continue; // Skip connections without selected folders
          }

          try {
            const maxResults = 50;
            const lastAccessed = connection.lastAccessed;
            const fullSync = manualSync;

            let attachments: Array<{
              id: string;
              filename: string;
              mimeType: string;
              size: number;
              referenceId: string;
              data: Buffer;
              website?: string;
              senderEmail?: string;
            }> = [];

            // Use provider-specific logic
            if (app.appId === "dropbox") {
              const provider = new DropboxProvider(db);
              attachments = await provider.getAttachments({
                id: connection.accountId,
                teamId,
                maxResults,
                lastAccessed,
                fullSync,
                connection: connection as any, // Type assertion needed due to interface differences
              });
            } else if (app.appId === "googledrive") {
              const provider = new GoogleDriveProvider(db);
              attachments = await provider.getAttachments({
                id: connection.accountId,
                teamId,
                maxResults,
                lastAccessed,
                fullSync,
                connection: connection as any, // Type assertion needed due to interface differences
              });
            } else {
              this.logger.warn("Unknown inbox app type", {
                appId: app.appId,
                teamId,
              });
              continue;
            }

            this.logger.info("Fetched attachments from provider", {
              appId: app.appId,
              connectionId: connection.accountId,
              teamId,
              totalFound: attachments.length,
            });

            // Filter out attachments that are already processed
            const referenceIds = attachments.map((a) => a.referenceId);
            const existingAttachmentsResults =
              await getExistingInboxAttachmentsByReferenceIds(db, {
                referenceIds,
                teamId,
              });

            const existingReferenceIdSet = new Set(
              existingAttachmentsResults.map((r) => r.referenceId),
            );

            // Track filtering statistics
            let skippedAlreadyProcessed = 0;
            let skippedTooLarge = 0;
            let skippedBlockedDomain = 0;
            let skippedBlockedEmail = 0;

            const filteredAttachments = attachments.filter((attachment) => {
              // Skip if already exists
              if (existingReferenceIdSet.has(attachment.referenceId)) {
                skippedAlreadyProcessed++;
                return false;
              }

              // Skip if too large
              if (attachment.size > MAX_ATTACHMENT_SIZE) {
                skippedTooLarge++;
                return false;
              }

              // Skip if domain is blocked
              if (attachment.website) {
                const domain = attachment.website.toLowerCase();
                if (blockedDomains.includes(domain)) {
                  skippedBlockedDomain++;
                  return false;
                }
              }

              // Skip if sender email is blocked
              if (attachment.senderEmail) {
                const email = attachment.senderEmail.toLowerCase();
                if (blockedEmails.includes(email)) {
                  skippedBlockedEmail++;
                  return false;
                }
              }

              return true;
            });

            this.logger.info("Attachment filtering summary", {
              appId: app.appId,
              connectionId: connection.accountId,
              totalFound: attachments.length,
              afterFiltering: filteredAttachments.length,
              skipped: {
                alreadyProcessed: skippedAlreadyProcessed,
                tooLarge: skippedTooLarge,
                blockedDomain: skippedBlockedDomain,
                blockedEmail: skippedBlockedEmail,
              },
            });

            // Upload attachments to storage
            const uploadedAttachments = await processBatch(
              filteredAttachments,
              BATCH_SIZE,
              async (batch) => {
                const results = [];
                for (const item of batch) {
                  const safeFilename = ensureFileExtension(
                    item.filename,
                    item.mimeType,
                  );

                  const { data: uploadData } = await supabase.storage
                    .from("vault")
                    .upload(`${teamId}/inbox/${safeFilename}`, item.data, {
                      contentType: item.mimeType,
                      upsert: true,
                    });

                  if (uploadData) {
                    results.push({
                      filePath: uploadData.path.split("/"),
                      size: item.size,
                      mimetype: item.mimeType,
                      website: item.website,
                      senderEmail: item.senderEmail,
                      referenceId: item.referenceId,
                      teamId,
                      // Note: inboxAccountId is optional for apps table connections
                    });
                  }
                }
                return results;
              },
            );

            if (uploadedAttachments.length > 0) {
              // Trigger process-attachment jobs
              await Promise.all(
                uploadedAttachments.map((attachment) =>
                  triggerJob("process-attachment", attachment, "inbox"),
                ),
              );

              // Send notification
              try {
                await triggerJob(
                  "notification",
                  {
                    type: "inbox_new",
                    teamId,
                    totalCount: uploadedAttachments.length,
                    inboxType: "sync",
                    source: "system",
                    provider: app.appId,
                  },
                  "notifications",
                );
              } catch (error) {
                this.logger.warn("Failed to trigger inbox_new notification", {
                  teamId,
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                });
              }

              totalAttachmentsProcessed += uploadedAttachments.length;
            }

            // Update connection lastAccessed
            if (app.appId === "dropbox") {
              await updateDropboxConnection(db, {
                teamId,
                connectionId: connection.accountId,
                lastAccessed: new Date().toISOString(),
              });
            } else if (app.appId === "googledrive") {
              await updateGoogleDriveConnection(db, {
                teamId,
                connectionId: connection.accountId,
                lastAccessed: new Date().toISOString(),
              });
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";

            this.logger.error("Error syncing connection", {
              appId: app.appId,
              connectionId: connection.accountId,
              teamId,
              error: errorMessage,
            });

            // Check if authentication error
            const isAuthError = isAuthenticationError(errorMessage);
            if (isAuthError) {
              this.logger.error(
                "Connection authentication failed - may need reconnection",
                {
                  appId: app.appId,
                  connectionId: connection.accountId,
                  teamId,
                  error: errorMessage,
                },
              );
              // Don't throw - continue with other connections
            }
            // Continue with next connection even if one fails
          }
        }
      }

      this.logger.info("Inbox apps sync completed", {
        teamId,
        totalAttachmentsProcessed,
      });

      return {
        teamId,
        attachmentsProcessed: totalAttachmentsProcessed,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";

      this.logger.error("Inbox apps sync failed", {
        teamId,
        error: errorMessage,
      });

      throw error;
    }
  }
}
