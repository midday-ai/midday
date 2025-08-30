import { z } from "zod";

// WhatsApp webhook verification schema
export const whatsappVerificationSchema = z.object({
  "hub.mode": z.literal("subscribe"),
  "hub.challenge": z.string(),
  "hub.verify_token": z.string(),
});

// WhatsApp media object schema
export const whatsappMediaSchema = z.object({
  id: z.string(),
  mime_type: z.string(),
  sha256: z.string().optional(),
  filename: z.string().optional(),
});

// WhatsApp message schema
export const whatsappMessageSchema = z.object({
  id: z.string(),
  from: z.string(), // Phone number
  timestamp: z.string(),
  type: z.enum(["text", "image", "document", "audio", "video", "sticker"]),
  text: z
    .object({
      body: z.string(),
    })
    .optional(),
  image: whatsappMediaSchema.optional(),
  document: whatsappMediaSchema.optional(),
  audio: whatsappMediaSchema.optional(),
  video: whatsappMediaSchema.optional(),
  sticker: whatsappMediaSchema.optional(),
});

// WhatsApp contact schema
export const whatsappContactSchema = z.object({
  profile: z.object({
    name: z.string(),
  }),
  wa_id: z.string(),
});

// WhatsApp value schema (contains messages and contacts)
export const whatsappValueSchema = z.object({
  messaging_product: z.literal("whatsapp"),
  metadata: z.object({
    display_phone_number: z.string(),
    phone_number_id: z.string(),
  }),
  contacts: z.array(whatsappContactSchema).optional(),
  messages: z.array(whatsappMessageSchema).optional(),
});

// WhatsApp entry schema
export const whatsappEntrySchema = z.object({
  id: z.string(),
  changes: z.array(
    z.object({
      value: whatsappValueSchema,
      field: z.literal("messages"),
    }),
  ),
});

// Main WhatsApp webhook schema
export const whatsappWebhookSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(whatsappEntrySchema),
});

export type WhatsappWebhookPayload = z.infer<typeof whatsappWebhookSchema>;
export type WhatsappMessage = z.infer<typeof whatsappMessageSchema>;
export type WhatsappMedia = z.infer<typeof whatsappMediaSchema>;
