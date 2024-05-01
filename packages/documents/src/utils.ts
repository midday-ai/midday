import { capitalCase } from "change-case";
import type { Attachments, Entries } from "./types";

export function cleanText(text?: string) {
  const value = text?.trim().replace(/\n/g, "");

  if (value) {
    return capitalCase(value);
  }
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
    cleanText(item?.normalizedValue?.text || item?.mentionText)
  );
}

export const allowedMimeTypes = [
  "image/heic",
  "image/png",
  "image/jpeg",
  "application/pdf",
];

export function getAllowedAttachments(attachments?: Attachments) {
  return attachments?.filter((attachment) =>
    allowedMimeTypes.includes(attachment.ContentType)
  );
}

export function getInvoiceMetaData(entities: Entries) {
  return {
    "Invoice id": findValue(entities, "invoice_id"),
    "Invoice date": findValue(entities, "invoice_date"),
    "Due date": findValue(entities, "due_date"),
    "Supplier name": findValue(entities, "supplier_name"),
    "Supplier address": findValue(entities, "supplier_address"),
    "Receiver address": findValue(entities, "receiver_address"),
    "Supplier phone": findValue(entities, "supplier_phone"),
    "Supplier email": findValue(entities, "supplier_email"),
    "Supplier city": findValue(entities, "supplier_city"),
    Items: getLineItems(entities),
    "Net amount": findValue(entities, "net_amount"),
    "Total amount": findValue(entities, "total_amount"),
    Currency: findValue(entities, "currency"),
  };
}

export function getExpenseMetaData(entities: Entries) {
  return {
    "Supplier name": findValue(entities, "supplier_name"),
    "Receipt date": findValue(entities, "receipt_date"),
    "Purchase time": findValue(entities, "purchase_time"),
    "Supplier address": findValue(entities, "supplier_address"),
    "Supplier city": findValue(entities, "supplier_city"),
    "Supplier phone": findValue(entities, "supplier_phone"),
    "Supplier email": findValue(entities, "supplier_email"),
    Items: getLineItems(entities),
    "Net amount": findValue(entities, "net_amount"),
    "Total amount": findValue(entities, "total_amount"),
    Currency: findValue(entities, "currency"),
  };
}
