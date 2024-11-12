import { getDefaultSettings } from "@midday/invoice/default";
import {
  getCustomers,
  getInvoiceTemplates,
} from "@midday/supabase/cached-queries";
import { InvoiceCreateSheet } from "./invoice-create-sheet";

export async function InvoiceCreateSheetServer({ teamId }: { teamId: string }) {
  const [{ data: templatesData }, { data: customersData }] = await Promise.all([
    getInvoiceTemplates(),
    getCustomers(),
  ]);

  const defaultSettings = getDefaultSettings();

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
    />
  );
}
