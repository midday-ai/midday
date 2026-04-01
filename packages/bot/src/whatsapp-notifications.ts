import { parseISO } from "date-fns";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

export type WhatsAppMatchNotificationParams = {
  phoneNumber: string;
  inboxId: string;
  transactionId: string;
  inboxName: string;
  transactionName: string;
  amount: number;
  currency: string;
  transactionDate?: string;
};

function getWhatsAppConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      "Missing WhatsApp configuration: WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are required",
    );
  }

  return { phoneNumberId, accessToken };
}

async function sendInteractiveButtons(params: {
  to: string;
  body: string;
  buttons: Array<{ id: string; title: string }>;
}) {
  const { phoneNumberId, accessToken } = getWhatsAppConfig();

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: params.body },
          action: {
            buttons: params.buttons.map((button) => ({
              type: "reply",
              reply: {
                id: button.id,
                title: button.title,
              },
            })),
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API error: ${response.status} - ${error}`);
  }
}

export async function sendWhatsAppTextNotification(params: {
  phoneNumber: string;
  body: string;
}) {
  const { phoneNumberId, accessToken } = getWhatsAppConfig();

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.phoneNumber,
        type: "text",
        text: {
          preview_url: false,
          body: params.body,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API error: ${response.status} - ${error}`);
  }
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(dateString?: string) {
  if (!dateString) {
    return undefined;
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parseISO(dateString));
  } catch {
    return undefined;
  }
}

function formatMatchNotification(params: {
  receiptName: string;
  transactionName: string;
  amount: string;
  currency: string;
  transactionDate?: string;
}) {
  const lines = [
    "Possible match found",
    "",
    `Receipt: ${params.receiptName}`,
    `Transaction: ${params.transactionName}`,
    `Amount: ${params.amount} ${params.currency}`,
  ];

  if (params.transactionDate) {
    lines.push(`Date: ${params.transactionDate}`);
  }

  lines.push("", "Confirm or decline this match below.");

  return lines.join("\n");
}

export async function sendWhatsAppMatchNotification(
  params: WhatsAppMatchNotificationParams,
) {
  const formattedAmount = formatCurrency(params.amount, params.currency);
  const amountValue = formattedAmount.replace(/[^\d.,]/g, "");
  const formattedDate = formatDate(params.transactionDate);

  await sendInteractiveButtons({
    to: params.phoneNumber,
    body: formatMatchNotification({
      receiptName: params.inboxName,
      transactionName: params.transactionName,
      amount: amountValue,
      currency: params.currency,
      transactionDate: formattedDate,
    }),
    buttons: [
      {
        id: `confirm_${params.inboxId}_${params.transactionId}`,
        title: "Confirm Match",
      },
      {
        id: `decline_${params.inboxId}_${params.transactionId}`,
        title: "Decline Match",
      },
    ],
  });
}
