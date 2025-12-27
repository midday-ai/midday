import crypto from "node:crypto";
import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";

/**
 * Telegram Update types
 */
export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
  caption?: string;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  chat_instance: string;
  data?: string;
}

/**
 * Verify Telegram webhook secret token
 * Telegram sends X-Telegram-Bot-Api-Secret-Token header
 */
export function verifyWebhookSecret(
  receivedSecret: string | undefined,
  expectedSecret: string,
): boolean {
  if (!receivedSecret) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(receivedSecret),
    Buffer.from(expectedSecret),
  );
}

/**
 * Extract inbox ID from message text
 * Looking for patterns like: MID-XXXXXXXX or just the ID
 */
export function extractInboxIdFromMessage(text: string): string | null {
  // Match patterns like: MID-abc123, mid-ABC123, or just alphanumeric codes
  const patterns = [
    /\bMID[-_]?([A-Za-z0-9]{6,})\b/i, // MID-abc123 format
    /\b([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\b/i, // UUID format
    /^([A-Za-z0-9]{6,32})$/i, // Plain alphanumeric (6-32 chars)
  ];

  const trimmedText = text.trim();

  for (const pattern of patterns) {
    const match = trimmedText.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

/**
 * Check if MIME type is supported for document processing
 */
export function isAllowedMimeType(mimeType: string): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/pdf",
  ];

  return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * Check if message type is supported media
 */
export function isSupportedMediaType(
  message: TelegramMessage,
): { type: "photo" | "document"; mimeType: string; fileId: string } | null {
  // Photos are always supported (Telegram converts to JPEG)
  if (message.photo && message.photo.length > 0) {
    // Get the largest photo (last in array)
    const largestPhoto = message.photo[message.photo.length - 1];
    if (largestPhoto) {
      return {
        type: "photo",
        mimeType: "image/jpeg",
        fileId: largestPhoto.file_id,
      };
    }
  }

  // Documents need MIME type check
  if (message.document) {
    const mimeType = message.document.mime_type || "application/octet-stream";
    if (isAllowedMimeType(mimeType)) {
      return {
        type: "document",
        mimeType,
        fileId: message.document.file_id,
      };
    }
  }

  return null;
}

/**
 * Get display name from Telegram user
 */
export function getDisplayName(user?: TelegramUser): string {
  if (!user) return "Unknown";

  const parts = [user.first_name];
  if (user.last_name) {
    parts.push(user.last_name);
  }

  return parts.join(" ") || user.username || "Unknown";
}

/**
 * Trigger the telegram-upload job
 */
export async function triggerTelegramUploadJob(params: {
  teamId: string;
  chatId: number;
  messageId: number;
  fileId: string;
  mimeType: string;
  filename?: string;
  caption?: string;
}) {
  const { teamId, chatId, messageId, fileId, mimeType, filename, caption } =
    params;

  logger.info("Triggering telegram-upload job", {
    teamId,
    chatId,
    messageId,
    fileId,
    mimeType,
  });

  await triggerJob(
    "telegram-upload",
    {
      teamId,
      chatId,
      messageId,
      fileId,
      mimeType,
      filename,
      caption,
    },
    "inbox",
  );
}

/**
 * Parse callback data for match actions
 */
export function parseMatchCallbackData(data: string): {
  action: "confirm" | "decline";
  inboxId: string;
  transactionId: string;
} | null {
  // Expected format: "match:confirm:inboxId:transactionId" or "match:decline:..."
  const parts = data.split(":");

  if (parts.length !== 4 || parts[0] !== "match") {
    return null;
  }

  const action = parts[1];
  const inboxId = parts[2];
  const transactionId = parts[3];

  if (action !== "confirm" && action !== "decline") {
    return null;
  }

  if (!inboxId || !transactionId) {
    return null;
  }

  return {
    action,
    inboxId,
    transactionId,
  };
}

/**
 * Create match callback data
 */
export function createMatchCallbackData(
  action: "confirm" | "decline",
  inboxId: string,
  transactionId: string,
): string {
  return `match:${action}:${inboxId}:${transactionId}`;
}
