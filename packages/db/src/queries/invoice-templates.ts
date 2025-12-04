import type { Database } from "@db/client";
import { invoiceTemplates } from "@db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

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
  paymentDetails?: any;
  fromDetails?: any;
  noteDetails?: any;
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

export type CreateInvoiceTemplateParams = {
  teamId: string;
  userId?: string;
  name: string;
  isDefault?: boolean;
} & DraftInvoiceTemplateParams;

export type UpdateInvoiceTemplateParams = {
  id: string;
  teamId: string;
  name?: string;
  isDefault?: boolean;
} & DraftInvoiceTemplateParams;

export async function createInvoiceTemplate(
  db: Database,
  params: CreateInvoiceTemplateParams,
) {
  const { teamId, userId, name, isDefault, ...rest } = params;

  // If this is set as default, unset other defaults for this team
  if (isDefault) {
    await db
      .update(invoiceTemplates)
      .set({ isDefault: false })
      .where(eq(invoiceTemplates.teamId, teamId));
  }

  const [result] = await db
    .insert(invoiceTemplates)
    .values({
      teamId,
      userId,
      name,
      isDefault: isDefault ?? false,
      ...rest,
    })
    .returning();

  return result;
}

export async function listInvoiceTemplates(db: Database, teamId: string) {
  const results = await db
    .select({
      id: invoiceTemplates.id,
      name: invoiceTemplates.name,
      isDefault: invoiceTemplates.isDefault,
      createdAt: invoiceTemplates.createdAt,
      updatedAt: invoiceTemplates.updatedAt,
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
      noteDetails: invoiceTemplates.noteDetails,
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
    .orderBy(
      desc(invoiceTemplates.isDefault),
      desc(invoiceTemplates.createdAt),
    );

  return results;
}

export async function getInvoiceTemplateById(
  db: Database,
  id: string,
  teamId: string,
) {
  const [result] = await db
    .select({
      id: invoiceTemplates.id,
      name: invoiceTemplates.name,
      isDefault: invoiceTemplates.isDefault,
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
      noteDetails: invoiceTemplates.noteDetails,
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
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.teamId, teamId)),
    )
    .limit(1);

  return result;
}

export async function updateInvoiceTemplate(
  db: Database,
  params: UpdateInvoiceTemplateParams,
) {
  const { id, teamId, name, isDefault, ...rest } = params;

  // If this is set as default, unset other defaults for this team
  if (isDefault) {
    await db
      .update(invoiceTemplates)
      .set({ isDefault: false })
      .where(
        and(
          eq(invoiceTemplates.teamId, teamId),
          sql`${invoiceTemplates.id} != ${id}`,
        ),
      );
  }

  const [result] = await db
    .update(invoiceTemplates)
    .set({
      ...(name !== undefined && { name }),
      ...(isDefault !== undefined && { isDefault }),
      ...rest,
      updatedAt: sql`now()`,
    })
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.teamId, teamId)),
    )
    .returning();

  return result;
}

export async function deleteInvoiceTemplate(
  db: Database,
  id: string,
  teamId: string,
) {
  const [result] = await db
    .delete(invoiceTemplates)
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.teamId, teamId)),
    )
    .returning();

  return result;
}

export async function setDefaultInvoiceTemplate(
  db: Database,
  id: string,
  teamId: string,
) {
  // Unset all other defaults for this team
  await db
    .update(invoiceTemplates)
    .set({ isDefault: false })
    .where(eq(invoiceTemplates.teamId, teamId));

  // Set this template as default
  const [result] = await db
    .update(invoiceTemplates)
    .set({ isDefault: true })
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.teamId, teamId)),
    )
    .returning();

  return result;
}

export async function getInvoiceTemplate(db: Database, teamId: string) {
  const [result] = await db
    .select({
      id: invoiceTemplates.id,
      name: invoiceTemplates.name,
      isDefault: invoiceTemplates.isDefault,
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
      noteDetails: invoiceTemplates.noteDetails,
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
    .where(
      and(
        eq(invoiceTemplates.teamId, teamId),
        eq(invoiceTemplates.isDefault, true),
      ),
    )
    .limit(1);

  return result;
}
