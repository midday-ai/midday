import crypto from "node:crypto";
import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";

// WhatsApp webhook payload types
export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppValue;
  field: string;
}

export interface WhatsAppValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "text" | "image" | "document" | "interactive" | "audio" | "video";
  text?: {
    body: string;
  };
  image?: WhatsAppMedia;
  document?: WhatsAppMedia;
  interactive?: {
    type: string;
    button_reply?: {
      id: string;
      title: string;
    };
  };
}

export interface WhatsAppMedia {
  id: string;
  mime_type: string;
  sha256?: string;
  filename?: string;
  caption?: string;
}

export interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

/**
 * Verify WhatsApp webhook signature using HMAC SHA256
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string,
): boolean {
  if (!signature || !appSecret) {
    return false;
  }

  // Signature format: sha256=<hash>
  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  // timingSafeEqual requires buffers of equal length
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

/**
 * Extract inbox ID from WhatsApp message text
 * Looks for patterns like "inbox ID is: xxx", "Connect to Midday: xxx", or just the inbox ID
 */
export function extractInboxIdFromMessage(text: string): string | null {
  if (!text || typeof text !== "string") {
    return null;
  }

  // Normalize text: trim whitespace and handle potential encoding issues
  const normalizedText = text.trim();

  // Pattern 1: "Connect to Midday: xxx" (case-insensitive, fixed spacing to avoid ReDoS)
  // Matches: "Connect to Midday: abc123", "connect to midday:abc123", etc.
  // Using [ \t]+ instead of \s+ and avoiding ambiguous quantifiers to prevent backtracking
  const patternConnect =
    /connect[ \t]+to[ \t]+midday[ \t]*:?[ \t]*([a-zA-Z0-9]+)/i;
  const matchConnect = normalizedText.match(patternConnect);
  if (matchConnect?.[1]) {
    return matchConnect[1].trim();
  }

  // Pattern 2: "inbox ID is: xxx" or "My inbox ID is: xxx" (case-insensitive)
  // Using [ \t]+ instead of \s+ to avoid ReDoS
  const patternInbox =
    /inbox[ \t]*(?:ID|id)[ \t]*(?:is)?[ \t]*:?[ \t]*([a-zA-Z0-9]+)/i;
  const matchInbox = normalizedText.match(patternInbox);
  if (matchInbox?.[1]) {
    return matchInbox[1].trim();
  }

  // Pattern 3: Just a short alphanumeric string (typical inbox ID format)
  // Only use this if the message is very short (likely just the ID)
  if (normalizedText.length <= 20 && /^[a-zA-Z0-9]+$/.test(normalizedText)) {
    return normalizedText;
  }

  return null;
}

/**
 * Check if a message type is a supported media type
 */
export function isSupportedMediaType(
  type: string,
): type is "image" | "document" {
  return type === "image" || type === "document";
}

/**
 * Get allowed MIME types for document processing
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
 * Trigger the whatsapp-upload job
 */
export async function triggerWhatsAppUploadJob(params: {
  teamId: string;
  phoneNumber: string;
  messageId: string;
  mediaId: string;
  mimeType: string;
  filename?: string;
  caption?: string;
}) {
  const {
    teamId,
    phoneNumber,
    messageId,
    mediaId,
    mimeType,
    filename,
    caption,
  } = params;

  logger.info("Triggering whatsapp-upload job", {
    teamId,
    phoneNumber,
    messageId,
    mediaId,
    mimeType,
  });

  await triggerJob(
    "whatsapp-upload",
    {
      teamId,
      phoneNumber,
      messageId,
      mediaId,
      mimeType,
      filename,
      caption,
    },
    "inbox",
  );
}
