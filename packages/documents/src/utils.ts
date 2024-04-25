import type { Entries } from "./types";

export function findValue(entities: Entries, type: string) {
  const found = entities.find((entry) => entry.type === type);
  return (
    found?.normalizedValue?.text.trim() || found?.mentionText?.trim() || null
  );
}

export function getDomainFromEmail(email: string | null) {
  return email?.split("@").at(1);
}

export function getLineItems(entities: Entries) {
  const items = entities.filter((entry) => entry.type === "line_item");

  return items.map(
    (item) => item?.normalizedValue?.text.trim() || item?.mentionText?.trim()
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
  console.log(entities);
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
