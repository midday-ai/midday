import {
  type ConnectedResolvedConversation,
  getPlatformIdentityNotificationContext,
  requireResolvedConversationIdentity,
} from "@api/bot/conversation-identity";
import {
  extractConnectionToken,
  getMessageAuthorId,
  isExplicitConnectionAttempt,
} from "@api/bot/linking";
import {
  buildWelcomeMessage,
  mapPlatformLinkError,
  PlatformSetupFailedError,
  resolvePlatformLinkCode,
} from "@api/bot/platform-resolver";
import {
  consumeResolvedConversation,
  forgetThreadState,
  hasCurrentTeamAccess,
  notifyTeamAccessRevoked,
  rememberThreadState,
} from "@api/bot/thread-helpers";
import {
  type BotThreadState,
  canReuseCachedThreadState,
} from "@api/bot/thread-state";
import { streamMiddayAssistant } from "@api/chat/assistant-runtime";
import { buildSystemPrompt } from "@api/chat/prompt";
import { stripFileAndImageParts } from "@api/chat/utils";
import type { McpContext } from "@api/mcp/types";
import { expandScopes } from "@api/utils/scopes";
import type { SlackAdapter } from "@chat-adapter/slack";
import {
  type BotPlatform,
  bot,
  formatInboxResultMessage,
  formatNotificationContextForPrompt,
  formatProcessedUploadSummary,
  getPlatformInstructions,
  isSupportedInboxUploadMediaType,
  type NotificationContext,
  processInboxUpload,
} from "@midday/bot";
import { db } from "@midday/db/client";
import {
  TelegramAlreadyConnectedToAnotherTeamError,
  WhatsAppAlreadyConnectedToAnotherTeamError,
} from "@midday/db/errors";
import {
  addTelegramConnection,
  addWhatsAppConnection,
  consumePlatformLinkToken,
  createOrUpdatePlatformIdentity,
  getAppBySlackTeamId,
  getPlatformIdentity,
  getTeamById,
  getUserById,
  updatePlatformIdentityMetadata,
} from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import type { ModelMessage } from "ai";
import type { Attachment, Message, Thread } from "chat";
import { toAiMessages } from "chat";
import type { SendblueAdapter } from "chat-adapter-sendblue";

const logger = createLoggerWithContext("bot-runtime");

const ALLOWED_ATTACHMENT_HOSTS = new Set([
  "files.slack.com",
  "api.telegram.org",
  "lookaside.fbsbx.com",
  "media.sendblue.co",
]);

function isSafeAttachmentUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    return ALLOWED_ATTACHMENT_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

const ALL_ASSISTANT_SCOPES = expandScopes(["apis.all"]) as McpContext["scopes"];

type ResolvedConversation =
  | (ConnectedResolvedConversation & { consumed?: boolean })
  | { connected: false };

let registered = false;

export function registerMiddayBotRuntime() {
  if (registered) {
    return;
  }

  registered = true;

  bot.onNewMention(async (thread, message) => {
    try {
      await thread.subscribe().catch(() => {});
      await handleIncomingMessage(thread, message);
    } catch (error) {
      logger.error("[bot] Unhandled error in onNewMention", {
        error: error instanceof Error ? error.message : String(error),
        threadId: thread?.id,
      });
    }
  });

  bot.onSubscribedMessage(async (thread, message) => {
    try {
      await handleIncomingMessage(thread, message);
    } catch (error) {
      logger.error("[bot] Unhandled error in onSubscribedMessage", {
        error: error instanceof Error ? error.message : String(error),
        threadId: thread?.id,
      });
    }
  });

  bot.onNewMessage(/[\s\S]*/u, async (thread, message) => {
    if (thread.adapter.name !== "slack" || !thread.isDM) {
      return;
    }

    try {
      await thread.subscribe().catch(() => {});
      await handleIncomingMessage(thread, message);
    } catch (error) {
      logger.error("[bot] Unhandled error in onNewMessage (Slack DM)", {
        error: error instanceof Error ? error.message : String(error),
        threadId: thread?.id,
      });
    }
  });

  bot.onAssistantThreadStarted(async (event) => {
    await updateSlackSuggestedPrompts(event.channelId, event.threadTs);
  });

  bot.onAssistantContextChanged(async (event) => {
    await updateSlackSuggestedPrompts(event.channelId, event.threadTs);
  });
}

