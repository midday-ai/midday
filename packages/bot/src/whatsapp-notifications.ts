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

export const WHATSAPP_TEMPLATE_NAMES = {
  transaction: "midday_new_transactions",
  invoice_paid: "midday_invoice_paid",
  invoice_overdue: "midday_invoice_overdue",
  recurring_invoice_upcoming: "midday_recurring_upcoming",
  match: "midday_receipt_matched",
} as const;

export type WhatsAppTemplateName =
  (typeof WHATSAPP_TEMPLATE_NAMES)[keyof typeof WHATSAPP_TEMPLATE_NAMES];

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildTemplateBodyParameters(
  texts: string[],
): Array<Record<string, unknown>> {
  if (texts.length === 0) {
    return [];
  }

  return [
    {
      type: "body",
      parameters: texts.map((text) => ({ type: "text", text })),
    },
  ];
}

function buildTemplateUrlButton(
  index: number,
  dynamicSuffix: string,
): Record<string, unknown> {
  return {
    type: "button",
    sub_type: "url",
    index: String(index),
    parameters: [{ type: "text", text: dynamicSuffix }],
  };
}

export function buildBatchTemplateComponents(
  eventFamily: string,
  entries: Array<Record<string, unknown>>,
): {
  templateName: WhatsAppTemplateName;
  components: Array<Record<string, unknown>>;
} | null {
  switch (eventFamily) {
    case "transaction": {
      const count = entries.flatMap(
        (e) => (e.transactions as Array<unknown> | undefined) ?? [],
      ).length;
      if (count === 0) return null;
      return {
        templateName: WHATSAPP_TEMPLATE_NAMES.transaction,
        components: [
          ...buildTemplateBodyParameters([
            pluralize(count, "new transaction", "new transactions"),
          ]),
          buildTemplateUrlButton(0, "/transactions"),
        ],
      };
    }
    case "invoice_paid": {
      const invoices = entries as Array<{ invoiceNumber?: string }>;
      if (invoices.length === 0) return null;
      const labels = invoices
        .slice(0, 3)
        .map((i) => i.invoiceNumber ?? "")
        .filter(Boolean)
        .join(", ");
      return {
        templateName: WHATSAPP_TEMPLATE_NAMES.invoice_paid,
        components: [
          ...buildTemplateBodyParameters([
            pluralize(invoices.length, "invoice has", "invoices have"),
            labels || "-",
          ]),
          buildTemplateUrlButton(0, "/invoices?statuses=paid"),
        ],
      };
    }
    case "invoice_overdue": {
      if (entries.length === 0) return null;
      return {
        templateName: WHATSAPP_TEMPLATE_NAMES.invoice_overdue,
        components: [
          ...buildTemplateBodyParameters([
            pluralize(entries.length, "invoice is", "invoices are"),
          ]),
          buildTemplateUrlButton(0, "/invoices?statuses=overdue"),
        ],
      };
    }
    case "recurring_invoice_upcoming": {
      const invoices = entries.flatMap(
        (e) => (e.invoices as Array<unknown> | undefined) ?? [],
      );
      if (invoices.length === 0) return null;
      return {
        templateName: WHATSAPP_TEMPLATE_NAMES.recurring_invoice_upcoming,
        components: [
          ...buildTemplateBodyParameters([
            pluralize(
              invoices.length,
              "recurring invoice is",
              "recurring invoices are",
            ),
          ]),
          buildTemplateUrlButton(0, "/invoices?recurring=true"),
        ],
      };
    }
    default:
      return null;
  }
}

export function buildMatchTemplateComponents(
  documentName: string,
  transactionName: string,
): {
  templateName: WhatsAppTemplateName;
  components: Array<Record<string, unknown>>;
} {
  return {
    templateName: WHATSAPP_TEMPLATE_NAMES.match,
    components: [
      ...buildTemplateBodyParameters([documentName, transactionName]),
      buildTemplateUrlButton(0, "/inbox"),
    ],
  };
}

export async function sendWhatsAppTemplateNotification(params: {
  phoneNumber: string;
  templateName: string;
  components?: Array<Record<string, unknown>>;
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
        type: "template",
        template: {
          name: params.templateName,
          language: { code: "en" },
          components: params.components,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `WhatsApp template API error: ${response.status} - ${error}`,
    );
  }
}
