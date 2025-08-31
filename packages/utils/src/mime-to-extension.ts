/**
 * Maps MIME types to file extensions
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "application/pdf": ".pdf",
    "text/csv": ".csv",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      ".pptx",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/tiff": ".tiff",
    "image/bmp": ".bmp",
    "text/plain": ".txt",
    "application/json": ".json",
    "application/xml": ".xml",
    "text/xml": ".xml",
  };

  return (
    mimeToExt[mimeType] || (mimeType.startsWith("image/") ? ".jpg" : ".bin")
  );
}

/**
 * Ensures a filename has the correct extension based on MIME type
 */
export function ensureFileExtension(
  fileName: string,
  mimeType: string,
): string {
  const hasExtension = /\.[^.]+$/.test(fileName);

  if (hasExtension) {
    return fileName;
  }

  return `${fileName}${getExtensionFromMimeType(mimeType)}`;
}