async function handleIncomingMessage(
  thread: Thread<BotThreadState>,
  message: Message,
) {
  if (message?.author?.isMe || message?.author?.isBot) {
    return;
  }

  const platform = normalizePlatform(thread.adapter.name);
  if (!platform) {
    return;
  }

  const resolved = (await resolveConversation(
    thread,
    message,
    platform,
  )) as ResolvedConversation | null;

  if (!resolved || resolved.connected === false) {
    return;
  }

  if (resolved.consumed) {
    return;
  }

  const connectedConversation = await hydrateResolvedConversationIdentity({
    thread,
    message,
    platform,
    resolved,
  });

  if (!connectedConversation) {
    await forgetThreadState(thread);
    await thread
      .post(
        "This chat is no longer linked to an authorized Midday workspace. Reconnect it from Midday and try again.",
      )
      .catch(() => {});
    return;
  }

  if (connectedConversation.identityId) {
    await updatePlatformIdentityMetadata(db, {
      id: connectedConversation.identityId,
      metadata: {
        lastSeenAt: new Date().toISOString(),
      },
    }).catch(() => {});
  }

  const user = await getUserById(db, connectedConversation.actingUserId);

  if (!user) {
    await thread.post(
      "I couldn't resolve the Midday user for this connection. Reconnect it from the dashboard and try again.",
    );
    return;
  }

  await thread.startTyping("Working in Midday...").catch(() => {});

  const { summaries: recentUploadSummaries, richMessages: uploadMessages } =
    await processIncomingAttachments({
      thread,
      message,
      teamId: connectedConversation.teamId,
      actingUserId: connectedConversation.actingUserId,
      platform,
    });

  if (uploadMessages.length > 0) {
    for (const msg of uploadMessages) {
      await thread.post(msg).catch(() => {});
    }

    const textContent = (message?.text ?? "").trim();
    if (!textContent) {
      return;
    }
  }

  const history = await getConversationHistory(thread);

  const mcpCtx: McpContext = {
    db,
    teamId: connectedConversation.teamId,
    userId: user.id,
    userEmail: user.email ?? null,
    scopes: ALL_ASSISTANT_SCOPES,
    apiUrl: process.env.MIDDAY_API_URL || "https://api.midday.ai",
    timezone: user.timezone ?? "UTC",
    locale: user.locale ?? "en",
    countryCode: user.team?.countryCode ?? null,
    dateFormat: user.dateFormat ?? null,
    timeFormat: user.timeFormat ?? null,
  };

  const systemPrompt =
    buildSystemPrompt({
      fullName: user.fullName ?? null,
      locale: user.locale ?? "en",
      timezone: user.timezone ?? "UTC",
      dateFormat: user.dateFormat ?? null,
      timeFormat: user.timeFormat ?? 24,
      baseCurrency: user.team?.baseCurrency ?? "USD",
      teamName: user.team?.name ?? null,
      countryCode: user.team?.countryCode ?? null,
      localTime: null,
      recentUploadSummaries,
    }) +
    getPlatformInstructions(platform) +
    (connectedConversation.notificationContext
      ? `\n\n${formatNotificationContextForPrompt(
          connectedConversation.notificationContext as NotificationContext,
        )}`
      : "");

  const modelMessages = await toAiMessages(history, {
    includeNames: platform === "slack",
  });

  stripFileAndImageParts(modelMessages as Array<ModelMessage>);

  const result = await streamMiddayAssistant({
    mcpCtx,
    systemPrompt,
    modelMessages: modelMessages as Array<ModelMessage>,
  });

  try {
    await thread.post(result.fullStream);
  } finally {
    await result.cleanup();
  }

  if (
    connectedConversation.identityId &&
    connectedConversation.notificationContext
  ) {
    await updatePlatformIdentityMetadata(db, {
      id: connectedConversation.identityId,
      metadata: {
        lastNotificationContext: null,
      },
    }).catch(() => {});
  }
}

async function resolveConversation(
  thread: Thread<BotThreadState>,
  message: Message,
  platform: BotPlatform,
) {
  const threadState = ((await thread.state) ?? {}) as BotThreadState;
  const externalUserId = getMessageAuthorId(message);

  const isLinkCodeMessage =
    platform === "slack" ||
    platform === "telegram" ||
    platform === "whatsapp" ||
    platform === "sendblue"
      ? !!extractConnectionToken(platform, message?.text)
      : false;

  if (
    !isLinkCodeMessage &&
    canReuseCachedThreadState(threadState, { platform, externalUserId })
  ) {
    return {
      connected: true as const,
      teamId: threadState.teamId,
      actingUserId: threadState.actingUserId,
    };
  }

  if (platform === "whatsapp") {
    return resolveWhatsAppConversation(thread, message);
  }

  if (platform === "telegram") {
    return resolveTelegramConversation(thread, message);
  }

  if (platform === "slack") {
    return resolveSlackConversation(thread, message);
  }

  if (platform === "sendblue") {
    return resolveSendblueConversation(thread, message);
  }

  return null;
}

