/**
 * Inbox processing utilities
 * Extracted common logic from inbox processors for better maintainability
 */

import { createClient } from "@midday/supabase/job";
import convert from "heic-convert";
import sharp from "sharp";
import { TIMEOUTS, withTimeout } from "./timeout";

const MAX_SIZE = 1500;

/**
 * Convert HEIC image to JPEG
 * Handles download, conversion, and upload
 */
export async function convertHeicToJpeg(
  fileName: string,
  logger: {
    info: (msg: string, meta?: unknown) => void;
    error: (msg: string, meta?: unknown) => void;
  },
): Promise<{ mimetype: string; imageBuffer: Buffer }> {
  const supabase = createClient();
  const heicStartTime = Date.now();

  logger.info("Converting HEIC to JPG", { filePath: fileName });

  const { data } = await withTimeout(
    supabase.storage.from("vault").download(fileName),
    TIMEOUTS.FILE_DOWNLOAD,
    `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
  );

  if (!data) {
    throw new Error("File not found");
  }

  const buffer = await data.arrayBuffer();

  // Edge case: Validate buffer is not empty
  if (buffer.byteLength === 0) {
    throw new Error("Downloaded file is empty");
  }

  let decodedImage: ArrayBuffer;
  try {
    decodedImage = await convert({
      // @ts-ignore
      buffer: new Uint8Array(buffer),
      format: "JPEG",
      quality: 1,
    });
  } catch (error) {
    logger.error("Failed to decode HEIC image - file may be corrupted", {
      filePath: fileName,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error(
      `Failed to convert HEIC image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  // Edge case: Validate decoded image
  if (!decodedImage || decodedImage.byteLength === 0) {
    throw new Error("Decoded image is empty");
  }

  let image: Buffer;
  try {
    image = await sharp(Buffer.from(decodedImage))
      .rotate()
      .resize({ width: MAX_SIZE })
      .toFormat("jpeg")
      .toBuffer();
  } catch (error) {
    logger.error("Failed to process image with sharp - file may be corrupted", {
      filePath: fileName,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error(
      `Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

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

  const heicDuration = Date.now() - heicStartTime;
  logger.info("HEIC conversion completed", {
    filePath: fileName,
    duration: `${heicDuration}ms`,
  });

  return {
    mimetype: "image/jpeg",
    imageBuffer: image,
  };
}

/**
 * Validate file path and extract filename
 */
export function validateFilePath(filePath: string[]): {
  fileName: string;
  fullPath: string;
} {
  const filename = filePath.at(-1);

  // Edge case: Validate filename exists
  if (!filename || filename.trim().length === 0) {
    throw new Error("Invalid file path: filename is missing");
  }

  return {
    fileName: filename,
    fullPath: filePath.join("/"),
  };
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): void {
  // Edge case: Validate file size is reasonable
  if (size <= 0) {
    throw new Error(`Invalid file size: ${size} bytes`);
  }

  // Warn about very large files (optional)
  const sizeInMB = size / (1024 * 1024);
  if (sizeInMB > 100) {
    console.warn(`Large file detected: ${sizeInMB.toFixed(2)}MB`);
  }
}
