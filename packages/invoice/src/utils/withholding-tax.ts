/**
 * Japanese Withholding Tax (源泉徴収税) Calculation Utilities
 * Midday-JP
 *
 * Withholding tax applies to:
 * - Professional fees (弁護士、税理士、社労士等への報酬)
 * - Writers' fees (原稿料、講演料)
 * - Design fees (デザイン料)
 * - Freelance fees for specific services
 *
 * Standard rates:
 * - Under ¥1,000,000: 10.21%
 * - Over ¥1,000,000: 20.42% on the excess
 */

export const WITHHOLDING_TAX_RATE_STANDARD = 0.1021;
export const WITHHOLDING_TAX_RATE_HIGH = 0.2042;
export const WITHHOLDING_TAX_THRESHOLD = 1_000_000;

export interface WithholdingTaxResult {
  /** Original amount before withholding (報酬額) */
  grossAmount: number;
  /** Withholding tax amount (源泉徴収税額) */
  withholdingTaxAmount: number;
  /** Net amount after withholding (差引支払額) */
  netAmount: number;
  /** Applied rate(s) */
  appliedRates: {
    standard: { amount: number; tax: number };
    high?: { amount: number; tax: number };
  };
}

/**
 * Calculate withholding tax for professional fees
 * 報酬の源泉徴収税を計算
 *
 * For amounts up to ¥1,000,000: 10.21%
 * For amounts over ¥1,000,000: 10.21% on first ¥1M + 20.42% on excess
 *
 * @param amount - Gross payment amount (報酬額・税抜)
 * @param applyWithholding - Whether to apply withholding (源泉徴収を適用するか)
 * @returns WithholdingTaxResult
 */
export function calculateWithholdingTax(
  amount: number,
  applyWithholding = true
): WithholdingTaxResult {
  const safeAmount = amount ?? 0;

  if (!applyWithholding || safeAmount <= 0) {
    return {
      grossAmount: safeAmount,
      withholdingTaxAmount: 0,
      netAmount: safeAmount,
      appliedRates: {
        standard: { amount: safeAmount, tax: 0 },
      },
    };
  }

  let withholdingTaxAmount = 0;
  let standardTax = 0;
  let highTax = 0;
  let standardAmount = 0;
  let highAmount = 0;

  if (safeAmount <= WITHHOLDING_TAX_THRESHOLD) {
    // Amount is ¥1,000,000 or less: apply 10.21%
    standardAmount = safeAmount;
    standardTax = Math.floor(safeAmount * WITHHOLDING_TAX_RATE_STANDARD);
    withholdingTaxAmount = standardTax;
  } else {
    // Amount exceeds ¥1,000,000
    // First ¥1,000,000: 10.21%
    standardAmount = WITHHOLDING_TAX_THRESHOLD;
    standardTax = Math.floor(
      WITHHOLDING_TAX_THRESHOLD * WITHHOLDING_TAX_RATE_STANDARD
    );

    // Excess over ¥1,000,000: 20.42%
    highAmount = safeAmount - WITHHOLDING_TAX_THRESHOLD;
    highTax = Math.floor(highAmount * WITHHOLDING_TAX_RATE_HIGH);

    withholdingTaxAmount = standardTax + highTax;
  }

  const result: WithholdingTaxResult = {
    grossAmount: safeAmount,
    withholdingTaxAmount,
    netAmount: safeAmount - withholdingTaxAmount,
    appliedRates: {
      standard: { amount: standardAmount, tax: standardTax },
    },
  };

  if (highAmount > 0) {
    result.appliedRates.high = { amount: highAmount, tax: highTax };
  }

  return result;
}

/**
 * Calculate gross amount from net payment (reverse calculation)
 * 差引支払額から報酬額を逆算
 *
 * Useful when you know what net amount you want to pay and need to
 * calculate the gross amount before withholding.
 *
 * @param netAmount - Net payment amount after withholding (差引支払額)
 * @returns Gross amount (報酬額)
 */
export function calculateGrossFromNet(netAmount: number): number {
  const safeNetAmount = netAmount ?? 0;

  if (safeNetAmount <= 0) return 0;

  // Net threshold: ¥1,000,000 * (1 - 0.1021) = ¥897,900
  const netThreshold =
    WITHHOLDING_TAX_THRESHOLD * (1 - WITHHOLDING_TAX_RATE_STANDARD);

  if (safeNetAmount <= netThreshold) {
    // Gross = Net / (1 - 0.1021)
    return Math.round(safeNetAmount / (1 - WITHHOLDING_TAX_RATE_STANDARD));
  }

  // For amounts above threshold:
  // Net = 1,000,000 * (1 - 0.1021) + (Gross - 1,000,000) * (1 - 0.2042)
  // Net = 897,900 + (Gross - 1,000,000) * 0.7958
  // Net - 897,900 = (Gross - 1,000,000) * 0.7958
  // (Net - 897,900) / 0.7958 = Gross - 1,000,000
  // Gross = (Net - 897,900) / 0.7958 + 1,000,000

  const excess = safeNetAmount - netThreshold;
  const grossExcess = excess / (1 - WITHHOLDING_TAX_RATE_HIGH);
  return Math.round(WITHHOLDING_TAX_THRESHOLD + grossExcess);
}

