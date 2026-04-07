import {
  createSlackWebClient,
  sendSlackMatchNotification,
} from "@midday/app-store/slack/server";
import type { Database } from "@midday/db/client";
import {
  getAppByAppId,
  getPlatformIdentity,
  getPlatformIdentityById,
  listDueProviderNotificationBatches,
  listPlatformIdentitiesForTeam,
  markProviderNotificationBatchSent,
  queueProviderNotificationBatch,
  shouldSendNotification,
  updatePlatformIdentityMetadata,
} from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import { sendSendblueTextNotification } from "./sendblue-notifications";
import { sendTelegramTextNotification } from "./telegram-notifications";
import {
  buildBatchTemplateComponents,
  buildMatchTemplateComponents,
  sendWhatsAppMatchNotification,
  sendWhatsAppTemplateNotification,
  sendWhatsAppTextNotification,
} from "./whatsapp-notifications";

const logger = createLoggerWithContext("activity-notifications");

export type ProviderNotificationType =
  | "transaction"
  | "match"
  | "invoice_paid"
  | "invoice_overdue"
  | "recurring_invoice_upcoming";

export type TransactionPayload = {
  transactions: Array<{
    id: string;
    name: string;
    amount: number;
    currency: string;
    date: string;
  }>;
};

export type MatchPayload = {
  inboxId: string;
  transactionId: string;
  documentName: string;
  documentAmount: number;
  documentCurrency: string;
  documentDate?: string;
  transactionName: string;
  transactionAmount: number;
  transactionCurrency: string;
  transactionDate?: string;
  confidenceScore: number;
  matchType: "auto_matched" | "high_confidence" | "suggested";
};

export type InvoicePaidPayload = {
  invoiceId: string;
  invoiceNumber: string;
  customerName?: string;
  paidAt?: string;
};

export type InvoiceOverduePayload = {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
};

export type RecurringInvoiceUpcomingPayload = {
  invoices: Array<{
    recurringId: string;
    customerName?: string;
    amount?: number;
    currency?: string;
    scheduledAt: string;
    frequency?: string | null;
  }>;
  count: number;
};

type ProviderPayload = {
  transaction: TransactionPayload;
  match: MatchPayload;
  invoice_paid: InvoicePaidPayload;
  invoice_overdue: InvoiceOverduePayload;
  recurring_invoice_upcoming: RecurringInvoiceUpcomingPayload;
};

type AppConfig = {
  id: string;
  appId: string;
  teamId: string;
  config?: {
    access_token?: string;
    channel_id?: string;
    [key: string]: unknown;
  };
  settings?: Array<{ id: string; value: boolean | string | number }>;
};

type PlatformIdentityMetadata = {
  lastSeenAt?: string;
  lastNotificationContext?: NotificationContext | null;
  lastNotificationSentAt?: string;
  [key: string]: unknown;
};

export type NotificationContext = {
  eventType: ProviderNotificationType;
  teamId: string;
  userId: string;
  entityType: string;
  entityIds: string[];
  summary: string;
  sourcePlatform: "slack" | "telegram" | "whatsapp" | "sendblue";
  sourceMessageId?: string;
  suggestedPrompts: string[];
  sentAt: string;
};

export type SendToProvidersOptions = {
  inboxMeta?: {
    source?: string;
    sourceMetadata?: {
      channelId?: string;
      threadTs?: string;
      messageTs?: string;
      phoneNumber?: string;
      externalUserId?: string;
    };
  };
};

const BATCH_WINDOWS_MS: Record<
  Exclude<ProviderNotificationType, "match">,
  number
> = {
  transaction: 10 * 60 * 1000,
  invoice_paid: 10 * 60 * 1000,
  invoice_overdue: 30 * 60 * 1000,
  recurring_invoice_upcoming: 60 * 60 * 1000,
};

const USER_NOTIFICATION_MAP: Record<
  Exclude<ProviderNotificationType, "match">,
  string
> = {
  transaction: "transactions_created",
  invoice_paid: "invoice_paid",
  invoice_overdue: "invoice_overdue",
  recurring_invoice_upcoming: "recurring_invoice_upcoming",
};

const APP_SETTING_MAP: Record<ProviderNotificationType, string> = {
  transaction: "transactions",
  match: "matches",
  invoice_paid: "invoices",
  invoice_overdue: "invoices",
  recurring_invoice_upcoming: "invoices",
};

