import { getDefaultSettings } from "@midday/invoice/default";
import {
  getCustomers,
  getInvoiceTemplates,
  getLastInvoiceNumber,
} from "@midday/supabase/cached-queries";
import { InvoiceCreateSheet } from "./invoice-create-sheet";

export async function InvoiceCreateSheetServer({ teamId }: { teamId: string }) {
  const [
    { data: templatesData },
    { data: customersData },
    { data: invoiceNumber },
  ] = await Promise.all([
    getInvoiceTemplates(),
    getCustomers(),
    getLastInvoiceNumber(),
  ]);

  const defaultSettings = await getDefaultSettings();

  // Filter out null values
  const template = templatesData
    ? Object.fromEntries(
        Object.entries(templatesData).filter(([_, value]) => value !== null),
      )
    : {};

  return (
    <InvoiceCreateSheet
      teamId={teamId}
      customers={customersData}
      template={template}
      defaultSettings={defaultSettings}
      invoiceNumber={invoiceNumber}
    />
  );
}
