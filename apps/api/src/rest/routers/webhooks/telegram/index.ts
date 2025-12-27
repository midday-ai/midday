import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  type TelegramUpdate,
  createTelegramClient,
  extractInboxIdFromMessage,
  formatAlreadyConnectedMessage,
  formatAlreadyConnectedToAnotherTeamError,
  formatConnectionSuccess,
  formatInvalidCodeMessage,
  formatNotConnectedMessage,
  formatProcessingStartedMessage,
  formatTeamNotFoundError,
  formatUnsupportedFileTypeMessage,
  formatWelcomeMessage,
  getDisplayName,
  isSupportedMediaType,
  parseMatchCallbackData,
  triggerTelegramUploadJob,
  verifyWebhookSecret,
} from "@midday/app-store/telegram/server";
import { TelegramAlreadyConnectedToAnotherTeamError } from "@midday/db/errors";
import {
  addTelegramConnection,
  confirmSuggestedMatch,
  declineSuggestedMatch,
  getAppByTelegramChatId,
  getSuggestionByInboxAndTransaction,
} from "@midday/db/queries";
import { getTeamById, getTeamByInboxId } from "@midday/db/queries";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

// Webhook endpoint (POST)
// Receives updates from Telegram Bot API
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Telegram webhook",
    operationId: "telegramWebhook",
    description: "Receive updates from Telegram Bot API",
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
      403: {
        description: "Invalid secret token",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");

    // Verify webhook secret in production
    if (process.env.NODE_ENV !== "development") {
      const secretToken = c.req.header("x-telegram-bot-api-secret-token");
      const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

      if (expectedSecret && !verifyWebhookSecret(secretToken, expectedSecret)) {
        logger.warn("Telegram webhook secret verification failed");
        throw new HTTPException(403, { message: "Invalid secret token" });
      }
    }

    const update = (await c.req.json()) as TelegramUpdate;

    try {
      // Handle callback queries (button presses)
      if (update.callback_query) {
        await handleCallbackQuery(db, update.callback_query);
        return c.json({ success: true });
      }

      // Handle messages
      if (update.message) {
        await handleMessage(db, update.message);
      }
    } catch (error) {
      logger.error("Error processing Telegram update", {
        updateId: update.update_id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return c.json({ success: true });
  },
);

/**
 * Handle incoming messages
 */
async function handleMessage(db: any, message: TelegramUpdate["message"]) {
  if (!message) return;

  const chatId = message.chat.id;
  const messageId = message.message_id;
  const displayName = getDisplayName(message.from);

  logger.info("Processing Telegram message", {
    chatId,
    messageId,
    type: message.photo ? "photo" : message.document ? "document" : "text",
    displayName,
  });

  // Handle text messages (connection requests)
  if (message.text) {
    await handleTextMessage(db, chatId, messageId, message.text, displayName);
    return;
  }

  // Handle media messages (photos, documents)
  const mediaInfo = isSupportedMediaType(message);
  if (mediaInfo) {
    await handleMediaMessage(
      db,
      chatId,
      messageId,
      mediaInfo.fileId,
      mediaInfo.mimeType,
      message.document?.file_name,
      message.caption,
    );
    return;
  }

  // Unsupported message type with media
  if (message.document) {
    const client = createTelegramClient();
    await client.sendMessage(chatId, formatUnsupportedFileTypeMessage(), {
      parse_mode: "Markdown",
    });
  }
}

/**
 * Handle text messages - check for inbox ID to create connection
 */
async function handleTextMessage(
  db: any,
  chatId: number,
  messageId: number,
  text: string,
  displayName?: string,
) {
  const client = createTelegramClient();

  // Check if this is a /start command
  if (text.startsWith("/start")) {
    // Check if already connected
    const existingConnection = await getAppByTelegramChatId(db, chatId);
    if (existingConnection) {
      await client.sendMessage(chatId, formatAlreadyConnectedMessage(), {
        parse_mode: "Markdown",
      });
      return;
    }

    // Check if /start has a payload (deep link with inbox ID)
    const startPayload = text.replace("/start", "").trim();
    if (startPayload) {
      await processConnectionCode(
        db,
        client,
        chatId,
        startPayload,
        displayName,
      );
      return;
    }

    // Send welcome message
    const welcome = formatWelcomeMessage();
    await client.sendMessage(chatId, welcome.text, {
      parse_mode: "Markdown",
    });
    return;
  }

  // Try to extract inbox ID from message
  const inboxId = extractInboxIdFromMessage(text);

  if (!inboxId) {
    // Not a connection request, check if already connected
    const existingConnection = await getAppByTelegramChatId(db, chatId);
    if (!existingConnection) {
      const welcome = formatWelcomeMessage();
      await client.sendMessage(chatId, welcome.text, {
        parse_mode: "Markdown",
      });
    } else {
      await client.sendMessage(chatId, formatAlreadyConnectedMessage(), {
        parse_mode: "Markdown",
      });
    }
    return;
  }

  await processConnectionCode(db, client, chatId, inboxId, displayName);
}

/**
 * Process a connection code/inbox ID
 */
async function processConnectionCode(
  db: any,
  client: ReturnType<typeof createTelegramClient>,
  chatId: number,
  inboxId: string,
  displayName?: string,
) {
  // Find team by inbox ID
  const team = await getTeamByInboxId(db, inboxId);

  if (!team) {
    logger.warn("Team not found for inbox ID", { inboxId, chatId });
    await client.sendMessage(chatId, formatTeamNotFoundError(), {
      parse_mode: "Markdown",
    });
    return;
  }

  // Try to add connection
  try {
    await addTelegramConnection(db, {
      teamId: team.id,
      chatId,
      displayName,
    });

    logger.info("Telegram connected successfully", {
      chatId,
      teamId: team.id,
      displayName,
    });

    const success = formatConnectionSuccess(team.name || "Your team");
    await client.sendMessage(chatId, success.text, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    if (error instanceof TelegramAlreadyConnectedToAnotherTeamError) {
      // Get the current team name
      const existingApp = await getAppByTelegramChatId(db, chatId);
      const currentTeam = existingApp?.teamId
        ? await getTeamById(db, { teamId: existingApp.teamId })
        : null;

      await client.sendMessage(
        chatId,
        formatAlreadyConnectedToAnotherTeamError(
          currentTeam?.name || "another team",
          team.name || "requested team",
        ),
        { parse_mode: "Markdown" },
      );
    } else {
      throw error;
    }
  }
}

/**
 * Handle media messages (photos, documents)
 */
async function handleMediaMessage(
  db: any,
  chatId: number,
  messageId: number,
  fileId: string,
  mimeType: string,
  filename?: string,
  caption?: string,
) {
  const client = createTelegramClient();

  // Check if chat is connected
  const app = await getAppByTelegramChatId(db, chatId);

  if (!app || !app.teamId) {
    logger.warn("Telegram chat not connected", { chatId, messageId });
    await client.sendMessage(chatId, formatNotConnectedMessage(), {
      parse_mode: "Markdown",
    });
    return;
  }

  const teamId = app.teamId;

  // Send processing message
  await client.sendMessage(chatId, formatProcessingStartedMessage());

  // Trigger the upload job
  await triggerTelegramUploadJob({
    teamId,
    chatId,
    messageId,
    fileId,
    mimeType,
    filename,
    caption,
  });
}

/**
 * Handle callback queries (button presses)
 */
async function handleCallbackQuery(
  db: any,
  callbackQuery: TelegramUpdate["callback_query"],
) {
  if (!callbackQuery) return;

  const client = createTelegramClient();
  const chatId = callbackQuery.message?.chat.id;
  const data = callbackQuery.data;

  // Always answer the callback query to remove loading state
  await client.answerCallbackQuery(callbackQuery.id);

  if (!chatId || !data) return;

  // Handle match actions
  const matchAction = parseMatchCallbackData(data);
  if (matchAction) {
    await handleMatchAction(
      db,
      client,
      chatId,
      callbackQuery.message?.message_id,
      matchAction,
    );
    return;
  }

  // Handle other callback actions
  if (data === "open_midday" || data === "view_inbox") {
    // These are informational - the actual navigation happens via URL
    await client.answerCallbackQuery(callbackQuery.id, "Opening Midday...");
  }
}

/**
 * Handle match confirm/decline actions
 */
async function handleMatchAction(
  db: any,
  client: ReturnType<typeof createTelegramClient>,
  chatId: number,
  messageId: number | undefined,
  action: { action: "confirm" | "decline"; inboxId: string; transactionId: string },
) {
  try {
    // Get the suggestion
    const suggestion = await getSuggestionByInboxAndTransaction(
      db,
      action.inboxId,
      action.transactionId,
    );

    if (!suggestion) {
      await client.sendMessage(
        chatId,
        "This match suggestion was not found or has already been processed.",
        { parse_mode: "Markdown" },
      );
      return;
    }

    if (action.action === "confirm") {
      await confirmSuggestedMatch(db, {
        inboxId: action.inboxId,
        transactionId: action.transactionId,
      });

      // Update the message to show confirmed
      if (messageId) {
        await client.editMessageText(
          chatId,
          messageId,
          "✅ *Match Confirmed*\n\nThe receipt has been linked to the transaction.",
          { parse_mode: "Markdown" },
        );
      }
    } else {
      await declineSuggestedMatch(db, {
        inboxId: action.inboxId,
        transactionId: action.transactionId,
      });

      // Update the message to show declined
      if (messageId) {
        await client.editMessageText(
          chatId,
          messageId,
          "↩️ *Match Declined*\n\nYou can review and match this receipt manually in Midday.",
          { parse_mode: "Markdown" },
        );
      }
    }
  } catch (error) {
    logger.error("Error handling match action", {
      chatId,
      action,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    await client.sendMessage(
      chatId,
      `Sorry, we encountered an error processing your ${action.action === "confirm" ? "confirmation" : "decline"}. Please try again or handle this in Midday.`,
      { parse_mode: "Markdown" },
    );
  }
}

export { app as telegramWebhookRouter };

