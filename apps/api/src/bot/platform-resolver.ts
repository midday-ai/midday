import type { ConnectedResolvedConversation } from "@api/bot/conversation-identity";
import { getPlatformIdentityNotificationContext } from "@api/bot/conversation-identity";
import {
  extractConnectionToken,
  getMessageAuthorId,
  isExplicitConnectionAttempt,
} from "@api/bot/linking";
import {
  consumeResolvedConversation,
  hasCurrentTeamAccess,
  notifyTeamAccessRevoked,
  rememberThreadState,
} from "@api/bot/thread-helpers";
import type { BotThreadState } from "@api/bot/thread-state";
import { db } from "@midday/db/client";
import {
  PlatformIdentityAlreadyLinkedToAnotherTeamError,
  PlatformIdentityAlreadyLinkedToAnotherUserError,
} from "@midday/db/errors";
import type { PlatformProvider } from "@midday/db/queries";
import {
  consumePlatformLinkToken,
  createOrUpdatePlatformIdentity,
  getPlatformIdentity,
  getTeamById,
} from "@midday/db/queries";
import type { Message, Thread } from "chat";

type LinkablePlatform = "whatsapp" | "telegram" | "sendblue";

export class PlatformSetupFailedError extends Error {
  constructor() {
    super("Connected, but I couldn't finish setup. Try again.");
  }
}

type ResolvedConversation =
  | (ConnectedResolvedConversation & { consumed?: boolean })
  | { connected: false };

type PlatformResolverConfig = {
  provider: LinkablePlatform;
  displayName: string;
  buildIdentityFields: (params: {
    externalUserId: string;
    message: Message;
    thread: Thread<BotThreadState>;
  }) => {
    externalChannelId?: string;
    metadata: Record<string, unknown>;
  };
  afterConnect?: (params: {
    token: { teamId: string; userId: string };
    externalUserId: string;
    message: Message;
    thread: Thread<BotThreadState>;
  }) => Promise<void>;
  platformErrors?: Array<{
    errorClass: new (...args: any[]) => Error;
    message: string;
  }>;
  welcomeMessage: (teamName: string) => string;
  invalidCodeMessage: string;
  promptConnectMessage: string;
};

export async function resolvePlatformLinkCode(
  thread: Thread<BotThreadState>,
  message: Message,
  config: PlatformResolverConfig,
): Promise<ResolvedConversation | null> {
  const externalUserId = getMessageAuthorId(message);
  if (!externalUserId) {
    return null;
  }

  const code = extractConnectionToken(config.provider, message?.text);

  if (code) {
    const token = await consumePlatformLinkToken(db, {
      provider: config.provider,
      code,
    });

    if (token) {
      if (!(await hasCurrentTeamAccess(token.teamId, token.userId))) {
        await notifyTeamAccessRevoked(thread);
        return { connected: false };
      }

      try {
        if (config.afterConnect) {
          await config.afterConnect({
            token,
            externalUserId,
            message,
            thread,
          });
        }

        const identityFields = config.buildIdentityFields({
          externalUserId,
          message,
          thread,
        });

        const identity = await createOrUpdatePlatformIdentity(db, {
          provider: config.provider,
          teamId: token.teamId,
          userId: token.userId,
          externalUserId,
          externalChannelId: identityFields.externalChannelId,
          metadata: identityFields.metadata,
        });

        const team = await getTeamById(db, token.teamId);

        await rememberThreadState(thread, {
          teamId: token.teamId,
          actingUserId: token.userId,
          platform: config.provider,
          externalUserId,
        });

        await thread.post(config.welcomeMessage(team?.name ?? "Midday"));

        return consumeResolvedConversation({
          connected: true,
          teamId: token.teamId,
          actingUserId: token.userId,
          identityId: identity.id,
        });
      } catch (error) {
        if (error instanceof PlatformSetupFailedError) {
          await thread.post(error.message);
          return { connected: false };
        }

        const platformMsg = mapPlatformLinkError(
          error,
          config.displayName,
          config.platformErrors,
        );
        if (platformMsg) {
          await thread.post(platformMsg);
          return { connected: false };
        }
        throw error;
      }
    }
  }

  if (isExplicitConnectionAttempt(config.provider, message?.text)) {
    await thread.post(config.invalidCodeMessage);
    return { connected: false };
  }

  const existing = await resolveFromExistingIdentity(
    thread,
    config.provider,
    externalUserId,
  );
  if (existing) {
    return existing;
  }

  await thread.post(config.promptConnectMessage);
  return { connected: false };
}

