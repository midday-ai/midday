/**
 * Default values for invoice templates.
 * This is the single source of truth for template defaults.
 * Used by: API, Worker, Dashboard
 */

/**
 * Default label values for invoice templates
 */
export const DEFAULT_TEMPLATE_LABELS = {
  customerLabel: "To",
  title: "Invoice",
  fromLabel: "From",
  invoiceNoLabel: "Invoice No",
  issueDateLabel: "Issue Date",
  dueDateLabel: "Due Date",
  descriptionLabel: "Description",
  priceLabel: "Price",
  quantityLabel: "Quantity",
  totalLabel: "Total",
  totalSummaryLabel: "Total",
  vatLabel: "VAT",
  subtotalLabel: "Subtotal",
  taxLabel: "Tax",
  discountLabel: "Discount",
  paymentLabel: "Payment Details",
  noteLabel: "Note",
  lineItemTaxLabel: "Tax",
} as const;

/**
 * Default settings for invoice templates
 */
export const DEFAULT_TEMPLATE_SETTINGS = {
  currency: "USD",
  locale: "en-US",
  dateFormat: "dd/MM/yyyy",
  size: "a4" as const,
  // Tax/VAT settings - default to false, user enables as needed
  includeVat: false,
  includeTax: false,
  includeDiscount: false,
  includeLineItemTax: false,
  taxRate: 0,
  vatRate: 0,
  // Display settings
  includeDecimals: false,
  includeUnits: false,
  includeQr: true,
  // Email settings
  includePdf: true, // Attach PDF to emails
  sendCopy: false, // Send copy to invoice creator
  // Payment settings
  paymentEnabled: false,
  paymentTermsDays: 30,
  // Email content settings
  emailSubject: null,
  emailHeading: null,
  emailBody: null,
  emailButtonText: null,
} as const;

/**
 * Complete default template combining labels and settings
 */
export const DEFAULT_TEMPLATE = {
  ...DEFAULT_TEMPLATE_LABELS,
  ...DEFAULT_TEMPLATE_SETTINGS,
  // These are typically null/undefined by default
  logoUrl: null,
  timezone: "UTC",
  deliveryType: "create" as const,
  // Editor fields - null by default, user fills in
  paymentDetails: null,
  fromDetails: null,
  noteDetails: null,
} as const;

export type DefaultTemplate = typeof DEFAULT_TEMPLATE;
