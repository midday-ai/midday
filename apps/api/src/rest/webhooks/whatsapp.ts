import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  type WhatsappMedia,
  type WhatsappMessage,
  whatsappVerificationSchema,
  whatsappWebhookSchema,
} from "@api/schemas/whatsapp";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import type { ProcessAttachmentPayload } from "@midday/jobs/schema";
import { logger } from "@midday/logger";
import { createClient } from "@midday/supabase/server";
import { tasks } from "@trigger.dev/sdk";
import { nanoid } from "nanoid";
import { z } from "zod";

// WhatsApp Business API verification token - should be set in environment variables
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// Function to download media from WhatsApp
async function downloadWhatsAppMedia(mediaId: string): Promise<{
  data: Buffer;
  contentType: string;
  filename: string;
} | null> {
  try {
    // First, get the media URL
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
      },
    );

    if (!mediaResponse.ok) {
      logger.error("Failed to get media URL", {
        status: mediaResponse.statusText,
      });
      return null;
    }

    const mediaInfo = await mediaResponse.json();
    const mediaUrl = mediaInfo.url;

    // Download the actual media
    const fileResponse = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    if (!fileResponse.ok) {
      logger.error("Failed to download media", {
        status: fileResponse.statusText,
      });
      return null;
    }

    const buffer = Buffer.from(await fileResponse.arrayBuffer());
    const contentType =
      fileResponse.headers.get("content-type") || "application/octet-stream";

    // Generate filename based on media type and ID
    const extension = getExtensionFromMimeType(contentType);
    const filename =
      mediaInfo.filename || `whatsapp_media_${mediaId}${extension}`;

    return {
      data: buffer,
      contentType,
      filename,
    };
  } catch (error) {
    logger.error("Error downloading WhatsApp media", { error });
    return null;
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
  };

  return mimeToExt[mimeType] || "";
}

function isAllowedMediaType(mimeType: string): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  return allowedTypes.includes(mimeType);
}

const app = new OpenAPIHono();

// Apply public middleware to all routes
app.use("*", ...publicMiddleware);

// Webhook verification route (GET)
const verifyRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Verify WhatsApp webhook",
  request: {
    query: whatsappVerificationSchema,
  },
  responses: {
    200: {
      description: "Webhook verified successfully",
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
    },
    400: {
      description: "Invalid verification parameters",
    },
    403: {
      description: "Invalid verify token",
    },
  },
});

app.openapi(verifyRoute, async (c: Context) => {
  const query = c.req.valid("query");

  const { "hub.verify_token": verifyToken, "hub.challenge": challenge } = query;

  if (verifyToken !== WHATSAPP_VERIFY_TOKEN) {
    return c.json({ error: "Invalid verify token" }, 403);
  }

  // Return the challenge to verify the webhook
  return c.text(challenge);
});

// Webhook message route (POST)
const webhookRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Handle incoming WhatsApp messages",
  request: {
    body: {
      content: {
        "application/json": {
          schema: whatsappWebhookSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Message processed successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: "Invalid request body",
    },
    500: {
      description: "Internal server error",
    },
  },
});

app.openapi(webhookRoute, async (c: Context) => {
  try {
    const body = await c.req.json();

    const parsedBody = whatsappWebhookSchema.safeParse(body);

    if (!parsedBody.success) {
      logger.error("Invalid WhatsApp webhook payload", {
        errors: parsedBody.error.errors,
      });
      return c.json({ error: "Invalid request body" }, 400);
    }

    const { entry } = parsedBody.data;

    const supabase = await createClient({ admin: true });
    const analytics = await setupAnalytics();

    // Process each entry
    for (const entryItem of entry) {
      for (const change of entryItem.changes) {
        const { value } = change;

        if (!value.messages?.length) {
          continue; // No messages to process
        }

        // Process each message
        for (const message of value.messages) {
          await processWhatsAppMessage(
            message,
            value.metadata.phone_number_id,
            supabase,
            analytics,
          );
        }
      }
    }

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("WhatsApp webhook error", { error: message });

    return c.json({ error: "Failed to process WhatsApp webhook" }, 500);
  }
});