export async function sendToProviders<T extends ProviderNotificationType>(
  db: Database,
  teamId: string,
  type: T,
  payload: ProviderPayload[T],
  options?: SendToProvidersOptions,
): Promise<void> {
  if (type === "match") {
    await sendImmediateMatchNotifications(
      db,
      teamId,
      payload as MatchPayload,
      options,
    );
    return;
  }

  await queueTeamWideNotification(
    db,
    teamId,
    type as Exclude<ProviderNotificationType, "match">,
    payload as
      | TransactionPayload
      | InvoicePaidPayload
      | InvoiceOverduePayload
      | RecurringInvoiceUpcomingPayload,
  );
}

export async function flushDueActivityNotificationBatches(db: Database) {
  const batches = await listDueProviderNotificationBatches(db, 100);

  for (const batch of batches) {
    const identity = await getPlatformIdentityById(
      db,
      batch.platformIdentityId,
    );

    if (!identity) {
      await markProviderNotificationBatchSent(db, { id: batch.id });
      continue;
    }

    const app = await getAppConfig(db, batch.provider, batch.teamId);
    if (
      !app ||
      !isSettingEnabled(app, batch.eventFamily as ProviderNotificationType)
    ) {
      await markProviderNotificationBatchSent(db, { id: batch.id });
      continue;
    }

    const userNotificationType =
      USER_NOTIFICATION_MAP[
        batch.eventFamily as Exclude<ProviderNotificationType, "match">
      ];

    const userEnabled = await shouldSendNotification(
      db,
      batch.userId,
      batch.teamId,
      userNotificationType,
      "in_app",
    );

    if (!userEnabled) {
      await markProviderNotificationBatchSent(db, { id: batch.id });
      continue;
    }

    const summary = buildBatchSummary(
      batch.eventFamily as Exclude<ProviderNotificationType, "match">,
      (batch.payload as { entries?: Array<Record<string, unknown>> } | null)
        ?.entries ?? [],
      {
        teamId: batch.teamId,
        userId: batch.userId,
        provider: batch.provider,
      },
    );

    if (!summary) {
      await markProviderNotificationBatchSent(db, { id: batch.id });
      continue;
    }

    const entries =
      (batch.payload as { entries?: Array<Record<string, unknown>> } | null)
        ?.entries ?? [];

    const sent = await sendSummaryToIdentity(
      app,
      identity,
      summary.text,
      batch.eventFamily,
      entries,
    );

    if (!sent) {
      await markProviderNotificationBatchSent(db, { id: batch.id });
      continue;
    }

    await updatePlatformIdentityMetadata(db, {
      id: identity.id,
      metadata: {
        lastNotificationContext: summary.context,
        lastNotificationSentAt: summary.context.sentAt,
      },
    });

    await markProviderNotificationBatchSent(db, {
      id: batch.id,
      notificationContext: summary.context,
    });
  }
}

export function formatNotificationContextForPrompt(
  context: NotificationContext | null | undefined,
) {
  if (!context) {
    return "";
  }

  const prompts =
    context.suggestedPrompts.length > 0
      ? ` Suggested follow-ups: ${context.suggestedPrompts.join(", ")}.`
      : "";

  return `The user's latest bot notification context is: ${context.summary}.${prompts}`;
}

async function queueTeamWideNotification(
  db: Database,
  teamId: string,
  type: Exclude<ProviderNotificationType, "match">,
  payload:
    | TransactionPayload
    | InvoicePaidPayload
    | InvoiceOverduePayload
    | RecurringInvoiceUpcomingPayload,
) {
  for (const provider of [
    "slack",
    "telegram",
    "whatsapp",
    "sendblue",
  ] as const) {
    const app = await getAppConfig(db, provider, teamId);

    if (!app || !isSettingEnabled(app, type)) {
      continue;
    }

    const identities = await listPlatformIdentitiesForTeam(db, {
      provider,
      teamId,
    });

    for (const identity of identities) {
      const enabled = await shouldSendNotification(
        db,
        identity.userId,
        teamId,
        USER_NOTIFICATION_MAP[type],
        "in_app",
      );

      if (!enabled) {
        continue;
      }

      const windowEndsAt = new Date(
        Date.now() + BATCH_WINDOWS_MS[type],
      ).toISOString();

      await queueProviderNotificationBatch(db, {
        batchKey: `${identity.id}:${type}`,
        platformIdentityId: identity.id,
        teamId,
        userId: identity.userId,
        provider,
        eventFamily: type,
        entry: createBatchEntry(type, payload),
        notificationContext: {
          eventType: type,
          teamId,
          userId: identity.userId,
        },
        windowEndsAt,
      });
    }
  }
}

