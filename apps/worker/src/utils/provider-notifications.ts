import { sendMatchNotification } from "@midday/app-store/whatsapp/server";
import type { Database } from "@midday/db/client";
import { getWhatsAppConnections } from "@midday/db/queries";
import { getAppByAppId, getApps } from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";

const logger = createLoggerWithContext("provider-notifications");

// Notification types that can be sent to providers
export type ProviderNotificationType =
  | "transaction"
  | "match"
  | "invoice_paid"
  | "invoice_overdue";

// Payload types for each notification
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

type ProviderPayload = {
  transaction: TransactionPayload;
  match: MatchPayload;
  invoice_paid: InvoicePaidPayload;
  invoice_overdue: InvoiceOverduePayload;
};

// App config from database
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

// Options for match notifications (need channel info from inbox metadata)
export type SendToProvidersOptions = {
  inboxMeta?: {
    source?: string;
    sourceMetadata?: {
      channelId?: string;
      threadTs?: string;
      messageTs?: string;
      phoneNumber?: string;
    };
  };
};

/**
 * Setting ID mapping for each notification type
 */
const SETTING_MAP: Record<ProviderNotificationType, string> = {
  transaction: "transactions",
  match: "matches",
  invoice_paid: "invoices",
  invoice_overdue: "invoices",
};

/**
 * Check if a notification type is enabled for an app
 */
function isSettingEnabled(
  app: AppConfig,
  type: ProviderNotificationType,
): boolean {
  const settings = app.settings || [];
  const settingId = SETTING_MAP[type];
  const setting = settings.find((s) => s.id === settingId);
  // Default to enabled if setting not found (backward compatibility)
  return setting?.value !== false;
}

/**
 * Send notifications to all configured providers for a team
 */
export async function sendToProviders<T extends ProviderNotificationType>(
  db: Database,
  teamId: string,
  type: T,
  payload: ProviderPayload[T],
  options?: SendToProvidersOptions,
): Promise<void> {
  try {
    const apps = await getApps(db, teamId);

    if (apps.length === 0) {
      logger.debug("No apps installed for team", { teamId });
      return;
    }

    // Process each app
    for (const app of apps) {
      const appConfig = await getAppConfig(db, app.app_id, teamId);
      if (!appConfig) continue;

      if (!isSettingEnabled(appConfig, type)) {
        logger.debug("Notification type disabled for app", {
          appId: app.app_id,
          type,
          teamId,
        });
        continue;
      }

      try {
        // Simple switch - add new providers here
        switch (app.app_id) {
          case "whatsapp":
            await sendWhatsAppNotification(
              db,
              appConfig,
              type,
              payload,
              options,
            );
            break;
          // Future providers:
          // case "expo-push":
          //   await sendPushNotification(appConfig, type, payload);
          //   break;
        }
      } catch (error) {
        logger.warn("Failed to send provider notification", {
          appId: app.app_id,
          type,
          teamId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  } catch (error) {
    logger.error("Failed to process provider notifications", {
      type,
      teamId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get app config from database
 */
async function getAppConfig(
  db: Database,
  appId: string,
  teamId: string,
): Promise<AppConfig | null> {
  const app = await getAppByAppId(db, { appId, teamId });
  if (!app) return null;

  return {
    id: app.id,
    appId: app.appId,
    teamId: app.teamId ?? teamId,
    config: app.config as AppConfig["config"],
    settings: app.settings as AppConfig["settings"],
  };
}

/**
 * Send notification to WhatsApp
 */
async function sendWhatsAppNotification<T extends ProviderNotificationType>(
  db: Database,
  app: AppConfig,
  type: T,
  payload: ProviderPayload[T],
  options?: SendToProvidersOptions,
): Promise<void> {
  // Only send match notifications for now
  if (type !== "match") {
    logger.debug("WhatsApp notification type not supported", {
      type,
      teamId: app.teamId,
    });
    return;
  }

  const matchPayload = payload as MatchPayload;

  // Get WhatsApp connections for this team
  const connections = await getWhatsAppConnections(db, app.teamId);

  if (connections.length === 0) {
    logger.debug("No WhatsApp connections found for team", {
      teamId: app.teamId,
    });
    return;
  }

  // Get phone number from inbox metadata if available (source was WhatsApp)
  const sourcePhoneNumber = options?.inboxMeta?.sourceMetadata?.phoneNumber;

  // Find the connection that matches the source, or use the first one
  const connection = sourcePhoneNumber
    ? connections.find((c) => c.phoneNumber === sourcePhoneNumber) ||
      connections[0]
    : connections[0];

  if (!connection) {
    logger.debug("No matching WhatsApp connection found", {
      teamId: app.teamId,
      sourcePhoneNumber,
    });
    return;
  }

  try {
    // Only send for suggestions (not auto-matched)
    if (matchPayload.matchType === "auto_matched") {
      logger.debug("Skipping WhatsApp notification for auto-matched", {
        teamId: app.teamId,
        inboxId: matchPayload.inboxId,
      });
      return;
    }

    await sendMatchNotification({
      phoneNumber: connection.phoneNumber,
      inboxId: matchPayload.inboxId,
      transactionId: matchPayload.transactionId,
      inboxName: matchPayload.documentName,
      transactionName: matchPayload.transactionName,
      amount: matchPayload.documentAmount,
      currency: matchPayload.documentCurrency,
      confidence: matchPayload.confidenceScore,
      transactionDate: matchPayload.transactionDate,
    });

    logger.info("WhatsApp match notification sent", {
      teamId: app.teamId,
      phoneNumber: connection.phoneNumber,
      inboxId: matchPayload.inboxId,
      transactionId: matchPayload.transactionId,
    });
  } catch (error) {
    logger.warn("Failed to send WhatsApp notification", {
      teamId: app.teamId,
      phoneNumber: connection.phoneNumber,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