export interface WithholdingTaxForInvoiceResult {
  /** Tax-exclusive amount (税抜金額) */
  taxExclusiveAmount: number;
  /** Consumption tax amount (消費税額) */
  consumptionTaxAmount: number;
  /** Tax-inclusive amount (税込金額) */
  taxInclusiveAmount: number;
  /** Withholding tax amount (源泉徴収税額) */
  withholdingTaxAmount: number;
  /** Amount to be received (請求金額 = 税込金額 - 源泉徴収税額) */
  invoiceAmount: number;
}

/**
 * Calculate withholding tax for an invoice amount
 * 請求書の源泉徴収税を計算
 *
 * Note: Withholding tax is calculated on the tax-exclusive amount,
 * not on the tax-inclusive amount.
 *
 * @param taxExclusiveAmount - Amount before consumption tax (税抜金額)
 * @param consumptionTaxAmount - Consumption tax (消費税額)
 * @param applyWithholding - Whether to apply withholding
 * @returns WithholdingTaxForInvoiceResult
 */
export function calculateWithholdingTaxForInvoice(
  taxExclusiveAmount: number,
  consumptionTaxAmount: number,
  applyWithholding = true
): WithholdingTaxForInvoiceResult {
  const safeTaxExclusiveAmount = taxExclusiveAmount ?? 0;
  const safeConsumptionTaxAmount = consumptionTaxAmount ?? 0;

  // Calculate tax-inclusive amount
  const taxInclusiveAmount = safeTaxExclusiveAmount + safeConsumptionTaxAmount;

  // Calculate withholding tax on tax-exclusive amount
  const { withholdingTaxAmount } = calculateWithholdingTax(
    safeTaxExclusiveAmount,
    applyWithholding
  );

  // Invoice amount = Tax-inclusive - Withholding
  // 請求金額 = 税込金額 - 源泉徴収税額
  const invoiceAmount = taxInclusiveAmount - withholdingTaxAmount;

  return {
    taxExclusiveAmount: safeTaxExclusiveAmount,
    consumptionTaxAmount: safeConsumptionTaxAmount,
    taxInclusiveAmount,
    withholdingTaxAmount,
    invoiceAmount,
  };
}

/**
 * Service types that typically require withholding tax
 * 源泉徴収が必要な報酬の種類
 */
export const WITHHOLDING_SERVICE_TYPES = [
  {
    code: "lawyer",
    label: "Legal fees",
    labelJa: "弁護士・司法書士等への報酬",
    requiresWithholding: true,
  },
  {
    code: "tax_accountant",
    label: "Tax advisory fees",
    labelJa: "税理士への報酬",
    requiresWithholding: true,
  },
  {
    code: "social_insurance",
    label: "Social insurance advisor fees",
    labelJa: "社会保険労務士への報酬",
    requiresWithholding: true,
  },
  {
    code: "writing",
    label: "Writing/lecture fees",
    labelJa: "原稿料・講演料",
    requiresWithholding: true,
  },
  {
    code: "design",
    label: "Design fees",
    labelJa: "デザイン料",
    requiresWithholding: true,
  },
  {
    code: "modeling",
    label: "Modeling fees",
    labelJa: "モデル・タレント等への報酬",
    requiresWithholding: true,
  },
  {
    code: "translation",
    label: "Translation fees",
    labelJa: "翻訳料",
    requiresWithholding: true,
  },
  {
    code: "consulting",
    label: "Consulting fees",
    labelJa: "コンサルティング料",
    requiresWithholding: true,
  },
  {
    code: "development",
    label: "Software development (non-employee)",
    labelJa: "ソフトウェア開発（外注）",
    requiresWithholding: true,
  },
  {
    code: "product_sales",
    label: "Product sales",
    labelJa: "物品販売",
    requiresWithholding: false,
  },
  {
    code: "other",
    label: "Other services",
    labelJa: "その他のサービス",
    requiresWithholding: false,
  },
] as const;

export type WithholdingServiceType =
  (typeof WITHHOLDING_SERVICE_TYPES)[number]["code"];

/**
 * Check if a service type requires withholding tax
 *
 * @param serviceType - Service type code
 * @returns boolean
 */
export function requiresWithholdingTax(serviceType: string): boolean {
  const service = WITHHOLDING_SERVICE_TYPES.find((s) => s.code === serviceType);
  return service?.requiresWithholding ?? false;
}