async function sendImmediateMatchNotifications(
  db: Database,
  teamId: string,
  payload: MatchPayload,
  options?: SendToProvidersOptions,
) {
  const source = options?.inboxMeta?.source;

  if (source === "slack") {
    const slackApp = await getAppConfig(db, "slack", teamId);
    const accessToken = slackApp?.config?.access_token;
    const channelId = options?.inboxMeta?.sourceMetadata?.channelId;

    if (accessToken && channelId) {
      await sendSlackMatchNotification({
        teamId,
        inboxId: payload.inboxId,
        transactionId: payload.transactionId,
        documentName: payload.documentName,
        documentAmount: payload.documentAmount,
        documentCurrency: payload.documentCurrency,
        documentDate: payload.documentDate,
        transactionName: payload.transactionName,
        transactionAmount: payload.transactionAmount,
        transactionCurrency: payload.transactionCurrency,
        transactionDate: payload.transactionDate,
        matchType: payload.matchType,
        slackChannelId: channelId,
        slackThreadTs:
          options?.inboxMeta?.sourceMetadata?.threadTs ||
          options?.inboxMeta?.sourceMetadata?.messageTs,
      });
      return;
    }
  }

  if (source === "whatsapp") {
    const phoneNumber = options?.inboxMeta?.sourceMetadata?.phoneNumber;

    if (!phoneNumber || payload.matchType === "auto_matched") {
      return;
    }

    const identity = await getPlatformIdentity(db, {
      provider: "whatsapp",
      externalUserId: phoneNumber,
    });

    const metadata =
      (identity?.metadata as PlatformIdentityMetadata | null) ?? {};

    if (isWithinWhatsAppSessionWindow(metadata.lastSeenAt)) {
      await sendWhatsAppMatchNotification({
        phoneNumber,
        inboxId: payload.inboxId,
        transactionId: payload.transactionId,
        inboxName: payload.documentName,
        transactionName: payload.transactionName,
        amount: payload.transactionAmount,
        currency: payload.transactionCurrency,
        transactionDate: payload.transactionDate,
      });
    } else {
      const { templateName, components } = buildMatchTemplateComponents(
        payload.documentName,
        payload.transactionName,
      );

      await sendWhatsAppTemplateNotification({
        phoneNumber,
        templateName,
        components,
      });
    }

    if (identity) {
      await updatePlatformIdentityMetadata(db, {
        id: identity.id,
        metadata: {
          lastNotificationContext: buildMatchContext(
            identity.userId,
            teamId,
            "whatsapp",
            payload,
          ),
          lastNotificationSentAt: new Date().toISOString(),
        },
      });
    }

    return;
  }

  if (source === "telegram") {
    const chatId = options?.inboxMeta?.sourceMetadata?.channelId;
    const externalUserId = options?.inboxMeta?.sourceMetadata?.externalUserId;

    if (!chatId) {
      return;
    }

    if (externalUserId) {
      await sendPlainTextMatchNotification({
        db,
        provider: "telegram",
        sendFn: (text) => sendTelegramTextNotification({ chatId, text }),
        externalUserId,
        teamId,
        payload,
      });
    } else {
      await sendTelegramTextNotification({
        chatId,
        text: buildPlainMatchText(payload),
      });
    }
  }

  if (source === "sendblue") {
    const phoneNumber = options?.inboxMeta?.sourceMetadata?.phoneNumber;
    const externalUserId = options?.inboxMeta?.sourceMetadata?.externalUserId;

    if (!phoneNumber) {
      return;
    }

    await sendPlainTextMatchNotification({
      db,
      provider: "sendblue",
      sendFn: (text) => sendSendblueTextNotification({ phoneNumber, text }),
      externalUserId: externalUserId || phoneNumber,
      teamId,
      payload,
    });
  }
}

