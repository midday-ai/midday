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
 * Japanese (日本語) default label values for invoice templates
 * Midday-JP
 */
export const DEFAULT_TEMPLATE_LABELS_JP = {
  customerLabel: "請求先",
  title: "請求書",
  fromLabel: "発行者",
  invoiceNoLabel: "請求番号",
  issueDateLabel: "発行日",
  dueDateLabel: "支払期日",
  descriptionLabel: "品目",
  priceLabel: "単価",
  quantityLabel: "数量",
  totalLabel: "金額",
  totalSummaryLabel: "合計",
  vatLabel: "付加価値税",
  subtotalLabel: "小計",
  taxLabel: "消費税",
  discountLabel: "値引",
  paymentLabel: "お振込先",
  noteLabel: "備考",
  lineItemTaxLabel: "税率",
  // Japan-specific labels
  withholdingTaxLabel: "源泉徴収税額",
  registrationNumberLabel: "登録番号",
  consumptionTaxLabel: "消費税",
  bankAccountLabel: "振込先口座",
} as const;

/**
 * Japanese document type labels
 */
export const DOCUMENT_TYPE_LABELS_JP = {
  quotation: "見積書",
  delivery_slip: "納品書",
  invoice: "請求書",
  receipt: "領収書",
} as const;

export type DocumentTypeJP = keyof typeof DOCUMENT_TYPE_LABELS_JP;

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
} as const;

/**
 * Japanese default settings for invoice templates
 * Midday-JP
 */
export const DEFAULT_TEMPLATE_SETTINGS_JP = {
  currency: "JPY",
  locale: "ja-JP",
  dateFormat: "yyyy年MM月dd日",
  size: "a4" as const,
  // Tax settings - consumption tax enabled by default
  includeVat: false,
  includeTax: true, // 消費税を含む
  includeDiscount: false,
  includeLineItemTax: false,
  taxRate: 10, // 標準税率 10%
  vatRate: 0,
  // Display settings
  includeDecimals: false, // 日本円は小数点なし
  includeUnits: false,
  includeQr: false, // 日本ではQRコード決済はオプション
  // Email settings
  includePdf: true,
  sendCopy: false,
  // Payment settings
  paymentEnabled: false,
  paymentTermsDays: 30, // 月末締め翌月末払い
} as const;

/**
 * Complete Japanese default template
 */
export const DEFAULT_TEMPLATE_JP = {
  ...DEFAULT_TEMPLATE_LABELS_JP,
  ...DEFAULT_TEMPLATE_SETTINGS_JP,
  logoUrl: null,
  timezone: "Asia/Tokyo",
  deliveryType: "create" as const,
  paymentDetails: null,
  fromDetails: null,
  noteDetails: null,
} as const;

export type DefaultTemplateJP = typeof DEFAULT_TEMPLATE_JP;

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
