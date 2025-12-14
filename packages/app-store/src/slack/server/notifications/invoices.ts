import { createLoggerWithContext } from "@midday/logger";
import { getAppUrl } from "@midday/utils/envs";
import { createSlackWebClient, ensureBotInChannel } from "../client";

const logger = createLoggerWithContext("slack:invoice-notification");

// Simple app config type (no external dependencies)
type AppConfig = {
  teamId: string;
  config?: {
    access_token?: string;
    channel_id?: string;
    [key: string]: unknown;
  };
};

// Simple payload types
type InvoicePaidPayload = {
  invoiceId: string;
  invoiceNumber: string;
  customerName?: string;
  paidAt?: string;
};

type InvoiceOverduePayload = {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
};

/**
 * Send invoice paid notification to Slack
 */
export async function sendSlackInvoicePaidNotification(
  app: AppConfig,
  payload: InvoicePaidPayload,
): Promise<void> {
  const config = app.config;
  const accessToken = config?.access_token as string | undefined;

  if (!accessToken) {
    logger.debug("Slack access token not found", {
      teamId: app.teamId,
    });
    return;
  }

  const channelId = config?.channel_id as string | undefined;

  if (!channelId) {
    logger.warn("Slack channel ID not found for invoice paid notification", {
      teamId: app.teamId,
      invoiceId: payload.invoiceId,
    });
    return;
  }

  const client = createSlackWebClient({ token: accessToken });

  try {
    await ensureBotInChannel({ client, channelId });

    const invoiceLink = `${getAppUrl()}/invoices?invoiceId=${encodeURIComponent(payload.invoiceId)}&type=details`;

    await client.chat.postMessage({
      channel: channelId,
      text: `Invoice ${payload.invoiceNumber} has been paid`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *Invoice Paid*\n\nInvoice *${payload.invoiceNumber}*${payload.customerName ? ` from ${payload.customerName}` : ""} has been marked as paid.${payload.paidAt ? `\n\nPaid on: ${new Date(payload.paidAt).toLocaleDateString()}` : ""}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View invoice",
                emoji: true,
              },
              url: invoiceLink,
              action_id: "view_invoice_paid",
            },
          ],
        },
      ],
    });

    logger.info("Slack invoice paid notification sent successfully", {
      teamId: app.teamId,
      invoiceId: payload.invoiceId,
      invoiceNumber: payload.invoiceNumber,
    });
  } catch (error) {
    logger.error("Failed to send Slack invoice paid notification", {
      error: error instanceof Error ? error.message : String(error),
      teamId: app.teamId,
      invoiceId: payload.invoiceId,
    });
    throw error;
  }
}

/**
 * Send invoice overdue notification to Slack
 */
export async function sendSlackInvoiceOverdueNotification(
  app: AppConfig,
  payload: InvoiceOverduePayload,
): Promise<void> {
  const config = app.config;
  const accessToken = config?.access_token as string | undefined;

  if (!accessToken) {
    logger.debug("Slack access token not found", {
      teamId: app.teamId,
    });
    return;
  }

  const channelId = config?.channel_id as string | undefined;

  if (!channelId) {
    logger.warn("Slack channel ID not found for invoice overdue notification", {
      teamId: app.teamId,
      invoiceId: payload.invoiceId,
    });
    return;
  }

  const client = createSlackWebClient({ token: accessToken });

  try {
    await ensureBotInChannel({ client, channelId });

    const invoiceLink = `${getAppUrl()}/invoices?invoiceId=${encodeURIComponent(payload.invoiceId)}&type=details`;

    await client.chat.postMessage({
      channel: channelId,
      text: `Invoice ${payload.invoiceNumber} is overdue`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `⚠️ *Invoice Overdue*\n\nInvoice *${payload.invoiceNumber}* from *${payload.customerName}* is overdue. Please follow up with the customer.`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View invoice",
                emoji: true,
              },
              url: invoiceLink,
              action_id: "view_invoice_overdue",
            },
          ],
        },
      ],
    });

    logger.info("Slack invoice overdue notification sent successfully", {
      teamId: app.teamId,
      invoiceId: payload.invoiceId,
      invoiceNumber: payload.invoiceNumber,
    });
  } catch (error) {
    logger.error("Failed to send Slack invoice overdue notification", {
      error: error instanceof Error ? error.message : String(error),
      teamId: app.teamId,
      invoiceId: payload.invoiceId,
    });
    throw error;
  }
}