async function resolveFromExistingIdentity(
  thread: Thread<BotThreadState>,
  provider: PlatformProvider,
  externalUserId: string,
  lookupOpts?: { externalTeamId?: string },
): Promise<ResolvedConversation | null> {
  const existingIdentity = await getPlatformIdentity(db, {
    provider,
    externalUserId,
    externalTeamId: lookupOpts?.externalTeamId,
  });

  if (!existingIdentity?.teamId || !existingIdentity.userId) {
    return null;
  }

  if (
    !(await hasCurrentTeamAccess(
      existingIdentity.teamId,
      existingIdentity.userId,
    ))
  ) {
    await notifyTeamAccessRevoked(thread);
    return { connected: false };
  }

  await rememberThreadState(thread, {
    teamId: existingIdentity.teamId,
    actingUserId: existingIdentity.userId,
    platform: provider,
    externalUserId,
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

export function mapPlatformLinkError(
  error: unknown,
  displayName: string,
  platformErrors?: PlatformResolverConfig["platformErrors"],
): string | null {
  if (platformErrors) {
    for (const entry of platformErrors) {
      if (error instanceof entry.errorClass) {
        return entry.message;
      }
    }
  }

  if (error instanceof PlatformIdentityAlreadyLinkedToAnotherUserError) {
    return `This ${displayName} is already linked to another Midday user.`;
  }

  if (error instanceof PlatformIdentityAlreadyLinkedToAnotherTeamError) {
    return `This ${displayName} is already linked to another Midday workspace.`;
  }

  return null;
}

export function buildWelcomeMessage(
  teamName: string,
  platform: LinkablePlatform | "slack",
): string {
  const config = WELCOME_CONFIGS[platform];
  return (
    `Connected to ${teamName}. ${config.capabilities}\n\n` +
    `You'll receive notifications for ${config.notifications} (all on by default). ` +
    `To manage these, go to Apps \u2192 ${config.settingsLabel} \u2192 Settings in Midday.\n\n` +
    config.callToAction
  );
}

const WELCOME_CONFIGS: Record<
  LinkablePlatform | "slack",
  {
    capabilities: string;
    notifications: string;
    settingsLabel: string;
    callToAction: string;
  }
> = {
  whatsapp: {
    capabilities:
      "You can chat with Midday, send receipts and PDFs, or create invoices \u2014 all from WhatsApp.",
    notifications: "new transactions, invoices, and receipt matches",
    settingsLabel: "WhatsApp",
    callToAction:
      "Try sending a receipt or asking \u201cWhat did I spend this week?\u201d",
  },
  telegram: {
    capabilities:
      "You can chat with Midday, send receipts and PDFs, or create invoices \u2014 all from Telegram.",
    notifications: "new transactions, invoices, and receipt matches",
    settingsLabel: "Telegram",
    callToAction:
      "Try sending a receipt or asking \u201cWhat did I spend this week?\u201d",
  },
  sendblue: {
    capabilities:
      "You can chat with Midday, send receipts and PDFs, or create invoices \u2014 all from iMessage.",
    notifications: "new transactions, invoices, and receipt matches",
    settingsLabel: "iMessage",
    callToAction:
      "Try sending a receipt or asking \u201cWhat did I spend this week?\u201d",
  },
  slack: {
    capabilities:
      "You can ask Midday questions, upload receipts, and track invoices right from Slack.",
    notifications: "new transactions, invoices, and match suggestions",
    settingsLabel: "Slack",
    callToAction: "Try asking \u201cWhat's my cash flow this month?\u201d",
  },
};