async function sendSummaryToIdentity(
  app: AppConfig,
  identity: Awaited<ReturnType<typeof getPlatformIdentityById>>,
  text: string,
  eventFamily?: string,
  entries?: Array<Record<string, unknown>>,
) {
  if (!identity) {
    return false;
  }

  switch (identity.provider) {
    case "slack": {
      const accessToken = app.config?.access_token;
      if (!accessToken) {
        return false;
      }

      const client = createSlackWebClient({ token: accessToken });
      const result = await client.conversations.open({
        users: identity.externalUserId,
      });
      const channelId = result.channel?.id;

      if (!channelId) {
        return false;
      }

      await client.chat.postMessage({
        channel: channelId,
        text,
      });
      return true;
    }
    case "telegram": {
      if (!identity.externalChannelId) {
        return false;
      }

      await sendTelegramTextNotification({
        chatId: identity.externalChannelId,
        text,
      });
      return true;
    }
    case "whatsapp": {
      const metadata =
        (identity.metadata as PlatformIdentityMetadata | null) ?? {};

      if (isWithinWhatsAppSessionWindow(metadata.lastSeenAt)) {
        await sendWhatsAppTextNotification({
          phoneNumber: identity.externalUserId,
          body: text,
        });
        return true;
      }

      if (eventFamily && entries) {
        const templateData = buildBatchTemplateComponents(eventFamily, entries);

        if (templateData) {
          await sendWhatsAppTemplateNotification({
            phoneNumber: identity.externalUserId,
            templateName: templateData.templateName,
            components: templateData.components,
          });
          return true;
        }
      }

      logger.info(
        "Skipping WhatsApp activity notification — outside session window and no template available",
        {
          identityId: identity.id,
          teamId: identity.teamId,
        },
      );
      return false;
    }
    case "sendblue": {
      await sendSendblueTextNotification({
        phoneNumber: identity.externalUserId,
        text,
      });
      return true;
    }
  }
}

export function isWithinWhatsAppSessionWindow(lastSeenAt?: string) {
  if (!lastSeenAt) {
    return false;
  }

  const seenAt = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seenAt)) {
    return false;
  }

  return Date.now() - seenAt <= 24 * 60 * 60 * 1000;
}

export function buildBatchSummary(
  type: Exclude<ProviderNotificationType, "match">,
  entries: Array<Record<string, unknown>>,
  params: {
    teamId: string;
    userId: string;
    provider: "slack" | "telegram" | "whatsapp" | "sendblue";
  },
) {
  const sentAt = new Date().toISOString();

  if (type === "transaction") {
    const transactions = entries.flatMap(
      (entry) =>
        (entry.transactions as
          | Array<{
              id: string;
              name: string;
              amount: number;
              currency: string;
              date: string;
            }>
          | undefined) ?? [],
    );

    if (transactions.length === 0) {
      return null;
    }

    const summary = `${transactions.length} new transaction${transactions.length === 1 ? "" : "s"}. Reply "show me them" and I can help review them.`;

    return {
      text: summary,
      context: {
        eventType: type,
        teamId: params.teamId,
        userId: params.userId,
        entityType: "transaction",
        entityIds: transactions.map((transaction) => transaction.id),
        summary,
        sourcePlatform: params.provider,
        suggestedPrompts: [
          "Show me them",
          "Which ones need receipts?",
          "Summarize the largest ones",
        ],
        sentAt,
      } satisfies NotificationContext,
    };
  }

  if (type === "invoice_paid") {
    const invoices = entries as Array<InvoicePaidPayload>;
    if (invoices.length === 0) {
      return null;
    }

    const invoiceLabels = invoices
      .slice(0, 3)
      .map((invoice) => invoice.invoiceNumber)
      .join(", ");
    const summary = `${invoices.length} invoice${invoices.length === 1 ? "" : "s"} ${invoices.length === 1 ? "was" : "were"} paid${invoiceLabels ? ` (${invoiceLabels})` : ""}. Reply "show me them" to review the details.`;

    return {
      text: summary,
      context: {
        eventType: type,
        teamId: params.teamId,
        userId: params.userId,
        entityType: "invoice",
        entityIds: invoices.map((invoice) => invoice.invoiceId),
        summary,
        sourcePlatform: params.provider,
        suggestedPrompts: [
          "Show me them",
          "What's still unpaid?",
          "Summarize the cash impact",
        ],
        sentAt,
      } satisfies NotificationContext,
    };
  }

  if (type === "invoice_overdue") {
    const invoices = entries as Array<InvoiceOverduePayload>;
    if (invoices.length === 0) {
      return null;
    }

    const summary = `${invoices.length} invoice${invoices.length === 1 ? "" : "s"} ${invoices.length === 1 ? "is" : "are"} overdue. Reply "show me them" and I can help you follow up.`;

    return {
      text: summary,
      context: {
        eventType: type,
        teamId: params.teamId,
        userId: params.userId,
        entityType: "invoice",
        entityIds: invoices.map((invoice) => invoice.invoiceId),
        summary,
        sourcePlatform: params.provider,
        suggestedPrompts: [
          "Show me them",
          "Draft a reminder",
          "Who is most overdue?",
        ],
        sentAt,
      } satisfies NotificationContext,
    };
  }

  const invoices = entries.flatMap(
    (entry) =>
      (entry.invoices as
        | Array<{
            recurringId: string;
            customerName?: string;
            amount?: number;
            currency?: string;
            scheduledAt: string;
            frequency?: string | null;
          }>
        | undefined) ?? [],
  );

  if (invoices.length === 0) {
    return null;
  }

  const summary = `${invoices.length} recurring invoice${invoices.length === 1 ? "" : "s"} ${invoices.length === 1 ? "is" : "are"} coming up soon. Reply "show me them" to review what is scheduled.`;

  return {
    text: summary,
    context: {
      eventType: type,
      teamId: params.teamId,
      userId: params.userId,
      entityType: "recurring_invoice",
      entityIds: invoices.map((invoice) => invoice.recurringId),
      summary,
      sourcePlatform: params.provider,
      suggestedPrompts: [
        "Show me them",
        "Which customers are affected?",
        "What is due soonest?",
      ],
      sentAt,
    } satisfies NotificationContext,
  };
}

