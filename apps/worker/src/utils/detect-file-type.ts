/**
 * Detect file type from magic bytes (file signature)
 * Useful for detecting actual file types when mimetype is generic (e.g., application/octet-stream)
 */

export type FileTypeDetectionResult =
  | {
      detected: true;
      mimetype: string;
      buffer: Buffer;
    }
  | {
      detected: false;
      buffer: Buffer;
    };

/**
 * Detect file type from buffer by checking magic bytes
 * @param buffer - File buffer to analyze
 * @returns Detection result with detected mimetype or null if unknown
 */
export function detectFileTypeFromBuffer(
  buffer: Buffer,
): FileTypeDetectionResult {
  if (buffer.length < 4) {
    return { detected: false, buffer };
  }

  // Check PDF (starts with %PDF)
  const header = buffer.subarray(0, 4).toString("utf8");
  if (header.startsWith("%PDF")) {
    return {
      detected: true,
      mimetype: "application/pdf",
      buffer,
    };
  }

  // Check JPEG (starts with 0xFF 0xD8 0xFF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return {
      detected: true,
      mimetype: "image/jpeg",
      buffer,
    };
  }

  // Check PNG (starts with 0x89 0x50 0x4E 0x47)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return {
      detected: true,
      mimetype: "image/png",
      buffer,
    };
  }

  // Check GIF (starts with GIF87a or GIF89a)
  if (buffer.length >= 6) {
    const gifHeader = buffer.subarray(0, 6).toString("utf8");
    if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
      return {
        detected: true,
        mimetype: "image/gif",
        buffer,
      };
    }
  }

  // Check WebP (starts with RIFF...WEBP)
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return {
      detected: true,
      mimetype: "image/webp",
      buffer,
    };
  }

  // Unknown file type
  return { detected: false, buffer };
}

/**
 * Detect file type from Blob by checking magic bytes
 * @param blob - File blob to analyze
 * @returns Detection result with detected mimetype or null if unknown
 */
export async function detectFileTypeFromBlob(
  blob: Blob,
): Promise<FileTypeDetectionResult> {
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return detectFileTypeFromBuffer(buffer);
}
