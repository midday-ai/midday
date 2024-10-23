import {
  getCustomers,
  getInvoiceNumber,
  getInvoiceTemplates,
} from "@midday/supabase/cached-queries";
import { FormContext } from "../invoice/form-context";
import { InvoiceCreateSheet } from "./invoice-create-sheet";

export async function InvoiceCreateSheetServer({ teamId }: { teamId: string }) {
  const [{ data: templatesData }, { data: customersData }, invoiceNumber] =
    await Promise.all([
      getInvoiceTemplates(),
      getCustomers(),
      getInvoiceNumber(),
    ]);

  // Filter out null values
  const template = templatesData
    ? Object.fromEntries(
        Object.entries(templatesData).filter(([_, value]) => value !== null),
      )
    : {};

  return (
    <FormContext template={template} invoiceNumber={invoiceNumber}>
      <InvoiceCreateSheet teamId={teamId} customers={customersData} />
    </FormContext>
  );
}
