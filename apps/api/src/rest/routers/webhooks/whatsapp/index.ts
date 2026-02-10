import type { Context } from "@api/rest/types";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  createWhatsAppClient,
  extractInboxIdFromMessage,
  formatAlreadyConnectedMessage,
  formatAlreadyConnectedToAnotherTeamError,
  formatConnectionSuccess,
  formatMatchActionErrorMessage,
  formatMatchConfirmedMessage,
  formatMatchDeclinedMessage,
  formatMatchSuggestionNotFoundMessage,
  formatNotConnectedMessage,
  formatTeamNotFoundError,
  formatUnsupportedFileTypeMessage,
  formatWelcomeMessage,
  isAllowedMimeType,
  parseMatchButtonId,
  REACTION_EMOJIS,
  triggerWhatsAppUploadJob,
  verifyWebhookSignature,
  type WhatsAppWebhookPayload,
} from "@midday/app-store/whatsapp/server";
import { WhatsAppAlreadyConnectedToAnotherTeamError } from "@midday/db/errors";
import {
  addWhatsAppConnection,
  confirmSuggestedMatch,
  declineSuggestedMatch,
  getAppByWhatsAppNumber,
  getSuggestionByInboxAndTransaction,
  getTeamById,
  getTeamByInboxId,
} from "@midday/db/queries";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

// Webhook verification endpoint (GET)
// Meta sends a GET request to verify the webhook URL
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "WhatsApp webhook verification",
    operationId: "whatsappWebhookVerify",
    description: "Verify webhook URL for WhatsApp Business API",
    tags: ["Webhooks"],
    request: {
      query: z.object({
        "hub.mode": z.string(),
        "hub.verify_token": z.string(),
        "hub.challenge": z.string(),
      }),
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
      403: {
        description: "Verification failed",
      },
    },
  }),
  async (c) => {
    const mode = c.req.query("hub.mode");
    const token = c.req.query("hub.verify_token");
    const challenge = c.req.query("hub.challenge");

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (!verifyToken) {
      logger.error("WHATSAPP_VERIFY_TOKEN not configured");
      throw new HTTPException(500, {
        message: "WhatsApp webhook not configured",
      });
    }

    if (mode === "subscribe" && token === verifyToken) {
      logger.info("WhatsApp webhook verified successfully");
      return c.text(challenge || "");
    }

    logger.warn("WhatsApp webhook verification failed", {
      mode,
      tokenMatch: token === verifyToken,
    });
    throw new HTTPException(403, { message: "Verification failed" });
  },
);

// Webhook handler endpoint (POST)
// Receives messages, media, and button replies from WhatsApp
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "WhatsApp webhook",
    operationId: "whatsappWebhook",
    description:
      "Receive messages, media, and button replies from WhatsApp Business API",
    tags: ["Webhooks"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.any(),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Webhook processed successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
      },
      400: {
        description: "Invalid request",
      },
      403: {
        description: "Invalid signature",
      },
    },
  }),
  async (c) => {
    // Verify webhook signature in production
    if (process.env.NODE_ENV !== "development") {
      const signature = c.req.header("x-hub-signature-256");
      const appSecret = process.env.WHATSAPP_APP_SECRET;

      if (!appSecret) {
        logger.error("WHATSAPP_APP_SECRET not configured");
        throw new HTTPException(500, {
          message: "WhatsApp webhook not configured",
        });
      }

      const rawBody = await c.req.text();

      if (!verifyWebhookSignature(rawBody, signature || "", appSecret)) {
        logger.warn("WhatsApp webhook signature verification failed");
        throw new HTTPException(403, { message: "Invalid signature" });
      }

      // Re-parse the body since we consumed it for signature verification
      const body = JSON.parse(rawBody) as WhatsAppWebhookPayload;
      return handleWebhook(c, body);
    }

    const body = (await c.req.json()) as WhatsAppWebhookPayload;
    return handleWebhook(c, body);
  },
);

