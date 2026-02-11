/**
 * Inbox processing utilities
 * Extracted common logic from inbox processors for better maintainability
 */

import { createLoggerWithContext } from "@midday/logger";

const logger = createLoggerWithContext("worker:inbox-processing");

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
    logger.warn(`Large file detected: ${sizeInMB.toFixed(2)}MB`);
  }
}
