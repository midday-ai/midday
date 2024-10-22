import { generateInvoiceNumber } from "@/utils/invoice";
import {
  getCustomers,
  getInvoiceNumberCount,
  getInvoiceTemplates,
} from "@midday/supabase/cached-queries";
import { FormContext } from "../invoice/form-context";
import { InvoiceCreateSheet } from "./invoice-create-sheet";

export async function InvoiceCreateSheetServer({ teamId }: { teamId: string }) {
  const [
    { data: templatesData },
    { data: customersData },
    { count: invoiceNumberCount },
  ] = await Promise.all([
    getInvoiceTemplates(),
    getCustomers(),
    getInvoiceNumberCount(),
  ]);

  // Filter out null values
  const template = templatesData
    ? Object.fromEntries(
        Object.entries(templatesData).filter(([_, value]) => value !== null),
      )
    : {};

  return (
    <FormContext
      template={template}
      invoiceNumber={generateInvoiceNumber(invoiceNumberCount)}
    >
      <InvoiceCreateSheet teamId={teamId} customers={customersData} />
    </FormContext>
  );
}
