import { decrypt, encrypt } from "@midday/encryption";
import type { AccountingProviderId } from "./types";

// ============================================================================
// URL-Safe Base64 Utilities
// ============================================================================

/**
 * Converts standard base64 to URL-safe base64.
 * Replaces + with -, / with _, and removes = padding.
 * This is necessary because some OAuth providers (like Fortnox) don't properly
 * encode + characters in query strings, which corrupts standard base64.
 */
function toUrlSafeBase64(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Converts URL-safe base64 back to standard base64.
 * Replaces - with +, _ with /, and adds = padding.
 */
function fromUrlSafeBase64(urlSafeBase64: string): string {
  let base64 = urlSafeBase64.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return base64;
}

// ============================================================================
// OAuth State Utilities
// ============================================================================

/**
 * OAuth state payload for accounting providers
 * Contains information needed to complete the OAuth flow securely
 */
export interface AccountingOAuthStatePayload {
  teamId: string;
  userId: string;
  provider: AccountingProviderId;
  source: "apps" | "settings";
}

/**
 * Encrypts OAuth state to prevent tampering.
 * The state contains sensitive info like teamId that must be protected.
 * Uses URL-safe base64 encoding to prevent issues with + characters in URLs.
 *
 * @param payload - The OAuth state data to encrypt
 * @returns Encrypted state string safe for URL parameters
 */
export function encryptAccountingOAuthState(
  payload: AccountingOAuthStatePayload,
): string {
  const encrypted = encrypt(JSON.stringify(payload));
  // Convert to URL-safe base64 to prevent issues with + characters
  return toUrlSafeBase64(encrypted);
}

/**
 * Decrypts and validates OAuth state from callback.
 * Returns null if state is invalid or tampered with.
 * Handles both URL-safe and standard base64 for backwards compatibility.
 *
 * @param encryptedState - The encrypted state from the OAuth callback
 * @returns Decrypted payload or null if invalid
 */
export function decryptAccountingOAuthState(
  encryptedState: string,
): AccountingOAuthStatePayload | null {
  try {
    // Convert from URL-safe base64 back to standard base64
    const standardBase64 = fromUrlSafeBase64(encryptedState);
    const decrypted = decrypt(standardBase64);
    const parsed = JSON.parse(decrypted);

    // Validate required fields
    // Note: Only currently implemented providers are allowed for OAuth
    if (
      typeof parsed.teamId !== "string" ||
      typeof parsed.userId !== "string" ||
      !["xero", "quickbooks", "fortnox"].includes(parsed.provider) ||
      !["apps", "settings"].includes(parsed.source)
    ) {
      return null;
    }

    return parsed as AccountingOAuthStatePayload;
  } catch {
    return null;
  }
}

// ============================================================================
// Idempotency Utilities
// ============================================================================

/**
 * Generate idempotency key for transaction sync.
 * Uses jobId to ensure:
 * - Same job retrying = same key = no duplicate (retry safe)
 * - New export job = new key = allows re-export after deletion
 *
 * @param transactionId - The Midday transaction ID
 * @param jobId - The BullMQ job ID (unique per export session)
 * @returns Idempotency key for the transaction
 *
 * @example
 * generateTransactionIdempotencyKey("tx-123", "job-456")
 * // Returns: "midday-tx-tx-123-job-456"
 */
export function generateTransactionIdempotencyKey(
  transactionId: string,
  jobId: string,
): string {
  return `midday-tx-${transactionId}-${jobId}`;
}

/**
 * Generate idempotency key for attachment uploads.
 * This prevents duplicate attachment uploads during retries.
 *
 * @param providerTransactionId - The provider's transaction ID
 * @param fileName - The sanitized filename being uploaded
 * @returns Deterministic idempotency key
 *
 * @example
 * generateAttachmentIdempotencyKey("abc-123", "receipt.pdf")
 * // Returns: "midday-attachment-abc-123-receipt.pdf"
 */
export function generateAttachmentIdempotencyKey(
  providerTransactionId: string,
  fileName: string,
): string {
  return `midday-attachment-${providerTransactionId}-${fileName}`;
}

// ============================================================================
// Stream/Buffer Utilities
// ============================================================================

/**
 * Converts a ReadableStream or Buffer to a Buffer.
 * Used for processing attachment content before uploading to providers.
 *
 * @param content - The content to convert (Buffer or ReadableStream)
 * @returns A Buffer containing the content
 */
export async function streamToBuffer(
  content: Buffer | ReadableStream,
): Promise<Buffer> {
  if (Buffer.isBuffer(content)) {
    return content;
  }

  const chunks: Uint8Array[] = [];
  const reader = content.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks);
}

