import {
  type ConnectedResolvedConversation,
  getPlatformIdentityNotificationContext,
  requireResolvedConversationIdentity,
} from "@api/bot/conversation-identity";
import { extractConnectionToken, getMessageAuthorId } from "@api/bot/linking";
import {
  type BotThreadState,
  canReuseCachedThreadState,
} from "@api/bot/thread-state";
import { streamMiddayAssistant } from "@api/chat/assistant-runtime";
import { buildSystemPrompt } from "@api/chat/prompt";
import type { McpContext } from "@api/mcp/types";
import { expandScopes } from "@api/utils/scopes";
import type { SlackAdapter } from "@chat-adapter/slack";
import {
  type BotPlatform,
  bot,
  formatNotificationContextForPrompt,
  formatProcessedUploadSummary,
  getPlatformInstructions,
  isSupportedInboxUploadMediaType,
  processInboxUpload,
} from "@midday/bot";
import { db } from "@midday/db/client";
import {
  PlatformIdentityAlreadyLinkedToAnotherTeamError,
  PlatformIdentityAlreadyLinkedToAnotherUserError,
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
  hasTeamAccess,
  updatePlatformIdentityMetadata,
} from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import { toAiMessages } from "chat";

const logger = createLoggerWithContext("bot-runtime");

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
    await thread.subscribe().catch(() => {});
    await handleIncomingMessage(thread, message);
  });

  bot.onSubscribedMessage(async (thread, message) => {
    await handleIncomingMessage(thread, message);
  });

  bot.onNewMessage(/[\s\S]*/u, async (thread, message) => {
    if (thread.adapter.name !== "slack" || !thread.isDM) {
      return;
    }

    await thread.subscribe().catch(() => {});
    await handleIncomingMessage(thread, message);
  });

  bot.onAssistantThreadStarted(async (event) => {
    await updateSlackSuggestedPrompts(event.channelId, event.threadTs);
  });

  bot.onAssistantContextChanged(async (event) => {
    await updateSlackSuggestedPrompts(event.channelId, event.threadTs);
  });
}

