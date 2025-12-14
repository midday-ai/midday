import crypto from "node:crypto";
import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

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

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Extract inbox ID from WhatsApp message text
 * Looks for patterns like "inbox ID is: xxx" or just the inbox ID
 */
export function extractInboxIdFromMessage(text: string): string | null {
  // Pattern 1: "inbox ID is: xxx" or "My inbox ID is: xxx"
  const pattern1 = /inbox\s*(?:ID|id)\s*(?:is)?:?\s*([a-zA-Z0-9]+)/i;
  const match1 = text.match(pattern1);
  if (match1?.[1]) {
    return match1[1];
  }

  // Pattern 2: Just a short alphanumeric string (typical inbox ID format)
  // Only use this if the message is very short (likely just the ID)
  if (text.trim().length <= 20 && /^[a-zA-Z0-9]+$/.test(text.trim())) {
    return text.trim();
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
