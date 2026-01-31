import {
  createInbox,
  getInboxByFilePath,
  getTeamById,
  groupRelatedInboxItems,
  updateInbox,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { triggerJob, triggerJobAndWait } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { ProcessAttachmentPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { NonRetryableError } from "../../utils/error-classification";
import { convertHeicToJpeg } from "../../utils/image-processing";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

export class ProcessAttachmentProcessor extends BaseProcessor<ProcessAttachmentPayload> {
  async process(job: Job<ProcessAttachmentPayload>): Promise<void> {
    const processStartTime = Date.now();
    const {
      teamId,
      mimetype,
      size,
      filePath,
      referenceId,
      website,
      senderEmail,
      inboxAccountId,
    } = job.data;
    const supabase = createClient();
    const db = getDb();

    const fileName = filePath.join("/");
    const filename = filePath.at(-1);
    let processedMimetype = mimetype;

    this.logger.info("Starting process-attachment job", {
      jobId: job.id,
      fileName,
      teamId,
      mimetype,
      size,
      referenceId,
      inboxAccountId,
    });

    // Edge case: Validate filename exists
    if (!filename || filename.trim().length === 0) {
      throw new Error("Invalid file path: filename is missing");
    }

    // Edge case: Validate file size is reasonable
    if (size <= 0) {
      throw new Error(`Invalid file size: ${size} bytes`);
    }

    // Check if inbox item already exists FIRST (for retry scenarios or manual uploads)
    const inboxCheckStartTime = Date.now();
    this.logger.info("Checking for existing inbox item", {
      jobId: job.id,
      filePath: fileName,
      teamId,
    });

    let inboxData = await getInboxByFilePath(db, {
      filePath,
      teamId,
    });

    const inboxCheckDuration = Date.now() - inboxCheckStartTime;
    this.logger.info("Inbox item check completed", {
      jobId: job.id,
      filePath: fileName,
      existingItem: !!inboxData,
      existingStatus: inboxData?.status,
      teamId,
      duration: `${inboxCheckDuration}ms`,
    });

    // Convert HEIC to JPEG if needed (do this after inbox check so we can update contentType immediately)
    if (mimetype === "image/heic") {
      const heicStartTime = Date.now();
      this.logger.info("Converting HEIC to JPEG", {
        filePath: fileName,
        jobId: job.id,
      });

      const { data } = await withTimeout(
        supabase.storage.from("vault").download(fileName),
        TIMEOUTS.FILE_DOWNLOAD,
        `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
      );

      if (!data) {
        throw new NonRetryableError("File not found", undefined, "validation");
      }

      const buffer = await data.arrayBuffer();

      // Convert HEIC to JPEG using shared utility
      const { buffer: image } = await convertHeicToJpeg(buffer, this.logger);

      // Upload the converted image
      const { data: uploadedData } = await withTimeout(
        supabase.storage.from("vault").upload(fileName, image, {
          contentType: "image/jpeg",
          upsert: true,
        }),
        TIMEOUTS.FILE_UPLOAD,
        `File upload timed out after ${TIMEOUTS.FILE_UPLOAD}ms`,
      );

      if (!uploadedData) {
        throw new Error("Failed to upload converted image");
      }

      processedMimetype = "image/jpeg";
      const heicDuration = Date.now() - heicStartTime;
      this.logger.info("HEIC conversion completed", {
        filePath: fileName,
        jobId: job.id,
        duration: `${heicDuration}ms`,
      });

      // Update contentType immediately if item exists (so frontend can show image sooner)
      if (inboxData && inboxData.contentType === "image/heic") {
        await updateInbox(db, {
          id: inboxData.id,
          teamId,
          contentType: "image/jpeg",
        });
        this.logger.info("Updated contentType to jpeg", {
          inboxId: inboxData.id,
          jobId: job.id,
        });
      }
    }

    // Create inbox item if it doesn't exist (for non-manual uploads)
    // or update existing item status if it was created manually
    if (!inboxData) {
      this.logger.info("Creating new inbox item", {
        filePath: fileName,
        referenceId,
      });
      const createdData = await createInbox(db, {
        // NOTE: If we can't parse the name using OCR this will be the fallback name
        displayName: filename ?? "Unknown",
        teamId,
        filePath,
        fileName: filename ?? "Unknown",
        contentType: processedMimetype, // Use processed mimetype (jpeg if converted from heic)
        size,
        referenceId,
        website,
        senderEmail,
        inboxAccountId,
        status: "processing", // Set as processing when created by job
      });

      // Check if this was a duplicate (createInbox returns existing item on conflict)
      // We compare the filePath to see if this is a different job trying to create the same item
      if (createdData) {
        const existingFilePath = createdData.filePath?.join("/");
        const currentFilePath = filePath.join("/");

        // If the filePath is different, this is a duplicate from a different upload
        if (existingFilePath && existingFilePath !== currentFilePath) {
          this.logger.info(
            "Found existing inbox item with different filePath, skipping duplicate",
            {
              inboxId: createdData.id,
              status: createdData.status,
              referenceId,
              existingFilePath,
              currentFilePath,
            },
          );
          return;
        }

        // If the item is already processed (not new/processing), skip
        if (
          createdData.status !== "processing" &&
          createdData.status !== "new"
        ) {
          this.logger.info(
            "Found existing inbox item via referenceId conflict, skipping duplicate",
            {
              inboxId: createdData.id,
              status: createdData.status,
              referenceId,
              filePath: fileName,
            },
          );
          return;
        }
      }

      inboxData = createdData;
    } else if (inboxData.status === "processing") {
      this.logger.info(
        "Found existing inbox item already in processing status",
        {
          inboxId: inboxData.id,
          filePath: fileName,
        },
      );
    } else {
      this.logger.info("Found existing inbox item with status", {
        inboxId: inboxData.id,
        status: inboxData.status,
        filePath: fileName,
      });
    }

    if (!inboxData) {
      throw new Error("Inbox data not found");
    }

    // Create signed URL and fetch team data in parallel (they don't depend on each other)
    const preProcessingStartTime = Date.now();
    this.logger.info(
      "Starting parallel pre-processing (signed URL + team data)",
      {
        jobId: job.id,
        inboxId: inboxData.id,
        fileName,
        teamId,
      },
    );

    const [signedUrlResult, teamData] = await Promise.all([
      // Create signed URL for document processing
      // Use 10 minutes expiration to ensure URL doesn't expire during processing
      // (document processing timeout is 120s, plus buffer for retries and multiple passes)
      (async () => {
        const signedUrlStartTime = Date.now();
        const { data: signedUrlData } = await withTimeout(
          supabase.storage.from("vault").createSignedUrl(fileName, 600),
          TIMEOUTS.EXTERNAL_API,
          `Signed URL creation timed out after ${TIMEOUTS.EXTERNAL_API}ms`,
        );
        const signedUrlDuration = Date.now() - signedUrlStartTime;
        this.logger.info("Signed URL created", {
          jobId: job.id,
          inboxId: inboxData.id,
          duration: `${signedUrlDuration}ms`,
          expirationSeconds: 600,
        });
        return signedUrlData;
      })(),
      // Fetch team data to provide context for OCR extraction
      (async () => {
        const teamDataStartTime = Date.now();
        const teamDataResult = await getTeamById(db, teamId);
        const teamDataDuration = Date.now() - teamDataStartTime;
        this.logger.info("Team data fetched", {
          jobId: job.id,
          inboxId: inboxData.id,
          teamName: teamDataResult?.name,
          duration: `${teamDataDuration}ms`,
        });
        return teamDataResult;
      })(),
    ]);

    const preProcessingDuration = Date.now() - preProcessingStartTime;
    this.logger.info("Parallel pre-processing completed", {
      jobId: job.id,
      inboxId: inboxData.id,
      duration: `${preProcessingDuration}ms`,
    });

    if (!signedUrlResult) {
      throw new NonRetryableError("File not found", undefined, "validation");
    }

    try {
      const document = new DocumentClient();

      const docProcessingStartTime = Date.now();
      this.logger.info("Starting document processing (OCR/LLM extraction)", {
        jobId: job.id,
        inboxId: inboxData.id,
        mimetype: processedMimetype,
        referenceId,
        teamName: teamData?.name,
      });

      // Process document with timeout
      const result = await withTimeout(
        document.getInvoiceOrReceipt({
          documentUrl: signedUrlResult.signedUrl,
          mimetype: processedMimetype,
          companyName: teamData?.name,
        }),
        TIMEOUTS.DOCUMENT_PROCESSING,
        `Document processing timed out after ${TIMEOUTS.DOCUMENT_PROCESSING}ms`,
      );

      const docProcessingDuration = Date.now() - docProcessingStartTime;
      this.logger.info("Document processing completed", {
        jobId: job.id,
        inboxId: inboxData.id,
        resultType: result.type,
        documentType: result.document_type,
        hasAmount: !!result.amount,
        duration: `${docProcessingDuration}ms`,
      });

      // Check if document is classified as "other" (non-financial document)
      if (result.document_type === "other") {
        await updateInboxWithProcessedData(db, {
          id: inboxData.id,
          displayName: result.name ?? inboxData.displayName ?? undefined,
          type: "other",
          status: "other",
        });

        this.logger.info(
          "Document classified as other (non-financial), skipping matching",
          {
            jobId: job.id,
            inboxId: inboxData.id,
            fileName,
          },
        );

        return; // Skip embedding and transaction matching for non-financial documents
      }

      await updateInboxWithProcessedData(db, {
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
        status: "analyzing", // Keep analyzing until matching is complete
      });

      // Group related inbox items after storing invoice number
      try {
        await groupRelatedInboxItems(db, {
          inboxId: inboxData.id,
          teamId,
        });
      } catch (error) {
        this.logger.error("Failed to group related inbox items", {
          inboxId: inboxData.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Don't fail the entire process if grouping fails
      }

      // Trigger parallel jobs (non-blocking)
      // Process documents and embedding in parallel for better performance
      const parallelJobsStartTime = Date.now();
      this.logger.info(
        "Triggering parallel jobs (process-document + embed-inbox)",
        {
          jobId: job.id,
          inboxId: inboxData.id,
          teamId,
        },
      );

      // Trigger document processing (non-blocking, can run in parallel)
      const documentJobPromise = triggerJob(
        "process-document",
        {
          mimetype: processedMimetype,
          filePath,
          teamId,
        },
        "documents",
        { jobId: `process-doc_${teamId}_${filePath.join("/")}` },
      )
        .then((result) => {
          this.logger.info("Triggered process-document job", {
            jobId: job.id,
            inboxId: inboxData.id,
            triggeredJobId: result.id,
            triggeredJobName: "process-document",
          });
          return result;
        })
        .catch((error) => {
          this.logger.warn(
            "Failed to trigger document processing (non-critical)",
            {
              jobId: job.id,
              inboxId: inboxData.id,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          );
          // Don't fail the entire process if document processing fails
          return null;
        });

      // Wait for embed-inbox to complete before triggering matching
      // This ensures the embedding exists when batch-process-matching runs
      const embedStartTime = Date.now();
      let embedJobResult: Awaited<ReturnType<typeof triggerJobAndWait>> | null =
        null;

      this.logger.info("Starting embed-inbox with wait", {
        jobId: job.id,
        inboxId: inboxData.id,
        teamId,
      });

      try {
        embedJobResult = await triggerJobAndWait(
          "embed-inbox",
          {
            inboxId: inboxData.id,
            teamId,
          },
          "embeddings",
          { timeout: 60000 }, // 60 second timeout
        );

        const embedDuration = Date.now() - embedStartTime;
        this.logger.info("Embed-inbox job completed", {
          jobId: job.id,
          inboxId: inboxData.id,
          embedJobId: embedJobResult.id,
          duration: `${embedDuration}ms`,
        });

        // Now that embedding is complete, trigger matching
        const matchingStartTime = Date.now();

        try {
          const matchingJobResult = await triggerJob(
            "batch-process-matching",
            {
              teamId,
              inboxIds: [inboxData.id],
            },
            "inbox",
          );

          const matchingDuration = Date.now() - matchingStartTime;
          this.logger.info("Triggered batch-process-matching", {
            jobId: job.id,
            inboxId: inboxData.id,
            embedJobId: embedJobResult.id,
            matchingJobId: matchingJobResult.id,
            triggeredJobName: "batch-process-matching",
            duration: `${matchingDuration}ms`,
          });
        } catch (error) {
          this.logger.error("Failed to trigger batch-process-matching job", {
            jobId: job.id,
            inboxId: inboxData.id,
            error: error instanceof Error ? error.message : "Unknown error",
            errorStack: error instanceof Error ? error.stack : undefined,
          });
          // Don't fail the entire process if matching job fails to enqueue
          // The matching can be retried later via scheduler or manual trigger
          // However, we should update status to pending to prevent getting stuck in "analyzing"
          try {
            await updateInboxWithProcessedData(db, {
              id: inboxData.id,
              status: "pending",
            });
            this.logger.info(
              "Updated inbox status to pending after matching job failed to trigger",
              {
                jobId: job.id,
                inboxId: inboxData.id,
              },
            );
          } catch (updateError) {
            this.logger.error(
              "Failed to update inbox status after matching job failure",
              {
                jobId: job.id,
                inboxId: inboxData.id,
                error:
                  updateError instanceof Error
                    ? updateError.message
                    : "Unknown error",
              },
            );
          }
        }
      } catch (error) {
        this.logger.error("Failed to complete embed-inbox job", {
          jobId: job.id,
          inboxId: inboxData.id,
          error: error instanceof Error ? error.message : "Unknown error",
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        // If embedding fails, update status to pending so it can be retried
        try {
          await updateInboxWithProcessedData(db, {
            id: inboxData.id,
            status: "pending",
          });
          this.logger.info(
            "Updated inbox status to pending after embed-inbox job failed",
            {
              jobId: job.id,
              inboxId: inboxData.id,
            },
          );
        } catch (updateError) {
          this.logger.error(
            "Failed to update inbox status after embed-inbox failure",
            {
              jobId: job.id,
              inboxId: inboxData.id,
              error:
                updateError instanceof Error
                  ? updateError.message
                  : "Unknown error",
            },
          );
        }
        // Don't throw - allow document processing to continue
      }

      // Wait for document processing to complete (non-blocking, but log completion)
      const documentJobResult = await Promise.allSettled([documentJobPromise]);
      const parallelJobsDuration = Date.now() - parallelJobsStartTime;
      this.logger.info("Parallel jobs completed", {
        jobId: job.id,
        inboxId: inboxData.id,
        documentJobStatus: documentJobResult[0]?.status,
        embedJobCompleted: embedJobResult !== null,
        duration: `${parallelJobsDuration}ms`,
      });

      // If embed-inbox failed, matching will be handled by the scheduler when embedding eventually completes

      const totalDuration = Date.now() - processStartTime;
      this.logger.info("process-attachment job completed successfully", {
        jobId: job.id,
        inboxId: inboxData.id,
        teamId,
        totalDuration: `${totalDuration}ms`,
      });
    } catch (error) {
      this.logger.error("Document processing failed", {
        inboxId: inboxData.id,
        error: error instanceof Error ? error.message : "Unknown error",
        referenceId,
        mimetype: processedMimetype,
        originalMimetype: mimetype,
      });

      // Re-throw timeout errors to trigger retry
      if (error instanceof Error && error.name === "AbortError") {
        this.logger.warn(
          "Document processing failed with retryable error, will retry",
          {
            inboxId: inboxData.id,
            referenceId,
            errorType: error.name,
            errorMessage: error.message,
          },
        );
        throw error;
      }

      // For non-retryable errors, mark as pending with fallback name
      this.logger.info(
        "Document processing failed, marking as pending with fallback name",
        {
          inboxId: inboxData.id,
          referenceId,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      );

      await updateInbox(db, {
        id: inboxData.id,
        teamId,
        status: "pending",
      });

      throw error;
    }
  }
}
