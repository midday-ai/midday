import type { Database } from "../index";
import { invoiceTemplates } from "../schema";

type DraftInvoiceTemplateParams = {
  customer_label?: string;
  title?: string;
  from_label?: string;
  invoice_no_label?: string;
  issue_date_label?: string;
  due_date_label?: string;
  description_label?: string;
  price_label?: string;
  quantity_label?: string;
  total_label?: string;
  total_summary_label?: string;
  vat_label?: string;
  subtotal_label?: string;
  tax_label?: string;
  discount_label?: string;
  timezone?: string;
  payment_label?: string;
  note_label?: string;
  logo_url?: string | null;
  currency?: string;
  payment_details?: string | null; // Stringified JSON
  from_details?: string | null; // Stringified JSON
  date_format?: string;
  include_vat?: boolean;
  include_tax?: boolean;
  include_discount?: boolean;
  include_decimals?: boolean;
  include_units?: boolean;
  include_qr?: boolean;
  tax_rate?: number;
  vat_rate?: number;
  size?: "a4" | "letter";
  delivery_type?: "create" | "create_and_send";
  locale?: string;
};

type UpdateInvoiceTemplateParams = {
  teamId: string;
} & DraftInvoiceTemplateParams;

export async function updateInvoiceTemplate(
  db: Database,
  params: UpdateInvoiceTemplateParams,
) {
  const { teamId, ...rest } = params;

  const [result] = await db
    .insert(invoiceTemplates)
    .values({
      teamId: teamId,
      ...rest,
    })
    .onConflictDoUpdate({
      target: invoiceTemplates.teamId,
      set: rest,
    })
    .returning();

  return result;
}
