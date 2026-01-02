import { decryptOAuthState, encryptOAuthState } from "@midday/encryption";
import type { AccountingProviderId, MappedTransaction } from "./types";

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
 * Type guard to validate accounting OAuth state payload
 */
function isValidAccountingOAuthState(
  parsed: unknown,
): parsed is AccountingOAuthStatePayload {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    typeof (parsed as Record<string, unknown>).teamId === "string" &&
    typeof (parsed as Record<string, unknown>).userId === "string" &&
    ["xero", "quickbooks", "fortnox"].includes(
      (parsed as Record<string, unknown>).provider as string,
    ) &&
    ["apps", "settings"].includes(
      (parsed as Record<string, unknown>).source as string,
    )
  );
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
  return encryptOAuthState(payload);
}

/**
 * Decrypts and validates OAuth state from callback.
 * Returns null if state is invalid or tampered with.
 *
 * @param encryptedState - The encrypted state from the OAuth callback
 * @returns Decrypted payload or null if invalid
 */
export function decryptAccountingOAuthState(
  encryptedState: string,
): AccountingOAuthStatePayload | null {
  return decryptOAuthState(encryptedState, isValidAccountingOAuthState);
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
 * Provider-specific attachment configuration.
 * Each provider has different supported file types and size limits.
 */
export const PROVIDER_ATTACHMENT_CONFIG = {
  quickbooks: {
    supportedTypes: new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/tiff",
      "image/bmp",
    ]),
    maxSizeBytes: 20 * 1024 * 1024, // 20 MB
  },
  xero: {
    supportedTypes: new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
    ]),
    maxSizeBytes: 3 * 1024 * 1024, // 3 MB
  },
  fortnox: {
    supportedTypes: new Set(["application/pdf", "image/jpeg", "image/png"]),
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  },
} as const;

/**
 * Map of file extensions to MIME types.
 * Used to infer MIME type from filename when stored type is invalid.
 */
const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
};

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

/**
 * Result of MIME type resolution
 */
export interface MimeTypeResolution {
  /** Resolved MIME type, or null if could not be determined */
  mimeType: string | null;
  /** Source of the resolution */
  source: "stored" | "extension" | "buffer" | "failed";
  /** Error message if resolution failed or type is unsupported */
  error?: string;
}

/**
 * Detect MIME type from buffer by checking magic bytes.
 * Supports PDF, JPEG, PNG, GIF, TIFF, BMP, WebP.
 */
function detectMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 4) {
    return null;
  }

  // Check PDF (starts with %PDF)
  const header = buffer.subarray(0, 4).toString("utf8");
  if (header.startsWith("%PDF")) {
    return "application/pdf";
  }

  // Check JPEG (starts with 0xFF 0xD8 0xFF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // Check PNG (starts with 0x89 0x50 0x4E 0x47)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // Check GIF (starts with GIF87a or GIF89a)
  if (buffer.length >= 6) {
    const gifHeader = buffer.subarray(0, 6).toString("utf8");
    if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
      return "image/gif";
    }
  }

  // Check TIFF (starts with II or MM)
  if (buffer.length >= 4) {
    const tiffLE =
      buffer[0] === 0x49 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x2a &&
      buffer[3] === 0x00;
    const tiffBE =
      buffer[0] === 0x4d &&
      buffer[1] === 0x4d &&
      buffer[2] === 0x00 &&
      buffer[3] === 0x2a;
    if (tiffLE || tiffBE) {
      return "image/tiff";
    }
  }

  // Check BMP (starts with BM)
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return "image/bmp";
  }

  // Check WebP (starts with RIFF...WEBP)
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Resolves the correct MIME type for an attachment using a layered approach.
 * Validates against provider-specific supported types.
 *
 * Resolution order:
 * 1. Check if stored type is valid and supported by the provider
 * 2. Try to infer from file extension
 * 3. Detect from magic bytes in the buffer
 * 4. Return error if type cannot be determined or is unsupported
 *
 * @param storedType - The MIME type stored in the database
 * @param fileName - The filename (used to infer type from extension)
 * @param buffer - The file buffer (used for magic byte detection)
 * @param providerId - The accounting provider ID
 * @returns Resolution result with mimeType, source, and optional error
 *
 * @example
 * resolveMimeType("application/octet-stream", "receipt.pdf", buffer, "quickbooks")
 * // Returns: { mimeType: "application/pdf", source: "extension" }
 */