// ============================================================================
// File Utilities
// ============================================================================

/**
 * Map of common MIME types to file extensions.
 * Used to ensure files have proper extensions for accounting providers.
 */
const MIME_TO_EXTENSION: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/plain": ".txt",
  "text/csv": ".csv",
};

/**
 * Ensures a filename has a proper extension based on its MIME type.
 * Accounting providers (Xero, QuickBooks, Fortnox) require files to have valid extensions.
 *
 * @param fileName - The original filename
 * @param mimeType - The MIME type of the file
 * @returns Filename with proper extension
 *
 * @example
 * ensureFileExtension("invoice", "application/pdf") // "invoice.pdf"
 * ensureFileExtension("receipt.", "image/jpeg") // "receipt.jpg"
 * ensureFileExtension("doc.pdf", "application/pdf") // "doc.pdf" (unchanged)
 */
export function ensureFileExtension(
  fileName: string,
  mimeType: string,
): string {
  // Check if filename already has a valid extension (2-5 chars after dot)
  const hasExtension = /\.[a-zA-Z0-9]{2,5}$/.test(fileName);
  if (hasExtension) {
    return fileName;
  }

  // Add extension based on mimeType
  const extension = MIME_TO_EXTENSION[mimeType] || ".pdf"; // Default to .pdf

  // Remove trailing dot(s) if present (e.g., "vercel-inc." -> "vercel-inc")
  const baseName = fileName.replace(/\.+$/, "");

  return `${baseName}${extension}`;
}

// ============================================================================
// Concurrency Utilities
// ============================================================================

/**
 * Sleep for a specified number of milliseconds.
 * Useful for rate limiting between API calls.
 *
 * @param ms - Number of milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Result of a throttled concurrent operation
 */
export interface ThrottledResult<T> {
  results: T[];
  errors: Array<{ index: number; error: Error }>;
}

/**
 * Execute tasks concurrently with rate limiting.
 * Processes items in batches, respecting maxConcurrent and callDelayMs.
 *
 * @param items - Items to process
 * @param processor - Async function to process each item
 * @param maxConcurrent - Maximum concurrent operations
 * @param callDelayMs - Delay between batches (ms)
 * @param onProgress - Optional callback for progress updates
 * @returns Results and any errors that occurred
 *
 * @example
 * const results = await throttledConcurrent(
 *   attachments,
 *   (attachment) => uploadAttachment(attachment),
 *   5,   // Max 5 concurrent
 *   1000 // 1 second between batches
 * );
 */
export async function throttledConcurrent<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  maxConcurrent: number,
  callDelayMs: number,
  onProgress?: (completed: number, total: number) => void,
): Promise<ThrottledResult<R>> {
  const results: R[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    const batchStartIndex = i;

    // Process batch concurrently
    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = batchStartIndex + batchIndex;
      try {
        const result = await processor(item, globalIndex);
        return { success: true as const, result, index: globalIndex };
      } catch (error) {
        return {
          success: false as const,
          error: error instanceof Error ? error : new Error(String(error)),
          index: globalIndex,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Collect results and errors
    for (const result of batchResults) {
      if (result.success) {
        results.push(result.result);
      } else {
        errors.push({ index: result.index, error: result.error });
      }
    }

    // Report progress
    const completed = Math.min(i + batch.length, items.length);
    onProgress?.(completed, items.length);

    // Delay before next batch (except for last batch)
    if (i + maxConcurrent < items.length && callDelayMs > 0) {
      await sleep(callDelayMs);
    }
  }

  return { results, errors };
}
