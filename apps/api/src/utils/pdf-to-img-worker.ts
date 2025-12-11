// Prevent TypeScript errors when using self in worker thread
// Required TypeScript declaration syntax for Bun worker thread global
// biome-ignore lint/style/noVar: declare var is required TypeScript syntax for worker globals
declare var self: Worker;

import { createLoggerWithContext } from "@midday/logger";
import { pdf } from "pdf-to-img";
import sharp from "sharp";

const logger = createLoggerWithContext("pdf-to-img-worker");

// Worker thread configuration constants
// These should match or be slightly more restrictive than main thread config
const CONVERSION_TIMEOUT_MS = 12000; // 12 seconds timeout (matches WORKER_INTERNAL_TIMEOUT_MS)
const MAX_PDF_SIZE = 30 * 1024 * 1024; // 30MB max PDF size (matches production limit)
const MAX_PREVIEW_WIDTH = 800; // Max width for preview images
const MAX_PREVIEW_HEIGHT = 1000; // Max height for preview images
const PREVIEW_SCALE = 0.75; // Low scale for fastest processing
const PREVIEW_QUALITY = 70; // Lower quality for smaller file size

/**
 * Worker message types for communication between main thread and worker
 * These types must match the types defined in pdf-to-img.ts
 */
type WorkerRequest = {
  id: string;
  type: "convert";
  data: ArrayBuffer;
  options?: {
    quality?: number;
  };
};

type WorkerSuccessResponse = {
  id: string;
  type: "success";
  buffer: ArrayBuffer;
  contentType: string;
};

type WorkerErrorResponse = {
  id: string;
  type: "error";
  error: string;
};

type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

/**
 * Convert PDF buffer to JPEG image buffer (first page only)
 * This runs in an isolated worker thread to prevent VM crashes
 */
async function convertPdfToImage(
  request: WorkerRequest,
): Promise<WorkerResponse> {
  const { id, data, options } = request;
  const { quality = PREVIEW_QUALITY } = options || {};

  try {
    // Check file size before processing
    if (data.byteLength > MAX_PDF_SIZE) {
      logger.error("PDF too large for conversion", {
        id,
        size: data.byteLength,
        maxSize: MAX_PDF_SIZE,
      });
      return {
        id,
        type: "error",
        error: `PDF too large for conversion: ${data.byteLength} bytes`,
      };
    }

    // Convert ArrayBuffer to Buffer for pdf-to-img
    const pdfBuffer = Buffer.from(data);

    // Set up timeout using AbortController
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Set up timeout
      timeoutId = setTimeout(() => {
        abortController.abort();
      }, CONVERSION_TIMEOUT_MS);

      // Convert PDF to image with timeout protection
      let document: Awaited<ReturnType<typeof pdf>> | null = null;
      let iterator: any = null;

      const conversionPromise = (async () => {
        document = await pdf(pdfBuffer, {
          scale: PREVIEW_SCALE,
        });

        // Check if aborted
        if (abortController.signal.aborted) {
          return null;
        }

        // Get ONLY the first page
        iterator = document[Symbol.asyncIterator]();
        const firstPage = await iterator.next();

        if (firstPage.done || !firstPage.value) {
          logger.warn("PDF has no pages or failed to render first page", {
            id,
            size: data.byteLength,
          });
          return null;
        }

        // Check if aborted before processing
        if (abortController.signal.aborted) {
          return null;
        }

        const result = firstPage.value;

        // Explicitly close iterator and cleanup
        try {
          if (iterator && typeof iterator.return === "function") {
            await iterator.return(undefined);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }

        // Clear references to help GC
        iterator = null;
        document = null;

        return result;
      })();

      // Race against timeout
      const timeoutPromise = new Promise<null>((resolve) => {
        abortController.signal.addEventListener("abort", () => {
          resolve(null);
        });
      });

      const pngBuffer = await Promise.race([conversionPromise, timeoutPromise]);

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Ensure cleanup even if conversion failed
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const iter: any = iterator;
        if (iter && typeof iter.return === "function") {
          await iter.return(undefined);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      iterator = null;
      document = null;

      if (!pngBuffer || abortController.signal.aborted) {
        logger.warn("PDF conversion timed out or was aborted", {
          id,
          size: data.byteLength,
          timeout: CONVERSION_TIMEOUT_MS,
        });
        return {
          id,
          type: "error",
          error: "PDF conversion timed out or was aborted",
        };
      }

      // Optimize image with Sharp using enhanced compression options
      // Use progressive JPEG for better performance and smaller initial file size
      const sharpInstance = sharp(pngBuffer)
        .resize(MAX_PREVIEW_WIDTH, MAX_PREVIEW_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality,
          mozjpeg: true,
          progressive: true, // Enable progressive for better perceived performance
          optimizeScans: true, // Optimize progressive scans for better compression
          overshootDeringing: true, // Reduce ringing artifacts
          optimizeCoding: true, // Optimize Huffman coding
        });

      const jpegBuffer = await sharpInstance.toBuffer();

      // Explicitly clean up Sharp instance and clear PNG buffer
      sharpInstance.destroy();
      // Clear PNG buffer reference to help GC
      pngBuffer.fill(0);

      // Convert Buffer to ArrayBuffer for transfer
      // Create a new ArrayBuffer to ensure proper type (not SharedArrayBuffer)
      const arrayBuffer = new ArrayBuffer(jpegBuffer.byteLength);
      const view = new Uint8Array(arrayBuffer);
      view.set(jpegBuffer);

      return {
        id,
        type: "success",
        buffer: arrayBuffer,
        contentType: "image/jpeg",
      };
    } catch (error) {
      // Clean up timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check for memory-related errors
      const isMemoryError =
        errorMessage.includes("out of memory") ||
        errorMessage.includes("ENOMEM") ||
        errorMessage.includes("allocation failed") ||
        errorMessage.includes("Cannot allocate memory");

      if (isMemoryError) {
        logger.error("Memory allocation failed during PDF conversion", {
          id,
          size: data.byteLength,
        });
        return {
          id,
          type: "error",
          error: "Memory allocation failed during PDF conversion",
        };
      }

      logger.error("PDF conversion error in worker", {
        id,
        error: errorMessage,
        size: data.byteLength,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        id,
        type: "error",
        error: errorMessage,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Unexpected error in PDF conversion worker", {
      id,
      error: errorMessage,
      size: data.byteLength,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      id,
      type: "error",
      error: errorMessage,
    };
  }
}

/**
 * Worker thread message handler
 * Handles messages from the main thread and processes PDF conversions
 * Uses self.onmessage for Bun worker compatibility
 */
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  if (request.type === "convert") {
    const startTime = Date.now();
    try {
      const response = await convertPdfToImage(request);
      const duration = Date.now() - startTime;

      if (response.type === "success") {
        logger.info("PDF conversion completed successfully", {
          id: request.id,
          size: request.data.byteLength,
          duration,
        });
      } else {
        logger.warn("PDF conversion failed", {
          id: request.id,
          error: response.error,
          size: request.data.byteLength,
          duration,
        });
      }

      // Use postMessage directly (automatically routed to parent in Bun workers)
      postMessage(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const duration = Date.now() - startTime;

      logger.error("Unexpected error in worker message handler", {
        id: request.id,
        error: errorMessage,
        size: request.data.byteLength,
        duration,
        stack: error instanceof Error ? error.stack : undefined,
      });

      postMessage({
        id: request.id,
        type: "error",
        error: errorMessage,
      } satisfies WorkerResponse);
    }
  }
};
