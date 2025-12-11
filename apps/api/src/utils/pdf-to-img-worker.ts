import { pdf } from "pdf-to-img";
import sharp from "sharp";

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
      const conversionPromise = (async () => {
        const document = await pdf(pdfBuffer, {
          scale: PREVIEW_SCALE,
        });

        // Check if aborted
        if (abortController.signal.aborted) {
          return null;
        }

        // Get ONLY the first page
        const iterator = document[Symbol.asyncIterator]();
        const firstPage = await iterator.next();

        if (firstPage.done || !firstPage.value) {
          return null;
        }

        // Check if aborted before processing
        if (abortController.signal.aborted) {
          return null;
        }

        return firstPage.value;
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

      if (!pngBuffer || abortController.signal.aborted) {
        return {
          id,
          type: "error",
          error: "PDF conversion timed out or was aborted",
        };
      }

      // Optimize image with Sharp using streaming for better memory management
      // Use progressive JPEG for better performance and smaller initial file size
      const jpegBuffer = await sharp(pngBuffer)
        .resize(MAX_PREVIEW_WIDTH, MAX_PREVIEW_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality,
          mozjpeg: true,
          progressive: true, // Enable progressive for better perceived performance
        })
        .toBuffer();

      // Explicitly clean up Sharp instance
      // Note: Sharp instances are automatically cleaned up, but being explicit helps

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
        return {
          id,
          type: "error",
          error: "Memory allocation failed during PDF conversion",
        };
      }

      return {
        id,
        type: "error",
        error: errorMessage,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
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
 */
addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  if (request.type === "convert") {
    try {
      const response = await convertPdfToImage(request);
      postMessage(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      postMessage({
        id: request.id,
        type: "error",
        error: errorMessage,
      } satisfies WorkerResponse);
    }
  }
});
