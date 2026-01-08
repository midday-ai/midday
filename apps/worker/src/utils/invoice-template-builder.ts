/**
 * Invoice template builder utility for recurring invoice generation.
 * Centralizes template construction logic for consistency and maintainability.
 */

import {
  DEFAULT_TEMPLATE_LABELS,
  DEFAULT_TEMPLATE_SETTINGS,
} from "@midday/invoice";

/**
 * Invoice line item type
 */
export type InvoiceLineItem = {
  name?: string | null;
  quantity?: number;
  unit?: string | null;
  price?: number;
  vat?: number | null;
  tax?: number | null;
  taxRate?: number | null;
  productId?: string;
};

/**
 * Recurring invoice data structure (from database query)
 */
export interface RecurringInvoiceData {
  teamId: string;
  userId: string;
  customerId: string | null;
  customerName: string | null;
  template: unknown;
  templateId: string | null;
  timezone: string;
  currency: string | null;
  dueDateOffset: number;
  paymentDetails: unknown;
  fromDetails: unknown;
  noteDetails: unknown;
  topBlock: unknown;
  bottomBlock: unknown;
  vat: number | null;
  tax: number | null;
  discount: number | null;
  subtotal: number | null;
  amount: number | null;
  lineItems: unknown;
}

/**
 * Built invoice template result
 */
export interface BuiltInvoiceTemplate {
  customerLabel: string;
  title: string;
  fromLabel: string;
  invoiceNoLabel: string;
  issueDateLabel: string;
  dueDateLabel: string;
  descriptionLabel: string;
  priceLabel: string;
  quantityLabel: string;
  totalLabel: string;
  totalSummaryLabel: string;
  vatLabel: string;
  subtotalLabel: string;
  taxLabel: string;
  discountLabel: string;
  timezone: string;
  paymentLabel: string;
  noteLabel: string;
  logoUrl: string | null;
  currency: string;
  dateFormat: string;
  includeVat: boolean;
  includeTax: boolean;
  includeDiscount: boolean;
  includeDecimals: boolean;
  includeUnits: boolean;
  includeQr: boolean;
  includePdf: boolean;
  includeLineItemTax: boolean;
  lineItemTaxLabel?: string;
  sendCopy: boolean;
  paymentEnabled: boolean;
  paymentTermsDays?: number;
  taxRate: number;
  vatRate: number;
  size: "a4" | "letter";
  deliveryType: "create_and_send";
  locale: string;
}

/**
 * Build a complete invoice template from recurring invoice data.
 * Applies default values for any missing fields.
 *
 * @param recurring - The recurring invoice data from the database
 * @returns A complete invoice template with all required fields
 */
