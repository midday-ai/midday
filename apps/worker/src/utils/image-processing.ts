import type { createLoggerWithContext } from "@midday/logger";
import convert from "heic-convert";
import sharp from "sharp";
import { IMAGE_SIZES } from "./timeout";

// Configure sharp for memory efficiency
// Limit concurrent operations and cache size to prevent OOM
sharp.cache({ memory: 256, files: 20, items: 100 }); // 256MB cache limit
sharp.concurrency(2); // Limit internal parallelism per sharp instance

/**
 * Maximum file size for HEIC conversion (in bytes)
 * Files larger than this will skip AI classification to prevent OOM
 * 15MB HEIC ≈ 24MP image ≈ ~100MB decoded RGBA
 */
export const MAX_HEIC_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export interface HeicConversionResult {
  buffer: Buffer;
  mimetype: "image/jpeg";
}

export interface ImageProcessingOptions {
  maxSize?: number;
}

export interface ResizeResult {
  buffer: Buffer;
  mimetype: string;
}

/**
 * Supported image mimetypes for resizing
 */
const RESIZABLE_MIMETYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/tiff",
]);

/**
 * Resize an image to fit within maxSize dimensions.
 *
 * - Preserves aspect ratio (resizes longest side to maxSize)
 * - Skips resize if image is already small enough
 * - Returns original buffer for unsupported mimetypes
 *
 * @param inputBuffer - Raw image buffer (ArrayBuffer from file download)
 * @param mimetype - Image mimetype (e.g., "image/jpeg")
 * @param logger - Logger instance for status messages
 * @param options - Optional configuration (maxSize defaults to IMAGE_SIZES.MAX_DIMENSION)
 * @returns Resized buffer and mimetype
 */
export async function resizeImage(
  inputBuffer: ArrayBuffer,
  mimetype: string,
  logger: ReturnType<typeof createLoggerWithContext>,
  options?: ImageProcessingOptions,
): Promise<ResizeResult> {
  const maxSize = options?.maxSize ?? IMAGE_SIZES.MAX_DIMENSION;

  // Validate input buffer
  if (!inputBuffer || inputBuffer.byteLength === 0) {
    throw new Error("Input buffer is empty");
  }

  // Skip non-image or unsupported formats
  if (!RESIZABLE_MIMETYPES.has(mimetype.toLowerCase())) {
    logger.info("Skipping resize for unsupported mimetype", { mimetype });
    return { buffer: Buffer.from(inputBuffer), mimetype };
  }

  try {
    const image = sharp(Buffer.from(inputBuffer));
    const metadata = await image.metadata();

    // Skip if already within size limits
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (width <= maxSize && height <= maxSize) {
      logger.info("Image already within size limits, skipping resize", {
        width,
        height,
        maxSize,
      });
      return { buffer: Buffer.from(inputBuffer), mimetype };
    }

    // Resize to fit within maxSize (preserves aspect ratio)
    const buffer = await image
      .rotate() // Auto-rotate based on EXIF
      .resize({
        width: maxSize,
        height: maxSize,
        fit: "inside", // Maintain aspect ratio, fit within bounds
        withoutEnlargement: true, // Don't upscale small images
      })
      .toBuffer();

    logger.info("Image resized successfully", {
      originalWidth: width,
      originalHeight: height,
      maxSize,
    });

    return { buffer, mimetype };
  } catch (error) {
    logger.warn("Failed to resize image, returning original", {
      error: error instanceof Error ? error.message : "Unknown error",
      mimetype,
    });
    // Return original on error - graceful degradation
    return { buffer: Buffer.from(inputBuffer), mimetype };
  }
}

/**
 * Convert HEIC/HEIF image to JPEG.
 *
 * Uses a two-stage approach for maximum compatibility:
 * 1. Try sharp first - handles HEIF/HEIC natively + mislabeled files (e.g., JPEG with .heic extension)
 * 2. Fall back to heic-convert if sharp fails - handles edge cases sharp can't decode
 *
 * @param inputBuffer - Raw image buffer (ArrayBuffer from file download)
 * @param logger - Logger instance for status messages
 * @param options - Optional configuration (maxSize defaults to IMAGE_SIZES.MAX_DIMENSION)
 * @returns Converted JPEG buffer and mimetype
 * @throws Error if both conversion methods fail
 */
export async function convertHeicToJpeg(
  inputBuffer: ArrayBuffer,
  logger: ReturnType<typeof createLoggerWithContext>,
  options?: ImageProcessingOptions,
): Promise<HeicConversionResult> {
  const maxSize = options?.maxSize ?? IMAGE_SIZES.MAX_DIMENSION;

  // Validate input buffer
  if (!inputBuffer || inputBuffer.byteLength === 0) {
    throw new Error("Input buffer is empty");
  }

  // Try sharp first - it handles HEIF/HEIC natively and also mislabeled files
  try {
    const buffer = await sharp(Buffer.from(inputBuffer))
      .rotate()
      .resize({
        width: maxSize,
        height: maxSize,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFormat("jpeg")
      .toBuffer();

    logger.info("HEIC conversion successful with sharp");
    return { buffer, mimetype: "image/jpeg" };
  } catch (sharpError) {
    logger.warn("Sharp failed to process HEIC, falling back to heic-convert", {
      error: sharpError instanceof Error ? sharpError.message : "Unknown error",
    });

    // Fall back to heic-convert for edge cases
    // Note: heic-convert is memory-intensive as it decodes to raw pixels
    // A 12MP photo = ~48MB raw RGBA, so we use lower quality to reduce output size
    let decodedImage: ArrayBuffer;
    try {
      decodedImage = await convert({
        // @ts-expect-error - heic-convert types are incomplete
        buffer: new Uint8Array(inputBuffer),
        format: "JPEG",
        quality: 0.8, // Reduced from 1.0 to save memory - still good quality for AI classification
      });
    } catch (heicError) {
      // Both methods failed - file is likely corrupted or unsupported
      throw new Error(
        `Failed to convert HEIC image: sharp error: ${sharpError instanceof Error ? sharpError.message : "Unknown"}, heic-convert error: ${heicError instanceof Error ? heicError.message : "Unknown"}`,
      );
    }

    // Validate decoded image
    if (!decodedImage || decodedImage.byteLength === 0) {
      throw new Error("Decoded image is empty after heic-convert");
    }

    // Process the decoded image with sharp for resize and format
    try {
      const buffer = await sharp(Buffer.from(decodedImage))
        .rotate()
        .resize({
          width: maxSize,
          height: maxSize,
          fit: "inside",
          withoutEnlargement: true,
        })
        .toFormat("jpeg")
        .toBuffer();

      logger.info("HEIC conversion successful with heic-convert fallback");
      return { buffer, mimetype: "image/jpeg" };
    } catch (finalSharpError) {
      throw new Error(
        `Failed to process heic-convert output: ${finalSharpError instanceof Error ? finalSharpError.message : "Unknown error"}`,
      );
    }
  }
}
