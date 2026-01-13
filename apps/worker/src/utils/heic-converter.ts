import type { createLoggerWithContext } from "@midday/logger";
import convert from "heic-convert";
import sharp from "sharp";

const DEFAULT_MAX_SIZE = 1500;

export interface HeicConversionResult {
  buffer: Buffer;
  mimetype: "image/jpeg";
}

export interface HeicConverterOptions {
  maxSize?: number;
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
 * @param options - Optional configuration (maxSize for resize)
 * @returns Converted JPEG buffer and mimetype
 * @throws Error if both conversion methods fail
 */
export async function convertHeicToJpeg(
  inputBuffer: ArrayBuffer,
  logger: ReturnType<typeof createLoggerWithContext>,
  options?: HeicConverterOptions,
): Promise<HeicConversionResult> {
  const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;

  // Validate input buffer
  if (!inputBuffer || inputBuffer.byteLength === 0) {
    throw new Error("Input buffer is empty");
  }

  // Try sharp first - it handles HEIF/HEIC natively and also mislabeled files
  try {
    const buffer = await sharp(Buffer.from(inputBuffer))
      .rotate()
      .resize({ width: maxSize })
      .toFormat("jpeg")
      .toBuffer();

    logger.info("HEIC conversion successful with sharp");
    return { buffer, mimetype: "image/jpeg" };
  } catch (sharpError) {
    logger.warn("Sharp failed to process HEIC, falling back to heic-convert", {
      error: sharpError instanceof Error ? sharpError.message : "Unknown error",
    });

    // Fall back to heic-convert for edge cases
    let decodedImage: ArrayBuffer;
    try {
      decodedImage = await convert({
        // @ts-ignore - heic-convert types are incomplete
        buffer: new Uint8Array(inputBuffer),
        format: "JPEG",
        quality: 1,
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
        .resize({ width: maxSize })
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