export function resolveMimeType(
  storedType: string | null,
  fileName: string | null,
  buffer: Buffer,
  providerId: keyof typeof PROVIDER_ATTACHMENT_CONFIG,
): MimeTypeResolution {
  const providerConfig = PROVIDER_ATTACHMENT_CONFIG[providerId];

  // 1. Check if stored type is valid and supported
  if (storedType && providerConfig.supportedTypes.has(storedType)) {
    return { mimeType: storedType, source: "stored" };
  }

  // 2. Try to infer from file extension
  if (fileName) {
    const ext = fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
    if (ext) {
      const inferredType = EXTENSION_TO_MIME[ext];
      if (inferredType && providerConfig.supportedTypes.has(inferredType)) {
        return { mimeType: inferredType, source: "extension" };
      }
    }
  }

  // 3. Detect from magic bytes
  const detectedType = detectMimeTypeFromBuffer(buffer);
  if (detectedType && providerConfig.supportedTypes.has(detectedType)) {
    return { mimeType: detectedType, source: "buffer" };
  }

  // 4. Could not determine valid type - check if we detected something unsupported
  if (detectedType) {
    return {
      mimeType: null,
      source: "failed",
      error: `File type "${detectedType}" is not supported by ${providerId}`,
    };
  }

  if (storedType && storedType !== "application/octet-stream") {
    return {
      mimeType: null,
      source: "failed",
      error: `File type "${storedType}" is not supported by ${providerId}`,
    };
  }

  return {
    mimeType: null,
    source: "failed",
    error: "Could not determine file type",
  };
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

// ============================================================================
// Tax Info Formatting Utilities
// ============================================================================

/**
 * Format options for tax info string generation
 */
export interface TaxInfoFormatOptions {
  /** Currency symbol for amount (e.g., "$", "€", "kr") */
  currencySymbol?: string;
  /** Whether to use compact format (e.g., "25% moms" vs "Tax: $12.50 (25% VAT)") */
  compact?: boolean;
  /** Maximum length for the output string */
  maxLength?: number;
}

/**
 * Builds a tax info string from transaction tax data.
 * Returns empty string if no tax data is available.
 *
 * @param tx - Transaction with optional tax fields
 * @param options - Formatting options
 * @returns Formatted tax info string or empty string
 *
 * @example
 * // Full format (QuickBooks)
 * buildTaxInfoString({ taxAmount: 12.50, taxRate: 25, taxType: "VAT" })
 * // Returns: "Tax: 12.50 (25% VAT)"
 *
 * @example
 * // Compact format (Fortnox)
 * buildTaxInfoString({ taxRate: 25, taxType: "moms" }, { compact: true })
 * // Returns: "25% moms"
 */
export function buildTaxInfoString(
  tx: Pick<MappedTransaction, "taxAmount" | "taxRate" | "taxType">,
  options: TaxInfoFormatOptions = {},
): string {
  const { compact = false, maxLength } = options;

  // Check if we have any tax data
  const hasTaxAmount = tx.taxAmount !== undefined && tx.taxAmount !== null;
  const hasTaxRate = tx.taxRate !== undefined && tx.taxRate !== null;
  const hasTaxType = tx.taxType !== undefined && tx.taxType !== null;

  if (!hasTaxAmount && !hasTaxRate && !hasTaxType) {
    return "";
  }

  let result: string;

  if (compact) {
    // Compact format: "25% moms" or "25%" or "moms"
    const parts: string[] = [];
    if (hasTaxRate) {
      parts.push(`${tx.taxRate}%`);
    }
    if (hasTaxType) {
      parts.push(tx.taxType!);
    }
    result = parts.join(" ");
  } else {
    // Full format: "Tax: 12.50 (25% VAT)" or "Tax: 25% VAT" or "Tax: 12.50"
    const parts: string[] = [];

    if (hasTaxAmount) {
      parts.push(tx.taxAmount!.toFixed(2));
    }

    if (hasTaxRate || hasTaxType) {
      const rateParts: string[] = [];
      if (hasTaxRate) {
        rateParts.push(`${tx.taxRate}%`);
      }
      if (hasTaxType) {
        rateParts.push(tx.taxType!);
      }
      const rateStr = rateParts.join(" ");

      if (hasTaxAmount) {
        parts.push(`(${rateStr})`);
      } else {
        parts.push(rateStr);
      }
    }

    result = parts.length > 0 ? `Tax: ${parts.join(" ")}` : "";
  }

  // Truncate if needed
  if (maxLength && result.length > maxLength) {
    return `${result.substring(0, maxLength - 3)}...`;
  }

  return result;
}

/**
 * Builds a private note string with tax info and user notes.
 * Used for QuickBooks PrivateNote field.
 *
 * @param tx - Transaction with tax and note fields
 * @param options - Formatting options
 * @returns Formatted private note string or empty string
 *
 * @example
 * buildPrivateNote({
 *   taxAmount: 12.50,
 *   taxRate: 25,
 *   taxType: "VAT",
 *   note: "Team dinner"
 * })
 * // Returns: "Tax: 12.50 (25% VAT)\nNote: Team dinner"
 */
export function buildPrivateNote(
  tx: Pick<MappedTransaction, "taxAmount" | "taxRate" | "taxType" | "note">,
  options: TaxInfoFormatOptions = {},
): string {
  const parts: string[] = [];

  // Add tax info
  const taxInfo = buildTaxInfoString(tx, options);
  if (taxInfo) {
    parts.push(taxInfo);
  }

  // Add user note
  if (tx.note) {
    parts.push(`Note: ${tx.note}`);
  }

  return parts.join("\n");
}

/**
 * Appends tax info to a description string with a separator.
 * Used for Xero LineItem description and Fortnox VoucherRow description.
 *
 * @param description - Base description
 * @param tx - Transaction with tax fields
 * @param options - Formatting options (compact recommended for Fortnox)
 * @returns Description with tax info appended, or original description
 *
 * @example
 * appendTaxInfoToDescription("Monthly subscription", { taxRate: 25, taxType: "VAT" })
 * // Returns: "Monthly subscription | Tax: 25% VAT"
 *
 * @example
 * // With compact format for Fortnox
 * appendTaxInfoToDescription("Lunch", { taxRate: 25, taxType: "moms" }, { compact: true, maxLength: 200 })
 * // Returns: "Lunch | 25% moms"
 */
export function appendTaxInfoToDescription(
  description: string,
  tx: Pick<MappedTransaction, "taxAmount" | "taxRate" | "taxType">,
  options: TaxInfoFormatOptions = {},
): string {
  const taxInfo = buildTaxInfoString(tx, options);

  if (!taxInfo) {
    return description;
  }

  const combined = `${description} | ${taxInfo}`;

  // Truncate if needed (preserving original description)
  if (options.maxLength && combined.length > options.maxLength) {
    // If combined is too long, truncate the tax info part
    const availableForTax = options.maxLength - description.length - 7; // " | " + "..."
    if (availableForTax > 10) {
      // Only append if there's reasonable space
      return `${description} | ${taxInfo.substring(0, availableForTax)}...`;
    }
    // Not enough space, return just the description
    return description.substring(0, options.maxLength);
  }

  return combined;
}
