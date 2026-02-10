import { loadDocument } from "@midday/documents/loader";
import {
  getContentSample,
  isMimeTypeSupportedForProcessing,
} from "@midday/documents/utils";
import { triggerJob, triggerJobAndWait } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { ProcessDocumentPayload } from "../../schemas/documents";
import { getDb } from "../../utils/db";
import { detectFileTypeFromBlob } from "../../utils/detect-file-type";
import { updateDocumentWithRetry } from "../../utils/document-update";
import {
  NonRetryableError,
  UnsupportedFileTypeError,
} from "../../utils/error-classification";
import {
  convertHeicToJpeg,
  MAX_HEIC_FILE_SIZE,
} from "../../utils/image-processing";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

/**
 * Process documents and images for classification
 * Handles HEIC conversion, document loading, and triggers classification
 */
export class ProcessDocumentProcessor extends BaseProcessor<ProcessDocumentPayload> {
  async process(job: Job<ProcessDocumentPayload>): Promise<void> {
    const processStartTime = Date.now();
    const { mimetype, filePath, teamId } = job.data;
    const supabase = createClient();
    const db = getDb();
    const fileName = filePath.join("/");

    this.logger.info("Starting process-document job", {
      jobId: job.id,
      teamId,
      fileName,
      mimetype,
    });

    // Create activity for document upload
    try {
      await triggerJob(
        "notification",
        {
          type: "document_uploaded",
          teamId,
          fileName: filePath.join("/"),
          filePath: filePath,
          mimeType: mimetype,
        },
        "notifications",
      );
    } catch (error) {
      // Don't fail the entire process if notification fails
      this.logger.warn("Failed to trigger document_uploaded notification", {
        teamId,
        fileName: filePath.join("/"),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    try {
      const fileName = filePath.join("/");
      let fileData: Blob | null = null;
      let processedMimetype = mimetype;

      // Download file once and reuse for all operations
      // For HEIC files, we'll convert and reuse the converted data
      if (mimetype === "image/heic") {
        this.logger.info("Converting HEIC to JPG", { filePath: fileName });

        const { data } = await withTimeout(
          supabase.storage.from("vault").download(fileName),
          TIMEOUTS.FILE_DOWNLOAD,
          `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
        );

        if (!data) {
          throw new NonRetryableError(
            "File not found",
            undefined,
            "validation",
          );
        }

        await this.updateProgress(
          job,
          this.ProgressMilestones.FETCHED,
          "HEIC file downloaded",
        );

        const buffer = await data.arrayBuffer();

        // Log file size for debugging memory issues
        const fileSizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2);
        this.logger.info("HEIC file size", {
          fileName,
          sizeBytes: buffer.byteLength,
          sizeMB: fileSizeMB,
        });

        // Skip AI classification for very large HEIC files to prevent OOM
        // 15MB HEIC ≈ 24MP ≈ ~100MB decoded. Complete with filename instead.
        if (buffer.byteLength > MAX_HEIC_FILE_SIZE) {
          this.logger.warn(
            "HEIC file too large for AI classification - completing with filename",
            {
              fileName,
              teamId,
              sizeBytes: buffer.byteLength,
              maxSizeBytes: MAX_HEIC_FILE_SIZE,
            },
          );

          await updateDocumentWithRetry(
            db,
            {
              pathTokens: filePath,
              teamId,
              title: filePath.at(-1) ?? "Large HEIC Image",
              summary: `Large image (${fileSizeMB}MB) - AI classification skipped`,
              processingStatus: "completed",
            },
            this.logger,
          );
          return;
        }

        // Try to convert HEIC to JPEG - use graceful degradation if it fails (e.g., OOM)
        try {
          const { buffer: image } = await convertHeicToJpeg(
            buffer,
            this.logger,
          );

          await this.updateProgress(
            job,
            this.ProgressMilestones.PROCESSING,
            "HEIC converted to JPEG",
          );

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

          await this.updateProgress(
            job,
            this.ProgressMilestones.HALFWAY,
            "Converted image uploaded",
          );

          // Create Blob from converted image for reuse
          fileData = new Blob([image], { type: "image/jpeg" });
          processedMimetype = "image/jpeg";
        } catch (conversionError) {
          // HEIC conversion failed (possibly OOM) - complete with fallback
          // User can still see the file and retry later
          this.logger.error(
            "HEIC conversion failed - completing with fallback",
            {
              fileName,
              teamId,
              fileSizeMB,
              error:
                conversionError instanceof Error
                  ? conversionError.message
                  : "Unknown error",
            },
          );

          await updateDocumentWithRetry(
            db,
            {
              pathTokens: filePath,
              teamId,
              title: filePath.at(-1) ?? "HEIC Image",
              summary: "HEIC conversion failed - original file preserved",
              processingStatus: "completed",
            },
            this.logger,
          );
          return;
        }
      } else {
        // Download file for non-HEIC files
        const downloadStartTime = Date.now();
        this.logger.info("Downloading file from storage", {
          jobId: job.id,
          fileName,
          teamId,
          mimetype: processedMimetype,
        });

        const { data } = await withTimeout(
          supabase.storage.from("vault").download(fileName),
          TIMEOUTS.FILE_DOWNLOAD,
          `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
        );

        const downloadDuration = Date.now() - downloadStartTime;
        this.logger.info("File downloaded", {
          jobId: job.id,
          fileName,
          teamId,
          fileSize: data?.size,
          duration: `${downloadDuration}ms`,
        });

        if (!data) {
          throw new NonRetryableError(
            "File not found",
            undefined,
            "validation",
          );
        }

        fileData = data;
      }

      // Detect actual file type for application/octet-stream by checking magic bytes
      if (processedMimetype === "application/octet-stream" && fileData) {
        try {
          const detectionResult = await detectFileTypeFromBlob(fileData);

          if (detectionResult.detected) {
            this.logger.info(
              "Detected file type from application/octet-stream",
              {
                fileName,
                teamId,
                detectedMimetype: detectionResult.mimetype,
              },
            );
            processedMimetype = detectionResult.mimetype;
            // Recreate Blob with correct mimetype for further processing
            fileData = new Blob([detectionResult.buffer], {
              type: detectionResult.mimetype,
            });
          } else {
            // Unknown file type - log warning and skip processing
            this.logger.warn(
              "application/octet-stream file type could not be detected - skipping processing",
              {
                fileName,
                teamId,
                header: detectionResult.buffer.subarray(0, 8).toString("hex"),
              },
            );
            // Update document status to indicate it's not processable
            await updateDocumentWithRetry(
              db,
              {
                pathTokens: filePath,
                teamId,
                processingStatus: "failed",
              },
              this.logger,
            );
            return;
          }
        } catch (error) {
          this.logger.error(
            "Failed to detect file type for application/octet-stream - will attempt to process as PDF",
            {
              fileName,
              teamId,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          );
          // If detection fails, try to process as PDF (most common case)
          // Re-download the file since we may have consumed the buffer
          const { data: redownloadedData } = await withTimeout(
            supabase.storage.from("vault").download(fileName),
            TIMEOUTS.FILE_DOWNLOAD,
            `File re-download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
          );
          if (redownloadedData) {
            fileData = redownloadedData;
            processedMimetype = "application/pdf";
          } else {
            throw new Error("Failed to re-download file for type detection");
          }
        }
      }

      // Check if file type is supported - throw error for queue config to handle
      if (!isMimeTypeSupportedForProcessing(processedMimetype)) {
        throw new UnsupportedFileTypeError(processedMimetype, fileName);
      }

      // If the file is an image, trigger image classification
      if (processedMimetype.startsWith("image/")) {
        this.logger.info("Triggering image classification", {
          fileName,
          teamId,
        });

        // Trigger image classification via BullMQ and wait for completion
        // This ensures errors propagate and status is properly updated
        // Use CLASSIFICATION_JOB_WAIT timeout to ensure we don't timeout before the child job completes
        // Child job uses AI_CLASSIFICATION (90s) + FILE_DOWNLOAD (60s), so we need at least 150s
        // NOTE: Job IDs must include timestamp for reprocessing to work - BullMQ returns existing
        // jobs instead of creating new ones when IDs match (completed retained 24h, failed 7 days)
        await triggerJobAndWait(
          "classify-image",
          {
            fileName,
            teamId,
          },
          "documents",
          {
            jobId: `classify-img_${teamId}_${fileName}_${Date.now()}`,
            timeout: TIMEOUTS.CLASSIFICATION_JOB_WAIT,
          },
        );

        return;
      }

      // Process document: load and classify
      // Use graceful degradation - if content extraction fails, complete with null values
      let document: string | null = null;
      let documentLoadFailed = false;

      try {
        const parseStartTime = Date.now();
        this.logger.info("Parsing document content (extracting text)", {
          jobId: job.id,
          fileName,
          teamId,
          mimetype: processedMimetype,
          fileSize: fileData?.size,
        });

        // 60 second timeout for document parsing - prevents hanging on corrupt/problematic files
        const loadedDoc = await withTimeout(
          loadDocument({
            content: fileData,
            metadata: { mimetype: processedMimetype },
          }),
          60_000,
          "Document parsing timed out after 60000ms",
        );

        if (!loadedDoc) {
          throw new Error("Failed to load document");
        }

        document = loadedDoc;
        const parseDuration = Date.now() - parseStartTime;
        this.logger.info("Document parsed successfully", {
          jobId: job.id,
          fileName,
          teamId,
          contentLength: document.length,
          duration: `${parseDuration}ms`,
        });
      } catch (error) {
        // Log error but don't fail - complete with null values so user can still access file
        documentLoadFailed = true;
        this.logger.warn(
          "Failed to extract document content - completing with fallback",
          {
            jobId: job.id,
            fileName,
            teamId,
            mimetype: processedMimetype,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        );
      }

      // If document loading failed, complete with null values
      // User can still view/download the file and retry classification later
      if (documentLoadFailed || !document) {
        this.logger.info(
          "Completing document with null values - user can retry classification",
          {
            fileName,
            teamId,
            documentLoadFailed,
          },
        );
        await updateDocumentWithRetry(
          db,
          {
            pathTokens: filePath,
            teamId,
            title: undefined, // null - UI will show filename + retry option
            summary: undefined,
            processingStatus: "completed",
          },
          this.logger,
        );
        return;
      }

      // Edge case: Validate document has content
      if (document.trim().length === 0) {
        this.logger.warn("Document loaded but has no extractable content", {
          fileName,
          teamId,
        });
        // Complete with null - user can still access the file
        await updateDocumentWithRetry(
          db,
          {
            pathTokens: filePath,
            teamId,
            title: undefined,
            summary: undefined,
            processingStatus: "completed",
          },
          this.logger,
        );
        return;
      }

      const sample = getContentSample(document);

      // Edge case: Validate sample has content
      if (!sample || sample.trim().length === 0) {
        this.logger.warn(
          "Document sample is empty, marking as completed without classification",
          {
            fileName,
            teamId,
            contentLength: document.length,
          },
        );
        // Mark as completed - document exists but has no extractable content to classify
        await updateDocumentWithRetry(
          db,
          {
            pathTokens: filePath,
            teamId,
            processingStatus: "completed",
          },
          this.logger,
        );
        return;
      }

      const classificationStartTime = Date.now();
      this.logger.info("Triggering document classification", {
        jobId: job.id,
        fileName,
        teamId,
        contentLength: document.length,
        sampleLength: sample.length,
      });

      // Trigger document classification via BullMQ and wait for completion
      // This ensures errors propagate and status is properly updated
      // Use CLASSIFICATION_JOB_WAIT timeout to ensure we don't timeout before the child job completes
      // Child job uses AI_CLASSIFICATION (90s), so we need at least that + overhead
      // NOTE: Job IDs must include timestamp for reprocessing to work - BullMQ returns existing
      // jobs instead of creating new ones when IDs match (completed retained 24h, failed 7 days)
      const classificationJobResult = await triggerJobAndWait(
        "classify-document",
        {
          content: sample,
          fileName,
          teamId,
        },
        "documents",
        {
          jobId: `classify-doc_${teamId}_${fileName}_${Date.now()}`,
          timeout: TIMEOUTS.CLASSIFICATION_JOB_WAIT,
        },
      );

      const classificationDuration = Date.now() - classificationStartTime;
      this.logger.info("Document classification job completed", {
        jobId: job.id,
        fileName,
        teamId,
        triggeredJobId: classificationJobResult.id,
        triggeredJobName: "classify-document",
        duration: `${classificationDuration}ms`,
      });

      // Create activity for successful document processing
      try {
        await triggerJob(
          "notification",
          {
            type: "document_processed",
            teamId,
            fileName,
            filePath: filePath,
            mimeType: mimetype,
            contentLength: document.length,
            sampleLength: sample.length,
          },
          "notifications",
        );
      } catch (error) {
        // Don't fail the entire process if notification fails
        this.logger.warn("Failed to trigger document_processed notification", {
          teamId,
          fileName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      const totalDuration = Date.now() - processStartTime;
      this.logger.info("process-document job completed successfully", {
        jobId: job.id,
        fileName,
        teamId,
        contentLength: document.length,
        sampleLength: sample.length,
        totalDuration: `${totalDuration}ms`,
      });
    } catch (error) {
      this.logger.error("Document processing failed", {
        fileName: filePath.join("/"),
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Status update to "failed" is handled by handleDocumentJobFinalFailure
      // in documents.config.ts when all retries are exhausted
      throw error;
    }
  }
}