export default app;

async function processWhatsAppMessage(
  message: WhatsappMessage,
  phoneNumberId: string,
  supabase: any,
  analytics: any,
) {
  // Extract inboxId from message text (user should send a message with inboxId)
  let inboxId: string | null = null;

  if (message.text?.body) {
    // Look for inbox ID in the message text
    // Expected format: "inboxId: <id>" or just "<id>" if it looks like a valid inbox ID
    const inboxMatch = message.text.body.match(
      /(?:inbox[Ii]d:\s*)?([a-zA-Z0-9-_]+)/,
    );
    if (inboxMatch) {
      inboxId = inboxMatch[1];
    }
  }

  if (!inboxId) {
    logger.error("No inbox ID found in WhatsApp message", {
      from: message.from,
    });
    return;
  }

  // Get team data by inbox ID
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id, email")
    .eq("inbox_id", inboxId)
    .single();

  if (teamError || !teamData) {
    logger.error("Team not found for inbox ID", { inboxId });
    return;
  }

  analytics.track({
    event: LogEvents.InboxInbound.name,
    channel: LogEvents.InboxInbound.channel,
  });

  const teamId = teamData.id;

  // Check if message has media attachments
  const mediaAttachments: WhatsappMedia[] = [];

  if (message.image) mediaAttachments.push(message.image);
  if (message.document) mediaAttachments.push(message.document);
  if (message.video) mediaAttachments.push(message.video);
  if (message.audio) mediaAttachments.push(message.audio);

  if (!mediaAttachments.length) {
    logger.info("No media attachments in WhatsApp message", {
      from: message.from,
    });
    return;
  }

  // Process each media attachment
  const uploadedAttachments = [];

  for (const media of mediaAttachments) {
    if (!isAllowedMediaType(media.mime_type)) {
      logger.info("Skipping unsupported media type", {
        mimeType: media.mime_type,
      });
      continue;
    }

    const downloadedMedia = await downloadWhatsAppMedia(media.id);

    if (!downloadedMedia) {
      logger.error("Failed to download media", { mediaId: media.id });
      continue;
    }

    // Add random suffix to filename to make it unique
    const uniqueFileName = downloadedMedia.filename.replace(
      /(\.[^.]+)?$/,
      `_${nanoid(4)}$1`,
    );

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vault")
      .upload(`${teamId}/inbox/${uniqueFileName}`, downloadedMedia.data, {
        contentType: downloadedMedia.contentType,
        upsert: true,
      });

    if (uploadError || !uploadData) {
      logger.error("Failed to upload media to Supabase", {
        error: uploadError?.message,
      });
      continue;
    }

    uploadedAttachments.push({
      display_name: media.filename || uniqueFileName,
      team_id: teamId,
      file_path: uploadData.path.split("/"),
      file_name: uniqueFileName,
      content_type: downloadedMedia.contentType,
      reference_id: `whatsapp_${message.id}_${media.id}`,
      size: downloadedMedia.data.length,
    });
  }

  if (!uploadedAttachments.length) {
    logger.info("No attachments were successfully uploaded");
    return;
  }

  // Trigger process-attachment jobs
  await tasks.batchTrigger(
    "process-attachment",
    uploadedAttachments.map((item) => ({
      payload: {
        filePath: item.file_path,
        mimetype: item.content_type,
        size: item.size,
        teamId: teamId,
        referenceId: item.reference_id,
      } satisfies ProcessAttachmentPayload,
    })),
  );

  // Send notification for WhatsApp attachments
  await tasks.trigger("notification", {
    type: "inbox_new",
    teamId: teamId,
    totalCount: uploadedAttachments.length,
    inboxType: "whatsapp",
  });

  logger.info("Processed WhatsApp attachments", {
    count: uploadedAttachments.length,
    teamId,
  });
}