async function hydrateResolvedConversationIdentity(params: {
  thread: Thread<BotThreadState>;
  message: Message;
  platform: BotPlatform;
  resolved: ConnectedResolvedConversation;
}) {
  const { thread, message, platform, resolved } = params;

  if (
    platform !== "slack" &&
    platform !== "telegram" &&
    platform !== "whatsapp" &&
    platform !== "sendblue"
  ) {
    return null;
  }

  const externalUserId = getMessageAuthorId(message);
  if (!externalUserId) {
    return null;
  }

  const identity = await getPlatformIdentity(db, {
    provider: platform,
    externalUserId,
    externalTeamId: platform === "slack" ? getSlackTeamId(message) : undefined,
  });

  const connectedConversation = requireResolvedConversationIdentity(
    resolved,
    identity,
  );

  if (!connectedConversation) {
    return null;
  }

  if (
    !(await hasCurrentTeamAccess(
      connectedConversation.teamId,
      connectedConversation.actingUserId,
    ))
  ) {
    return null;
  }

  if (platform === "slack" && !thread.isDM) {
    const slackTeamId = getSlackTeamId(message);

    if (!slackTeamId) {
      return null;
    }

    const app = await getAppBySlackTeamId(db, {
      slackTeamId,
      channelId: thread.channelId,
    });

    if (!app?.teamId || app.teamId !== connectedConversation.teamId) {
      return null;
    }
  }

  return connectedConversation;
}

function resolveWhatsAppConversation(
  thread: Thread<BotThreadState>,
  message: Message,
) {
  return resolvePlatformLinkCode(thread, message, {
    provider: "whatsapp",
    displayName: "WhatsApp number",
    buildIdentityFields: ({ message: msg }) => ({
      metadata: {
        displayName:
          msg?.author?.fullName || msg?.author?.userName || undefined,
      },
    }),
    afterConnect: async ({ token, externalUserId, message: msg }) => {
      const app = await addWhatsAppConnection(db, {
        teamId: token.teamId,
        phoneNumber: externalUserId,
        displayName:
          msg?.author?.fullName || msg?.author?.userName || undefined,
        createdBy: token.userId,
      });
      if (!app) {
        throw new PlatformSetupFailedError();
      }
    },
    platformErrors: [
      {
        errorClass: WhatsAppAlreadyConnectedToAnotherTeamError,
        message:
          "This WhatsApp number is already connected to another Midday workspace.",
      },
    ],
    welcomeMessage: (name) => buildWelcomeMessage(name, "whatsapp"),
    invalidCodeMessage:
      "That WhatsApp link code is invalid or expired. Open Midday and generate a new one.",
    promptConnectMessage:
      "Connect WhatsApp from Midday first, then send the prefilled connection message here.",
  });
}

function resolveSendblueConversation(
  thread: Thread<BotThreadState>,
  message: Message,
) {
  return resolvePlatformLinkCode(thread, message, {
    provider: "sendblue",
    displayName: "phone number",
    buildIdentityFields: ({ message: msg }) => ({
      metadata: {
        displayName:
          msg?.author?.fullName || msg?.author?.userName || undefined,
      },
    }),
    afterConnect: async ({ thread: t }) => {
      try {
        await (t.adapter as SendblueAdapter).sendMediaMessage(
          t.id,
          "https://cdn.midday.ai/midday-contact.vcf",
        );
      } catch {
        // Contact card is best-effort
      }
    },
    welcomeMessage: (name) => buildWelcomeMessage(name, "sendblue"),
    invalidCodeMessage:
      "That iMessage link code is invalid or expired. Open Midday and generate a new one.",
    promptConnectMessage:
      "Connect iMessage from Midday first, then send the connection code here.",
  });
}

function resolveTelegramConversation(
  thread: Thread<BotThreadState>,
  message: Message,
) {
  return resolvePlatformLinkCode(thread, message, {
    provider: "telegram",
    displayName: "Telegram account",
    buildIdentityFields: ({ message: msg, thread: t }) => ({
      externalChannelId: String(t.channelId),
      metadata: {
        username: msg?.author?.userName || undefined,
        displayName:
          msg?.author?.fullName || msg?.author?.userName || undefined,
      },
    }),
    afterConnect: async ({
      token,
      externalUserId,
      message: msg,
      thread: t,
    }) => {
      const app = await addTelegramConnection(db, {
        teamId: token.teamId,
        userId: externalUserId,
        chatId: String(t.channelId),
        username: msg?.author?.userName || undefined,
        displayName:
          msg?.author?.fullName || msg?.author?.userName || undefined,
        createdBy: token.userId,
      });
      if (!app) {
        throw new PlatformSetupFailedError();
      }
    },
    platformErrors: [
      {
        errorClass: TelegramAlreadyConnectedToAnotherTeamError,
        message:
          "This Telegram account is already connected to another Midday workspace.",
      },
    ],
    welcomeMessage: (name) => buildWelcomeMessage(name, "telegram"),
    invalidCodeMessage:
      "That Telegram link code is invalid or expired. Open Midday and generate a new one.",
    promptConnectMessage:
      "Open Telegram from Midday to connect this chat, then come back here.",
  });
}