function buildMatchContext(
  userId: string,
  teamId: string,
  provider: "telegram" | "whatsapp" | "sendblue",
  payload: MatchPayload,
): NotificationContext {
  const summary =
    payload.matchType === "auto_matched"
      ? `${payload.documentName} was auto-matched to ${payload.transactionName}.`
      : `${payload.documentName} may match ${payload.transactionName}.`;

  return {
    eventType: "match",
    teamId,
    userId,
    entityType: "inbox_match",
    entityIds: [payload.inboxId, payload.transactionId],
    summary,
    sourcePlatform: provider,
    suggestedPrompts: ["Explain the match", "Show me the transaction"],
    sentAt: new Date().toISOString(),
  };
}

async function sendPlainTextMatchNotification(params: {
  db: Database;
  provider: "telegram" | "sendblue";
  sendFn: (text: string) => Promise<void>;
  externalUserId: string;
  teamId: string;
  payload: MatchPayload;
}) {
  const {
    db: database,
    provider,
    sendFn,
    externalUserId,
    teamId,
    payload,
  } = params;

  await sendFn(buildPlainMatchText(payload));

  const identity = await getPlatformIdentity(database, {
    provider,
    externalUserId,
  });

  if (identity) {
    await updatePlatformIdentityMetadata(database, {
      id: identity.id,
      metadata: {
        lastNotificationContext: buildMatchContext(
          identity.userId,
          teamId,
          provider,
          payload,
        ),
        lastNotificationSentAt: new Date().toISOString(),
      },
    });
  }
}

function buildPlainMatchText(payload: MatchPayload) {
  if (payload.matchType === "auto_matched") {
    return `${payload.documentName} was auto-matched to ${payload.transactionName}. Reply here if you want me to explain the match.`;
  }

  return `Possible match found for ${payload.documentName} and ${payload.transactionName}. Reply here if you want help reviewing it.`;
}

function createBatchEntry(
  type: Exclude<ProviderNotificationType, "match">,
  payload:
    | TransactionPayload
    | InvoicePaidPayload
    | InvoiceOverduePayload
    | RecurringInvoiceUpcomingPayload,
) {
  switch (type) {
    case "transaction":
      return payload as TransactionPayload;
    case "invoice_paid":
      return payload as InvoicePaidPayload;
    case "invoice_overdue":
      return payload as InvoiceOverduePayload;
    case "recurring_invoice_upcoming":
      return payload as RecurringInvoiceUpcomingPayload;
  }
}

function isSettingEnabled(
  app: AppConfig,
  type: ProviderNotificationType,
): boolean {
  const settings = app.settings || [];
  const setting = settings.find((item) => item.id === APP_SETTING_MAP[type]);
  return setting?.value !== false;
}

async function getAppConfig(
  db: Database,
  appId: "slack" | "telegram" | "whatsapp" | "sendblue",
  teamId: string,
): Promise<AppConfig | null> {
  const app = await getAppByAppId(db, { appId, teamId });
  if (!app) {
    return null;
  }

  return {
    id: app.id,
    appId: app.appId,
    teamId: app.teamId ?? teamId,
    config: app.config as AppConfig["config"],
    settings: app.settings as AppConfig["settings"],
  };
}
