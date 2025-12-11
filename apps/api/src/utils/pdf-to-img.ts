import { pdf } from "pdf-to-img";
import sharp from "sharp";

const CONVERSION_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 1; // Retry once for pdfjs-dist state errors

/**
 * Check if error is a pdfjs-dist state corruption error that can be retried
 */
function isRetryablePdfError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message || "";
  const errorStack = error.stack || "";

  // Check for pdfjs-dist InvalidArg errors (state corruption)
  return (
    errorMessage.includes("InvalidArg") ||
    errorMessage.includes("Value is non of these types") ||
    errorStack.includes("pdfjs-dist") ||
    errorStack.includes("consumePath") ||
    errorStack.includes("endPath")
  );
}

/**
 * Convert PDF buffer to JPEG image buffer (first page only)
 * Optimized for speed and reliability with compression
 * Cloudflare CDN handles resizing, so we only convert format here
 * @param data - PDF file as ArrayBuffer
 * @param options - Optional quality settings
 * @returns Object with image buffer and content type, or null if conversion fails
 */
export async function getPdfImage(
  data: ArrayBuffer,
  options?: {
    quality?: number;
  },
  retryAttempt = 0,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const { quality = 85 } = options || {};

  try {
    // Convert ArrayBuffer to Buffer for pdf-to-img
    const pdfBuffer = Buffer.from(data);

    // Use scale 2.0 for good quality - Cloudflare CDN will resize as needed
    const scale = 2.0;

    // Wrap conversion in timeout to prevent hanging
    const conversionPromise = (async () => {
      const document = await pdf(pdfBuffer, {
        scale,
      });

      // Get the first page as an image
      const iterator = document[Symbol.asyncIterator]();
      const firstPage = await iterator.next();

      if (firstPage.done || !firstPage.value) {
        console.error("PDF has no pages or failed to render first page");
        return null;
      }

      return firstPage.value;
    })();

    // Race against timeout
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.error("PDF to image conversion timed out");
        resolve(null);
      }, CONVERSION_TIMEOUT_MS);
    });

    const pngBuffer = await Promise.race([conversionPromise, timeoutPromise]);

    if (!pngBuffer) {
      return null;
    }

    // Convert PNG to JPEG using sharp (Cloudflare CDN will handle resizing)
    // We still use sharp for format conversion as pdf-to-img returns PNG
    const jpegBuffer = await sharp(pngBuffer).jpeg({ quality }).toBuffer();

    return {
      buffer: jpegBuffer,
      contentType: "image/jpeg",
    };
  } catch (error) {
    // Check if this is a retryable pdfjs-dist error
    if (isRetryablePdfError(error) && retryAttempt < MAX_RETRIES) {
      console.warn(
        `PDF to image conversion failed with retryable error (attempt ${
          retryAttempt + 1
        }/${MAX_RETRIES + 1}), retrying...`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );

      // Wait a short time before retry to allow state to clear
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Retry with fresh attempt
      return getPdfImage(data, options, retryAttempt + 1);
    }

    console.error("PDF to image conversion error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      retryAttempt,
    });

    // Return null instead of throwing to prevent crashes
    return null;
  }
}