async function resolveSlackConversation(
  thread: Thread<BotThreadState>,
  message: Message,
) {
  const slackTeamId = getSlackTeamId(message);
  const slackUserId = getMessageAuthorId(message);

  if (!slackTeamId || !slackUserId) {
    logger.warn("Slack message missing workspace identifier", {
      threadId: thread.id,
    });
    return { connected: false as const };
  }

  const existingIdentity = await getPlatformIdentity(db, {
    provider: "slack",
    externalUserId: slackUserId,
    externalTeamId: slackTeamId,
  });

  const code = extractConnectionToken("slack", message?.text);

  if (
    thread.isDM &&
    !code &&
    existingIdentity?.teamId &&
    existingIdentity.userId
  ) {
    if (
      !(await hasCurrentTeamAccess(
        existingIdentity.teamId,
        existingIdentity.userId,
      ))
    ) {
      await notifyTeamAccessRevoked(thread);
      return { connected: false as const };
    }

    await rememberThreadState(thread, {
      teamId: existingIdentity.teamId,
      actingUserId: existingIdentity.userId,
      platform: "slack",
      externalUserId: slackUserId,
    });

    return {
      connected: true as const,
      teamId: existingIdentity.teamId,
      actingUserId: existingIdentity.userId,
      identityId: existingIdentity.id,
      notificationContext: getPlatformIdentityNotificationContext(
        existingIdentity.metadata as Record<string, unknown> | null,
      ),
    };
  }

  const app = await getAppBySlackTeamId(db, {
    slackTeamId,
    channelId: thread.isDM ? undefined : thread.channelId,
  });

  if (code) {
    const token = await consumePlatformLinkToken(db, {
      provider: "slack",
      code,
    });

    if (token) {
      if (app?.teamId && app.teamId !== token.teamId) {
        await thread.post(
          "That Slack link code belongs to another Midday workspace. Generate a new code for this workspace.",
        );
        return { connected: false as const };
      }

      if (!(await hasCurrentTeamAccess(token.teamId, token.userId))) {
        await notifyTeamAccessRevoked(thread);
        return { connected: false as const };
      }

      try {
        const identity = await createOrUpdatePlatformIdentity(db, {
          provider: "slack",
          teamId: token.teamId,
          userId: token.userId,
          externalUserId: slackUserId,
          externalTeamId: slackTeamId,
          externalChannelId: thread.channelId,
          metadata: {
            displayName:
              message?.author?.fullName ||
              message?.author?.userName ||
              undefined,
            source: "slack_link_code",
          },
        });

        const team = await getTeamById(db, token.teamId);

        await rememberThreadState(thread, {
          teamId: token.teamId,
          actingUserId: token.userId,
          platform: "slack",
          externalUserId: slackUserId,
        });

        await thread.post(buildWelcomeMessage(team?.name ?? "Midday", "slack"));

        return consumeResolvedConversation({
          connected: true as const,
          teamId: token.teamId,
          actingUserId: token.userId,
          identityId: identity.id,
        });
      } catch (error) {
        const platformMsg = mapPlatformLinkError(error, "Slack user");
        if (platformMsg) {
          await thread.post(platformMsg);
          return { connected: false as const };
        }
        throw error;
      }
    }

    if (
      !(thread.isDM && existingIdentity?.teamId && existingIdentity.userId) &&
      isExplicitConnectionAttempt("slack", message?.text)
    ) {
      await thread.post(
        "That Slack link code is invalid or expired. Open Midday and generate a new one.",
      );
      return { connected: false as const };
    }
  }

  if (!existingIdentity?.userId) {
    await thread.post(
      "Slack is installed, but this Slack user is not linked yet. Open Midday, choose Link Slack User, and send the generated code to the Midday bot in Slack.",
    );
    return { connected: false as const };
  }

  const resolvedTeamId = thread.isDM ? existingIdentity.teamId : app?.teamId;
  if (!resolvedTeamId) {
    await thread.post(
      "Slack is installed, but I couldn't map this conversation to a Midday workspace.",
    );
    return { connected: false as const };
  }

  if (!(await hasCurrentTeamAccess(resolvedTeamId, existingIdentity.userId))) {
    await notifyTeamAccessRevoked(thread);
    return { connected: false as const };
  }

  await rememberThreadState(thread, {
    teamId: resolvedTeamId,
    actingUserId: existingIdentity.userId,
    platform: "slack",
    externalUserId: slackUserId,
  });

  return {
    connected: true as const,
    teamId: resolvedTeamId,
    actingUserId: existingIdentity.userId,
    identityId: existingIdentity.id,
    notificationContext: getPlatformIdentityNotificationContext(
      existingIdentity.metadata as Record<string, unknown> | null,
    ),
  };
}