async function handleWebhook(c: any, payload: WhatsAppWebhookPayload) {
  const db = c.get("db");

  // Meta sends webhooks for various events, we only care about messages
  if (payload.object !== "whatsapp_business_account") {
    return c.json({ success: true });
  }

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") {
        continue;
      }

      const value = change.value;
      const contacts = value.contacts || [];
      const messages = value.messages || [];

      for (const message of messages) {
        const phoneNumber = message.from;
        const messageId = message.id;
        const contact = contacts.find((c) => c.wa_id === phoneNumber);
        const displayName = contact?.profile?.name;

        logger.info("WhatsApp message received", {
          phoneNumber,
          messageId,
          type: message.type,
          displayName,
        });

        try {
          // Handle different message types
          switch (message.type) {
            case "text":
              await handleTextMessage(
                db,
                phoneNumber,
                messageId,
                message.text?.body || "",
                displayName,
              );
              break;

            case "image":
            case "document":
              await handleMediaMessage(db, phoneNumber, messageId, message);
              break;

            case "interactive":
              if (message.interactive?.button_reply) {
                await handleButtonReply(
                  db,
                  phoneNumber,
                  messageId,
                  message.interactive.button_reply.id,
                );
              }
              break;

            default:
              logger.info("Unsupported message type", {
                type: message.type,
                phoneNumber,
                messageId,
              });
          }
        } catch (error) {
          logger.error("Error processing WhatsApp message", {
            phoneNumber,
            messageId,
            type: message.type,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          // Continue processing other messages even if one fails
        }
      }
    }
  }

  return c.json({ success: true });
}

/**
 * Handle text messages - check for inbox ID to create connection
 */
async function handleTextMessage(
  db: any,
  phoneNumber: string,
  _messageId: string,
  text: string,
  displayName?: string,
) {
  const inboxId = extractInboxIdFromMessage(text);

  if (!inboxId) {
    // Not a connection request, check if already connected
    const existingConnection = await getAppByWhatsAppNumber(db, phoneNumber);
    const client = createWhatsAppClient();
    if (!existingConnection) {
      // Send instructions for unconnected users
      await client.sendMessage(phoneNumber, formatWelcomeMessage());
    } else {
      // User is already connected - send helpful message about uploading receipts
      await client.sendMessage(phoneNumber, formatAlreadyConnectedMessage());
    }
    return;
  }

  // Find team by inbox ID
  const team = await getTeamByInboxId(db, inboxId);

  if (!team) {
    logger.warn("Team not found for inbox ID", { inboxId, phoneNumber });
    const client = createWhatsAppClient();
    await client.sendMessage(phoneNumber, formatTeamNotFoundError());
    return;
  }

  // Add WhatsApp connection
  try {
    await addWhatsAppConnection(db, {
      teamId: team.id,
      phoneNumber,
      displayName,
    });

    logger.info("WhatsApp connection created", {
      teamId: team.id,
      phoneNumber,
      displayName,
    });

    const client = createWhatsAppClient();
    await client.sendMessage(
      phoneNumber,
      formatConnectionSuccess(team?.name || "your team"),
    );
  } catch (error) {
    if (error instanceof WhatsAppAlreadyConnectedToAnotherTeamError) {
      // User is trying to connect to Team A but already connected to Team B
      const existingConnection = await getAppByWhatsAppNumber(db, phoneNumber);
      const client = createWhatsAppClient();
      if (existingConnection?.teamId) {
        const existingTeam = await getTeamById(db, existingConnection.teamId);
        await client.sendMessage(
          phoneNumber,
          formatAlreadyConnectedToAnotherTeamError(
            existingTeam?.name || "another team",
            team?.name || "this team",
          ),
        );
      } else {
        // Fallback if we can't get team info
        await client.sendMessage(
          phoneNumber,
          formatAlreadyConnectedToAnotherTeamError(
            "another team",
            team?.name || "this team",
          ),
        );
      }
    } else {
      throw error;
    }
  }
}

/**
 * Handle media messages (images, documents)
 */
