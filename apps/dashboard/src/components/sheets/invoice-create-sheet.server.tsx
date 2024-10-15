import { getInvoiceTemplates } from "@midday/supabase/cached-queries";
import { InvoiceCreateSheet } from "./invoice-create-sheet";

export async function InvoiceCreateSheetServer({ teamId }: { teamId: string }) {
  const { data } = await getInvoiceTemplates();

  // Filter out null values
  const settings = data
    ? Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== null),
      )
    : {};

  return <InvoiceCreateSheet teamId={teamId} settings={settings} />;
}