async function processIncomingAttachments(params: {
  thread: Thread<BotThreadState>;
  message: Message;
  teamId: string;
  actingUserId: string;
  platform: BotPlatform;
}) {
  const { thread, message, teamId, actingUserId, platform } = params;
  const summaries: string[] = [];
  const richMessages: string[] = [];

  const attachments = message.attachments ?? [];

  for (const [index, attachment] of attachments.entries()) {
    if (!isSupportedAttachment(attachment)) {
      logger.info("[attachments] Skipping unsupported attachment", {
        type: attachment.type,
        mimeType: attachment.mimeType,
      });
      continue;
    }

    try {
      let data =
        attachment.data ??
        (typeof attachment.fetchData === "function"
          ? await attachment.fetchData()
          : null);

      if (!data && attachment.url && isSafeAttachmentUrl(attachment.url)) {
        const res = await fetch(attachment.url);
        if (res.ok) {
          data = Buffer.from(await res.arrayBuffer());
        }
      }

      if (!data) {
        logger.info("[attachments] No data resolved for attachment", {
          name: attachment.name,
        });
        continue;
      }

      const result = await processInboxUpload({
        db,
        teamId,
        userId: actingUserId,
        fileData: new Uint8Array(
          data instanceof Blob
            ? await data.arrayBuffer()
            : (data as ArrayBuffer | Buffer),
        ),
        mimeType: attachment.mimeType || "application/octet-stream",
        fileName: attachment.name,
        referenceId: `${platform}_${message?.id || thread.id}_${index}`,
        platform,
        platformMeta: {
          threadId: thread.id,
          channelId: thread.channelId,
          messageId: message?.id,
          externalUserId: getMessageAuthorId(message),
          actingUserId,
        },
      });

      summaries.push(formatProcessedUploadSummary(result));
      richMessages.push(formatInboxResultMessage(result));

      try {
        await thread.adapter.addReaction(thread.id, message.id, "like");
      } catch {
        // Reaction is best-effort
      }
    } catch (error) {
      logger.warn("Failed to process bot attachment", {
        platform,
        error: error instanceof Error ? error.message : String(error),
        filename: attachment.name,
      });
    }
  }

  return { summaries, richMessages };
}

async function getConversationHistory(thread: Thread<BotThreadState>) {
  await thread.refresh();
  return thread.recentMessages || [];
}

function isSupportedAttachment(attachment: Attachment) {
  if (!attachment.mimeType) {
    return false;
  }

  return (
    (attachment.type === "image" || attachment.type === "file") &&
    isSupportedInboxUploadMediaType(attachment.mimeType)
  );
}

function getSlackTeamId(message: Message) {
  const raw = message.raw as
    | {
        team?: string;
        team_id?: string;
        teamId?: string;
      }
    | undefined;

  return raw?.team || raw?.team_id || raw?.teamId;
}

const SUPPORTED_PLATFORMS = new Set<BotPlatform>([
  "whatsapp",
  "telegram",
  "slack",
  "sendblue",
]);

function normalizePlatform(platformName: string): BotPlatform | null {
  return SUPPORTED_PLATFORMS.has(platformName as BotPlatform)
    ? (platformName as BotPlatform)
    : null;
}

async function updateSlackSuggestedPrompts(
  channelId: string,
  threadTs: string,
) {
  try {
    const slack = bot.getAdapter("slack") as SlackAdapter;
    await slack.setSuggestedPrompts(channelId, threadTs, [
      {
        title: "How's my business doing?",
        message: "Give me a financial overview of this month so far",
      },
      {
        title: "Burn rate & runway",
        message: "What's my current burn rate and how long is my runway?",
      },
      {
        title: "Draft an invoice",
        message: "Help me draft a new invoice",
      },
    ]);
  } catch (error) {
    logger.debug("Failed to update Slack suggested prompts", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
