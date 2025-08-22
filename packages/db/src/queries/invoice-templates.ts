import type { Database } from "@db/client";
import { invoiceTemplates } from "@db/schema";
import { eq } from "drizzle-orm";

type DraftInvoiceTemplateParams = {
  customerLabel?: string;
  title?: string;
  fromLabel?: string;
  invoiceNoLabel?: string;
  issueDateLabel?: string;
  dueDateLabel?: string;
  descriptionLabel?: string;
  priceLabel?: string;
  quantityLabel?: string;
  totalLabel?: string;
  totalSummaryLabel?: string;
  vatLabel?: string;
  subtotalLabel?: string;
  taxLabel?: string;
  discountLabel?: string;
  sendCopy?: boolean;
  timezone?: string;
  paymentLabel?: string;
  noteLabel?: string;
  logoUrl?: string | null;
  currency?: string;
  paymentDetails?: string | null; // Stringified JSON
  fromDetails?: string | null; // Stringified JSON
  dateFormat?: string;
  includeVat?: boolean;
  includeTax?: boolean;
  includeDiscount?: boolean;
  includeDecimals?: boolean;
  includeUnits?: boolean;
  includeQr?: boolean;
  taxRate?: number;
  vatRate?: number;
  size?: "a4" | "letter";
  deliveryType?: "create" | "create_and_send" | "scheduled";
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

export async function getInvoiceTemplate(db: Database, teamId: string) {
  const [result] = await db
    .select({
      id: invoiceTemplates.id,
      customerLabel: invoiceTemplates.customerLabel,
      fromLabel: invoiceTemplates.fromLabel,
      invoiceNoLabel: invoiceTemplates.invoiceNoLabel,
      issueDateLabel: invoiceTemplates.issueDateLabel,
      dueDateLabel: invoiceTemplates.dueDateLabel,
      descriptionLabel: invoiceTemplates.descriptionLabel,
      priceLabel: invoiceTemplates.priceLabel,
      quantityLabel: invoiceTemplates.quantityLabel,
      totalLabel: invoiceTemplates.totalLabel,
      vatLabel: invoiceTemplates.vatLabel,
      taxLabel: invoiceTemplates.taxLabel,
      paymentLabel: invoiceTemplates.paymentLabel,
      noteLabel: invoiceTemplates.noteLabel,
      logoUrl: invoiceTemplates.logoUrl,
      currency: invoiceTemplates.currency,
      subtotalLabel: invoiceTemplates.subtotalLabel,
      paymentDetails: invoiceTemplates.paymentDetails,
      fromDetails: invoiceTemplates.fromDetails,
      size: invoiceTemplates.size,
      dateFormat: invoiceTemplates.dateFormat,
      includeVat: invoiceTemplates.includeVat,
      includeTax: invoiceTemplates.includeTax,
      taxRate: invoiceTemplates.taxRate,
      deliveryType: invoiceTemplates.deliveryType,
      discountLabel: invoiceTemplates.discountLabel,
      includeDiscount: invoiceTemplates.includeDiscount,
      includeDecimals: invoiceTemplates.includeDecimals,
      includeQr: invoiceTemplates.includeQr,
      totalSummaryLabel: invoiceTemplates.totalSummaryLabel,
      title: invoiceTemplates.title,
      vatRate: invoiceTemplates.vatRate,
      includeUnits: invoiceTemplates.includeUnits,
      includePdf: invoiceTemplates.includePdf,
      sendCopy: invoiceTemplates.sendCopy,
    })
    .from(invoiceTemplates)
    .where(eq(invoiceTemplates.teamId, teamId))
    .limit(1);

  return result;
}