export function buildInvoiceTemplateFromRecurring(
  recurring: RecurringInvoiceData,
): BuiltInvoiceTemplate {
  const template = (recurring.template as Record<string, unknown>) || {};

  return {
    // Labels with defaults
    customerLabel:
      (template.customerLabel as string) ??
      DEFAULT_TEMPLATE_LABELS.customerLabel,
    title: (template.title as string) ?? DEFAULT_TEMPLATE_LABELS.title,
    fromLabel:
      (template.fromLabel as string) ?? DEFAULT_TEMPLATE_LABELS.fromLabel,
    invoiceNoLabel:
      (template.invoiceNoLabel as string) ??
      DEFAULT_TEMPLATE_LABELS.invoiceNoLabel,
    issueDateLabel:
      (template.issueDateLabel as string) ??
      DEFAULT_TEMPLATE_LABELS.issueDateLabel,
    dueDateLabel:
      (template.dueDateLabel as string) ?? DEFAULT_TEMPLATE_LABELS.dueDateLabel,
    descriptionLabel:
      (template.descriptionLabel as string) ??
      DEFAULT_TEMPLATE_LABELS.descriptionLabel,
    priceLabel:
      (template.priceLabel as string) ?? DEFAULT_TEMPLATE_LABELS.priceLabel,
    quantityLabel:
      (template.quantityLabel as string) ??
      DEFAULT_TEMPLATE_LABELS.quantityLabel,
    totalLabel:
      (template.totalLabel as string) ?? DEFAULT_TEMPLATE_LABELS.totalLabel,
    totalSummaryLabel:
      (template.totalSummaryLabel as string) ??
      DEFAULT_TEMPLATE_LABELS.totalSummaryLabel,
    vatLabel: (template.vatLabel as string) ?? DEFAULT_TEMPLATE_LABELS.vatLabel,
    subtotalLabel:
      (template.subtotalLabel as string) ??
      DEFAULT_TEMPLATE_LABELS.subtotalLabel,
    taxLabel: (template.taxLabel as string) ?? DEFAULT_TEMPLATE_LABELS.taxLabel,
    discountLabel:
      (template.discountLabel as string) ??
      DEFAULT_TEMPLATE_LABELS.discountLabel,
    paymentLabel:
      (template.paymentLabel as string) ?? DEFAULT_TEMPLATE_LABELS.paymentLabel,
    noteLabel:
      (template.noteLabel as string) ?? DEFAULT_TEMPLATE_LABELS.noteLabel,

    // Required fields from recurring
    timezone: recurring.timezone,

    // Optional fields with defaults
    logoUrl: (template.logoUrl as string | null) ?? null,
    currency: recurring.currency ?? DEFAULT_TEMPLATE_SETTINGS.currency,
    dateFormat:
      (template.dateFormat as string) ?? DEFAULT_TEMPLATE_SETTINGS.dateFormat,
    locale: (template.locale as string) ?? DEFAULT_TEMPLATE_SETTINGS.locale,
    size: (template.size as "a4" | "letter") ?? DEFAULT_TEMPLATE_SETTINGS.size,

    // Boolean settings with defaults
    includeVat:
      (template.includeVat as boolean) ?? DEFAULT_TEMPLATE_SETTINGS.includeVat,
    includeTax:
      (template.includeTax as boolean) ?? DEFAULT_TEMPLATE_SETTINGS.includeTax,
    includeDiscount:
      (template.includeDiscount as boolean) ??
      DEFAULT_TEMPLATE_SETTINGS.includeDiscount,
    includeDecimals:
      (template.includeDecimals as boolean) ??
      DEFAULT_TEMPLATE_SETTINGS.includeDecimals,
    includeUnits:
      (template.includeUnits as boolean) ??
      DEFAULT_TEMPLATE_SETTINGS.includeUnits,
    includeQr:
      (template.includeQr as boolean) ?? DEFAULT_TEMPLATE_SETTINGS.includeQr,
    includePdf:
      (template.includePdf as boolean) ?? DEFAULT_TEMPLATE_SETTINGS.includePdf,
    includeLineItemTax:
      (template.includeLineItemTax as boolean) ??
      DEFAULT_TEMPLATE_SETTINGS.includeLineItemTax,
    lineItemTaxLabel:
      (template.lineItemTaxLabel as string) ??
      DEFAULT_TEMPLATE_LABELS.lineItemTaxLabel,
    sendCopy:
      (template.sendCopy as boolean) ?? DEFAULT_TEMPLATE_SETTINGS.sendCopy,
    paymentEnabled:
      (template.paymentEnabled as boolean) ??
      DEFAULT_TEMPLATE_SETTINGS.paymentEnabled,
    paymentTermsDays:
      (template.paymentTermsDays as number) ??
      DEFAULT_TEMPLATE_SETTINGS.paymentTermsDays,

    // Numeric settings with defaults
    taxRate: (template.taxRate as number) ?? DEFAULT_TEMPLATE_SETTINGS.taxRate,
    vatRate: (template.vatRate as number) ?? DEFAULT_TEMPLATE_SETTINGS.vatRate,

    // Fixed value for recurring invoices
    deliveryType: "create_and_send",
  };
}

/**
 * Safely stringify JSON fields from recurring invoice data.
 * Returns null if the field is null/undefined.
 */
export function stringifyJsonField(field: unknown): string | null {
  if (field === null || field === undefined) {
    return null;
  }
  return JSON.stringify(field);
}

/**
 * Parse line items from recurring invoice data.
 * Returns undefined if no line items exist.
 */
export function parseLineItems(
  lineItems: unknown,
): InvoiceLineItem[] | undefined {
  if (!lineItems || !Array.isArray(lineItems)) {
    return undefined;
  }
  return lineItems as InvoiceLineItem[];
}

/**
 * Validation result for recurring invoice data
 */
export interface RecurringDataValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate recurring invoice data integrity before generation.
 * Performs defensive checks for common data corruption issues.
 *
 * @param recurring - The recurring invoice data to validate
 * @returns Validation result with any errors found
 */
export function validateRecurringDataIntegrity(
  recurring: RecurringInvoiceData,
): RecurringDataValidationResult {
  const errors: string[] = [];

  // Check template is an object (not primitive or array)
  if (recurring.template !== null && typeof recurring.template !== "object") {
    errors.push("Template data is not a valid object");
  }
  if (Array.isArray(recurring.template)) {
    errors.push("Template data is an array, expected object");
  }

  // Check required fields
  if (!recurring.teamId) {
    errors.push("Missing teamId");
  }
  if (!recurring.userId) {
    errors.push("Missing userId");
  }
  if (!recurring.timezone) {
    errors.push("Missing timezone");
  }

  // Check dueDateOffset is a valid number
  if (
    typeof recurring.dueDateOffset !== "number" ||
    Number.isNaN(recurring.dueDateOffset)
  ) {
    errors.push("Invalid dueDateOffset");
  }

  // Check line items structure if present
  if (recurring.lineItems !== null && recurring.lineItems !== undefined) {
    if (!Array.isArray(recurring.lineItems)) {
      errors.push("lineItems is not an array");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
