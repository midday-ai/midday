import type { Attachments, Entries } from "./types";

export function cleanText(text?: string) {
  return text?.trim().replace(/\n/g, "");
}

export function findValue(entities: Entries, type: string) {
  const found = entities.find((entry) => entry.type === type);
  return cleanText(found?.normalizedValue?.text || found?.mentionText);
}

export function getDomainFromEmail(email: string | null) {
  return email?.split("@").at(1);
}

export function getLineItems(entities: Entries) {
  const items = entities.filter((entry) => entry.type === "line_item");

  return items.map((item) =>
    cleanText(item?.normalizedValue?.text || item?.mentionText),
  );
}

export function cleanMetaData(data: any) {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      delete data[key];
    } else if (typeof value === "object" && value !== null) {
      cleanMetaData(value);
    }
  }

  return data;
}

export const allowedMimeTypes = [
  "image/heic",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/octet-stream",
];

export function getAllowedAttachments(attachments?: Attachments) {
  return attachments?.filter((attachment) =>
    allowedMimeTypes.includes(attachment.ContentType),
  );
}

export function getCurrency(entities: Entries) {
  return findValue(entities, "currency") ?? "USD";
}

// TODO: Exclude undefined values
export function getInvoiceMetaData(entities: Entries) {
  const currency = getCurrency(entities);

  return cleanMetaData({
    "Invoice id": findValue(entities, "invoice_id"),
    "Invoice date": findValue(entities, "invoice_date"),
    "Due date": findValue(entities, "due_date"),
    Supplier: findValue(entities, "supplier_name"),
    "Supplier address": findValue(entities, "supplier_address"),
    "Receiver address": findValue(entities, "receiver_address"),
    Phone: findValue(entities, "supplier_phone"),
    Email: findValue(entities, "supplier_email"),
    Products: getLineItems(entities),
    "Net amount": `${findValue(entities, "net_amount")} ${currency}`,
    "Total amount": `${findValue(entities, "total_amount")} ${currency}`,
  });
}

// TODO: Exclude undefined values
export function getExpenseMetaData(entities: Entries) {
  const currency = getCurrency(entities);

  return cleanMetaData({
    Supplier: findValue(entities, "supplier_name"),
    Date: findValue(entities, "receipt_date"),
    Address: findValue(entities, "supplier_address"),
    City: findValue(entities, "supplier_city"),
    Phone: findValue(entities, "supplier_phone"),
    Email: findValue(entities, "supplier_email"),
    Products: getLineItems(entities),
    "Net amount": `${findValue(entities, "net_amount")} ${currency}`,
    "Total amount": `${findValue(entities, "total_amount")} ${currency}`,
  });
}

export function extractDomain(url?: string | null): string | null {
  if (!url) return null;

  try {
    const { hostname } = new URL(
      url.startsWith("http") ? url : `http://${url}`,
    );
    const parts = hostname.split(".");
    return parts.slice(-2).join(".");
  } catch (error) {
    console.error("Invalid URL:", url);
    return null;
  }
}
