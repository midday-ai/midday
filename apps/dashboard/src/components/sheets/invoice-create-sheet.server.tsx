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

  // Filter out null values
  const template = templatesData
    ? Object.fromEntries(
        Object.entries(templatesData).filter(([_, value]) => value !== null),
      )
    : {};

  return (
    <InvoiceCreateSheet
      teamId={teamId}
      template={template}
      customers={customersData}
    />
  );
}