async function handleMediaMessage(
  db: any,
  phoneNumber: string,
  messageId: string,
  message: any,
) {
  // Check if phone number is connected
  const app = await getAppByWhatsAppNumber(db, phoneNumber);

  if (!app || !app.teamId) {
    logger.warn("WhatsApp number not connected", { phoneNumber, messageId });
    const client = createWhatsAppClient();
    await client.sendMessage(phoneNumber, formatNotConnectedMessage());
    return;
  }

  const teamId = app.teamId;
  const mediaData = message.image || message.document;

  if (!mediaData) {
    logger.warn("No media data in message", { phoneNumber, messageId });
    return;
  }

  const mimeType = mediaData.mime_type;

  // Check if MIME type is allowed
  if (!isAllowedMimeType(mimeType)) {
    logger.info("Unsupported file type", {
      phoneNumber,
      messageId,
      mimeType,
    });
    const client = createWhatsAppClient();
    await client.sendMessage(phoneNumber, formatUnsupportedFileTypeMessage());
    return;
  }

  // React with hourglass to indicate processing
  try {
    const client = createWhatsAppClient();
    await client.reactToMessage(
      phoneNumber,
      messageId,
      REACTION_EMOJIS.PROCESSING,
    );
  } catch (error) {
    logger.warn("Failed to add processing reaction", {
      phoneNumber,
      messageId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Trigger the upload job
  await triggerWhatsAppUploadJob({
    teamId,
    phoneNumber,
    messageId,
    mediaId: mediaData.id,
    mimeType,
    filename: mediaData.filename,
    caption: mediaData.caption,
  });
}

/**
 * Handle interactive button replies (confirm/decline match)
 */
async function handleButtonReply(
  db: any,
  phoneNumber: string,
  _messageId: string,
  buttonId: string,
) {
  const parsed = parseMatchButtonId(buttonId);

  if (!parsed) {
    logger.warn("Invalid button ID format", { phoneNumber, buttonId });
    return;
  }

  const { action, inboxId, transactionId } = parsed;

  logger.info("Match button clicked", {
    phoneNumber,
    action,
    inboxId,
    transactionId,
  });

  // Get WhatsApp app to retrieve teamId
  const app = await getAppByWhatsAppNumber(db, phoneNumber);

  if (!app || !app.teamId) {
    logger.warn("WhatsApp number not connected", { phoneNumber });
    const client = createWhatsAppClient();
    await client.sendMessage(phoneNumber, formatNotConnectedMessage());
    return;
  }

  const teamId = app.teamId;

  // Get the suggestion to confirm/decline
  const suggestion = await getSuggestionByInboxAndTransaction(db, {
    inboxId,
    transactionId,
    teamId,
  });

  if (!suggestion) {
    logger.warn("Match suggestion not found", {
      phoneNumber,
      inboxId,
      transactionId,
      teamId,
    });
    const client = createWhatsAppClient();
    await client.sendMessage(
      phoneNumber,
      formatMatchSuggestionNotFoundMessage(),
    );
    return;
  }

  const client = createWhatsAppClient();

  try {
    if (action === "confirm") {
      // Confirm the match
      await confirmSuggestedMatch(db, {
        suggestionId: suggestion.id,
        inboxId,
        transactionId,
        userId: undefined, // WhatsApp interactions don't have Midday user ID mapping
        teamId,
      });

      logger.info("Match confirmed via WhatsApp", {
        phoneNumber,
        inboxId,
        transactionId,
        suggestionId: suggestion.id,
      });

      await client.sendMessage(phoneNumber, formatMatchConfirmedMessage());
    } else {
      // Decline the match
      await declineSuggestedMatch(db, {
        suggestionId: suggestion.id,
        inboxId,
        userId: undefined, // WhatsApp interactions don't have Midday user ID mapping
        teamId,
      });

      logger.info("Match declined via WhatsApp", {
        phoneNumber,
        inboxId,
        transactionId,
        suggestionId: suggestion.id,
      });

      await client.sendMessage(phoneNumber, formatMatchDeclinedMessage());
    }
  } catch (error) {
    logger.error("Failed to process match action via WhatsApp", {
      phoneNumber,
      inboxId,
      transactionId,
      action,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    await client.sendMessage(
      phoneNumber,
      formatMatchActionErrorMessage(action),
    );
  }
}

export { app as whatsappWebhookRouter };
