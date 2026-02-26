/**
 * Default values for deal templates.
 * This is the single source of truth for template defaults.
 * Used by: API, Worker, Dashboard
 */

/**
 * Default label values for deal templates
 */
export const DEFAULT_TEMPLATE_LABELS = {
  customerLabel: "To",
  title: "Deal",
  fromLabel: "From",
  dealNoLabel: "Deal No",
  issueDateLabel: "Issue Date",
  dueDateLabel: "Due Date",
  descriptionLabel: "Description",
  priceLabel: "Price",
  quantityLabel: "Quantity",
  totalLabel: "Total",
  totalSummaryLabel: "Total",
  subtotalLabel: "Subtotal",
  discountLabel: "Discount",
  paymentLabel: "Payment Details",
  noteLabel: "Note",
} as const;

/**
 * Default settings for deal templates
 */
export const DEFAULT_TEMPLATE_SETTINGS = {
  currency: "USD",
  locale: "en-US",
  dateFormat: "dd/MM/yyyy",
  size: "a4" as const,
  includeDiscount: false,
  // Display settings
  includeDecimals: false,
  includeUnits: false,
  includeQr: true,
  // Email settings
  includePdf: true, // Attach PDF to emails
  sendCopy: false, // Send copy to deal creator
  // Payment settings
  paymentEnabled: false,
  paymentTermsDays: 30,
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