async function handleIncomingMessage(thread: any, message: any) {
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

  const recentUploadSummaries = await processIncomingAttachments({
    thread,
    message,
    teamId: connectedConversation.teamId,
    actingUserId: connectedConversation.actingUserId,
    platform,
  });

  const history = await getConversationHistory(thread);

  const mcpCtx: McpContext = {
    db,
    teamId: connectedConversation.teamId,
    userId: user.id,
    userEmail: user.email ?? null,
    scopes: ALL_ASSISTANT_SCOPES,
    apiUrl: process.env.MIDDAY_API_URL!,
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
          connectedConversation.notificationContext as any,
        )}`
      : "");

  const modelMessages = await toAiMessages(history, {
    includeNames: platform === "slack",
  });

  const result = await streamMiddayAssistant({
    mcpCtx,
    systemPrompt,
    modelMessages: modelMessages as unknown as Array<Record<string, unknown>>,
  });

  await thread.post(result.fullStream);

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
  thread: any,
  message: any,
  platform: BotPlatform,
) {
  const threadState = ((await thread.state) ?? {}) as BotThreadState;
  const externalUserId = getMessageAuthorId(message);

  if (canReuseCachedThreadState(threadState, { platform, externalUserId })) {
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

  return null;
}

function consumeResolvedConversation(resolved: ConnectedResolvedConversation) {
  return {
    ...resolved,
    consumed: true as const,
  };
}

async function hydrateResolvedConversationIdentity(params: {
  thread: any;
  message: any;
  platform: BotPlatform;
  resolved: ConnectedResolvedConversation;
}) {
  const { thread, message, platform, resolved } = params;

  if (
    platform !== "slack" &&
    platform !== "telegram" &&
    platform !== "whatsapp"
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
      thread,
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

async function resolveWhatsAppConversation(thread: any, message: any) {
  const phoneNumber = getMessageAuthorId(message);
  if (!phoneNumber) {
    return null;
  }

  const existingIdentity = await getPlatformIdentity(db, {
    provider: "whatsapp",
    externalUserId: phoneNumber,
  });

  if (existingIdentity?.teamId && existingIdentity.userId) {
    if (
      !(await hasCurrentTeamAccess(
        thread,
        existingIdentity.teamId,
        existingIdentity.userId,
      ))
    ) {
      return { connected: false as const };
    }

    await rememberThreadState(thread, {
      teamId: existingIdentity.teamId,
      actingUserId: existingIdentity.userId,
      platform: "whatsapp",
      externalUserId: phoneNumber,
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

  const code = extractConnectionToken("whatsapp", message?.text);

  if (!code) {
    await thread.post(
      "Connect WhatsApp from Midday first, then send the prefilled connection message here.",
    );
    return { connected: false as const };
  }

  const token = await consumePlatformLinkToken(db, {
    provider: "whatsapp",
    code,
  });

  if (!token) {
    await thread.post(
      "That WhatsApp link code is invalid or expired. Open Midday and generate a new one.",
    );
    return { connected: false as const };
  }

  if (!(await hasCurrentTeamAccess(thread, token.teamId, token.userId))) {
    return { connected: false as const };
  }

  try {
    const identity = await createOrUpdatePlatformIdentity(db, {
      provider: "whatsapp",
      teamId: token.teamId,
      userId: token.userId,
      externalUserId: phoneNumber,
      metadata: {
        displayName:
          message?.author?.fullName || message?.author?.userName || undefined,
      },
    });

    const app = await addWhatsAppConnection(db, {
      teamId: token.teamId,
      phoneNumber,
      displayName:
        message?.author?.fullName || message?.author?.userName || undefined,
      createdBy: token.userId,
    });

    if (!app) {
      await thread.post("Connected, but I couldn't finish setup. Try again.");
      return { connected: false as const };
    }

    const team = await getTeamById(db, token.teamId);
    const actingUserId = token.userId;

    await rememberThreadState(thread, {
      teamId: token.teamId,
      actingUserId,
      platform: "whatsapp",
      externalUserId: phoneNumber,
    });

    await thread.post(
      `Connected to ${team?.name ?? "Midday"}. You can now chat with Midday or send receipts and PDFs here.`,
    );

    return consumeResolvedConversation({
      connected: true as const,
      teamId: token.teamId,
      actingUserId,
      identityId: identity.id,
    });
  } catch (error) {
    if (error instanceof WhatsAppAlreadyConnectedToAnotherTeamError) {
      await thread.post(
        "This WhatsApp number is already connected to another Midday workspace.",
      );
      return { connected: false as const };
    }

    if (error instanceof PlatformIdentityAlreadyLinkedToAnotherUserError) {
      await thread.post(
        "This WhatsApp number is already linked to another Midday user.",
      );
      return { connected: false as const };
    }

    if (error instanceof PlatformIdentityAlreadyLinkedToAnotherTeamError) {
      await thread.post(
        "This WhatsApp number is already linked to another Midday workspace.",
      );
      return { connected: false as const };
    }

    throw error;
  }
}

async function resolveTelegramConversation(thread: any, message: any) {
  const telegramUserId = getMessageAuthorId(message);
  if (!telegramUserId) {
    return null;
  }

  const existingIdentity = await getPlatformIdentity(db, {
    provider: "telegram",
    externalUserId: telegramUserId,
  });

  if (existingIdentity?.teamId && existingIdentity.userId) {
    if (
      !(await hasCurrentTeamAccess(
        thread,
        existingIdentity.teamId,
        existingIdentity.userId,
      ))
    ) {
      return { connected: false as const };
    }

    await rememberThreadState(thread, {
      teamId: existingIdentity.teamId,
      actingUserId: existingIdentity.userId,
      platform: "telegram",
      externalUserId: telegramUserId,
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

  const code = extractConnectionToken("telegram", message?.text);

  if (!code) {
    await thread.post(
      "Open Telegram from Midday to connect this chat, then come back here.",
    );
    return { connected: false as const };
  }

  const token = await consumePlatformLinkToken(db, {
    provider: "telegram",
    code,
  });

  if (!token) {
    await thread.post(
      "That Telegram link code is invalid or expired. Open Midday and generate a new one.",
    );
    return { connected: false as const };
  }

  if (!(await hasCurrentTeamAccess(thread, token.teamId, token.userId))) {
    return { connected: false as const };
  }

  try {
    const identity = await createOrUpdatePlatformIdentity(db, {
      provider: "telegram",
      teamId: token.teamId,
      userId: token.userId,
      externalUserId: telegramUserId,
      externalChannelId: String(thread.channelId),
      metadata: {
        username: message?.author?.userName || undefined,
        displayName:
          message?.author?.fullName || message?.author?.userName || undefined,
      },
    });

    const app = await addTelegramConnection(db, {
      teamId: token.teamId,
      userId: telegramUserId,
      chatId: String(thread.channelId),
      username: message?.author?.userName || undefined,
      displayName:
        message?.author?.fullName || message?.author?.userName || undefined,
      createdBy: token.userId,
    });

    if (!app) {
      await thread.post("Connected, but I couldn't finish setup. Try again.");
      return { connected: false as const };
    }

    const team = await getTeamById(db, token.teamId);
    const actingUserId = token.userId;

    await rememberThreadState(thread, {
      teamId: token.teamId,
      actingUserId,
      platform: "telegram",
      externalUserId: telegramUserId,
    });

    await thread.post(
      `Connected to ${team?.name ?? "Midday"}. You can now send receipts or ask Midday questions here.`,
    );

    return consumeResolvedConversation({
      connected: true as const,
      teamId: token.teamId,
      actingUserId,
      identityId: identity.id,
    });
  } catch (error) {
    if (error instanceof TelegramAlreadyConnectedToAnotherTeamError) {
      await thread.post(
        "This Telegram account is already connected to another Midday workspace.",
      );
      return { connected: false as const };
    }

    if (error instanceof PlatformIdentityAlreadyLinkedToAnotherUserError) {
      await thread.post(
        "This Telegram account is already linked to another Midday user.",
      );
      return { connected: false as const };
    }

    if (error instanceof PlatformIdentityAlreadyLinkedToAnotherTeamError) {
      await thread.post(
        "This Telegram account is already linked to another Midday workspace.",
      );
      return { connected: false as const };
    }

    throw error;
  }
}

async function resolveSlackConversation(thread: any, message: any) {
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

  if (thread.isDM && existingIdentity?.teamId && existingIdentity.userId) {
    if (
      !(await hasCurrentTeamAccess(
        thread,
        existingIdentity.teamId,
        existingIdentity.userId,
      ))
    ) {
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

  const code = extractConnectionToken("slack", message?.text);

  if (!existingIdentity && code) {
    const token = await consumePlatformLinkToken(db, {
      provider: "slack",
      code,
    });

    if (!token) {
      await thread.post(
        "That Slack link code is invalid or expired. Open Midday and generate a new one.",
      );
      return { connected: false as const };
    }

    if (app?.teamId && app.teamId !== token.teamId) {
      await thread.post(
        "That Slack link code belongs to another Midday workspace. Generate a new code for this workspace.",
      );
      return { connected: false as const };
    }

    if (!(await hasCurrentTeamAccess(thread, token.teamId, token.userId))) {
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
            message?.author?.fullName || message?.author?.userName || undefined,
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

      await thread.post(
        `Linked to ${team?.name ?? "Midday"}. Your future Slack messages will run as your Midday user.`,
      );

      return consumeResolvedConversation({
        connected: true as const,
        teamId: token.teamId,
        actingUserId: token.userId,
        identityId: identity.id,
      });
    } catch (error) {
      if (error instanceof PlatformIdentityAlreadyLinkedToAnotherUserError) {
        await thread.post(
          "This Slack user is already linked to another Midday user.",
        );
        return { connected: false as const };
      }

      if (error instanceof PlatformIdentityAlreadyLinkedToAnotherTeamError) {
        await thread.post(
          "This Slack user is already linked to another Midday workspace.",
        );
        return { connected: false as const };
      }

      throw error;
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

  if (
    !(await hasCurrentTeamAccess(
      thread,
      resolvedTeamId,
      existingIdentity.userId,
    ))
  ) {
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
  thread: any;
  message: any;
  teamId: string;
  actingUserId: string;
  platform: BotPlatform;
}) {
  const { thread, message, teamId, actingUserId, platform } = params;
  const summaries: string[] = [];

  for (const [index, attachment] of (message?.attachments || []).entries()) {
    if (!isSupportedAttachment(attachment)) {
      continue;
    }

    try {
      const data =
        attachment?.data ??
        (typeof attachment?.fetchData === "function"
          ? await attachment.fetchData()
          : null);

      if (!data) {
        continue;
      }

      const result = await processInboxUpload({
        db,
        teamId,
        userId: actingUserId,
        fileData: new Uint8Array(data),
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
    } catch (error) {
      logger.warn("Failed to process bot attachment", {
        platform,
        error: error instanceof Error ? error.message : String(error),
        filename: attachment?.name,
      });
    }
  }

  return summaries;
}

async function getConversationHistory(thread: any) {
  const cached = [...(thread.recentMessages || [])];

  try {
    const result = await thread.adapter.fetchMessages(thread.id, { limit: 20 });
    const combined = [...(result?.messages || []), ...cached];
    return dedupeMessages(combined);
  } catch {
    return dedupeMessages(cached);
  }
}

function dedupeMessages(messages: any[]) {
  const seen = new Set<string>();

  return messages.filter((message) => {
    const id = String(message?.id || "");

    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

function isSupportedAttachment(attachment: any) {
  const mimeType = attachment?.mimeType as string | undefined;

  if (!mimeType) {
    return false;
  }

  return (
    (attachment?.type === "image" || attachment?.type === "file") &&
    isSupportedInboxUploadMediaType(mimeType)
  );
}

async function rememberThreadState(thread: any, state: BotThreadState) {
  await thread.setState(state);
}

async function forgetThreadState(thread: any) {
  await thread.setState({});
}

async function hasCurrentTeamAccess(
  thread: any,
  teamId: string,
  userId: string,
) {
  const canAccessTeam = await hasTeamAccess(db, teamId, userId);

  if (canAccessTeam) {
    return true;
  }

  await forgetThreadState(thread);
  await thread
    .post(
      "This chat is linked, but that Midday user no longer has access to this workspace. Reconnect it from Midday and try again.",
    )
    .catch(() => {});

  return false;
}

function getSlackTeamId(message: any) {
  const raw = message?.raw as
    | {
        team?: string;
        team_id?: string;
        teamId?: string;
      }
    | undefined;

  return raw?.team || raw?.team_id || raw?.teamId;
}

function normalizePlatform(platformName: string): BotPlatform | null {
  if (
    platformName === "dashboard" ||
    platformName === "whatsapp" ||
    platformName === "telegram" ||
    platformName === "slack"
  ) {
    return platformName;
  }

  return null;
}

async function updateSlackSuggestedPrompts(
  channelId: string,
  threadTs: string,
) {
  try {
    const slack = bot.getAdapter("slack") as SlackAdapter;
    await slack.setSuggestedPrompts(channelId, threadTs, [
      { title: "Cash flow", message: "Summarize my cash flow this month" },
      { title: "Inbox review", message: "What needs attention in my inbox?" },
      { title: "Recent invoices", message: "Show my latest unpaid invoices" },
    ]);
  } catch (error) {
    logger.debug("Failed to update Slack suggested prompts", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
