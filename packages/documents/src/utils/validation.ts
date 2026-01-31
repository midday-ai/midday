import { parseISO } from "date-fns";
import type { z } from "zod/v4";
import type { invoiceSchema, receiptSchema } from "../schema";

type InvoiceData = z.infer<typeof invoiceSchema>;
type ReceiptData = z.infer<typeof receiptSchema>;

/**
 * Validates currency code format (ISO 4217)
 */
export function isValidCurrencyCode(
  currency: string | null | undefined,
): boolean {
  if (!currency) return false;
  // ISO 4217 currency codes are 3 uppercase letters
  return /^[A-Z]{3}$/.test(currency);
}

/**
 * Validates date format (YYYY-MM-DD)
 */
export function isValidDateFormat(date: string | null | undefined): boolean {
  if (!date) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsed = parseISO(date);
  // Check if date is valid and not invalid date
  return !Number.isNaN(parsed.getTime());
}

/**
 * Validates date is within reasonable range (not too far in past/future)
 */
export function isDateInReasonableRange(
  date: string | null | undefined,
): boolean {
  if (!date || !isValidDateFormat(date)) return false;

  const parsed = parseISO(date);
  const now = new Date();
  const tenYearsAgo = new Date(
    now.getFullYear() - 10,
    now.getMonth(),
    now.getDate(),
  );
  const twoYearsAhead = new Date(
    now.getFullYear() + 2,
    now.getMonth(),
    now.getDate(),
  );

  return parsed >= tenYearsAgo && parsed <= twoYearsAhead;
}

/**
 * Validates amount is positive and reasonable
 */
export function isValidAmount(amount: number | null | undefined): boolean {
  if (amount === null || amount === undefined) return false;
  if (Number.isNaN(amount)) return false;
  if (amount < 0) return false;
  // Reasonable upper bound: 1 trillion
  if (amount > 1_000_000_000_000) return false;
  return true;
}

/**
 * Validates tax rate is within reasonable range (0-100%)
 */
export function isValidTaxRate(rate: number | null | undefined): boolean {
  if (rate === null || rate === undefined) return false;
  if (Number.isNaN(rate)) return false;
  return rate >= 0 && rate <= 100;
}

/**
 * Cross-field validation: Check if tax_amount + subtotal ≈ total_amount
 * Allows for small rounding differences (0.01)
 */
export function validateAmountConsistency(
  totalAmount: number | null | undefined,
  taxAmount: number | null | undefined,
  lineItems: Array<{ total_price: number | null }> | null | undefined,
): boolean {
  if (!totalAmount || !isValidAmount(totalAmount)) return true; // Can't validate if total is invalid

  // Calculate subtotal from line items if available
  let subtotal = 0;
  if (lineItems && lineItems.length > 0) {
    subtotal = lineItems.reduce((sum, item) => {
      return (
        sum +
        (item.total_price && isValidAmount(item.total_price)
          ? item.total_price
          : 0)
      );
    }, 0);
  }

  // If we have both tax and subtotal, validate consistency
  if (
    taxAmount !== null &&
    taxAmount !== undefined &&
    isValidAmount(taxAmount) &&
    subtotal > 0
  ) {
    const calculatedTotal = subtotal + taxAmount;
    const difference = Math.abs(totalAmount - calculatedTotal);
    // Allow 0.01 difference for rounding
    return difference <= 0.01;
  }

  // If we only have tax amount, check it's not greater than total
  if (
    taxAmount !== null &&
    taxAmount !== undefined &&
    isValidAmount(taxAmount)
  ) {
    return taxAmount <= totalAmount;
  }

  return true; // Can't validate without enough data
}

/**
 * Quality score for extraction result (0-100)
 */
export interface QualityScore {
  score: number;
  issues: string[];
  missingCriticalFields: string[];
  invalidFields: string[];
}

export function calculateQualityScore(result: InvoiceData): QualityScore {
  const issues: string[] = [];
  const missingCriticalFields: string[] = [];
  const invalidFields: string[] = [];
  let score = 100;

  // Check critical fields
  if (!result.total_amount || !isValidAmount(result.total_amount)) {
    missingCriticalFields.push("total_amount");
    score -= 30;
  } else if (!isValidAmount(result.total_amount)) {
    invalidFields.push("total_amount");
    score -= 15;
  }

  if (!result.currency || !isValidCurrencyCode(result.currency)) {
    missingCriticalFields.push("currency");
    score -= 25;
  } else if (!isValidCurrencyCode(result.currency)) {
    invalidFields.push("currency");
    score -= 10;
  }

  if (!result.vendor_name) {
    missingCriticalFields.push("vendor_name");
    score -= 20;
  }

  if (!result.invoice_date && !result.due_date) {
    missingCriticalFields.push("invoice_date/due_date");
    score -= 15;
  } else {
    if (result.invoice_date && !isValidDateFormat(result.invoice_date)) {
      invalidFields.push("invoice_date");
      score -= 5;
    } else if (
      result.invoice_date &&
      !isDateInReasonableRange(result.invoice_date)
    ) {
      invalidFields.push("invoice_date");
      issues.push("invoice_date out of reasonable range");
      score -= 5;
    }

    if (result.due_date && !isValidDateFormat(result.due_date)) {
      invalidFields.push("due_date");
      score -= 5;
    } else if (result.due_date && !isDateInReasonableRange(result.due_date)) {
      invalidFields.push("due_date");
      issues.push("due_date out of reasonable range");
      score -= 5;
    }
  }

  // Validate tax fields
  if (result.tax_amount !== null && result.tax_amount !== undefined) {
    if (!isValidAmount(result.tax_amount)) {
      invalidFields.push("tax_amount");
      score -= 5;
    }
  }

  if (result.tax_rate !== null && result.tax_rate !== undefined) {
    if (!isValidTaxRate(result.tax_rate)) {
      invalidFields.push("tax_rate");
      score -= 5;
    }
  }

  // Cross-field validation
  if (
    result.total_amount &&
    !validateAmountConsistency(
      result.total_amount,
      result.tax_amount,
      result.line_items,
    )
  ) {
    issues.push("Amount consistency check failed (tax + subtotal ≠ total)");
    score -= 10;
  }

  // Check for important optional fields
  if (!result.invoice_number) {
    issues.push("invoice_number missing (optional but important)");
    score -= 5;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    score,
    issues,
    missingCriticalFields,
    invalidFields,
  };
}

/**
 * Check if extraction quality is poor
 * @param result - The extraction result to check
 * @param threshold - Quality score threshold (default: 70)
 */
export function isDataQualityPoor(
  result: InvoiceData,
  threshold = 70,
): boolean {
  const qualityScore = calculateQualityScore(result);

  // Quality is poor if score is below threshold or critical fields are missing
  return (
    qualityScore.score < threshold ||
    qualityScore.missingCriticalFields.length > 0
  );
}

/**
 * Get list of fields that need re-extraction
 */
export function getFieldsNeedingReExtraction(result: InvoiceData): string[] {
  const qualityScore = calculateQualityScore(result);
  const fieldsToReExtract: string[] = [];

  // Add missing critical fields
  fieldsToReExtract.push(...qualityScore.missingCriticalFields);

  // Add invalid fields
  fieldsToReExtract.push(...qualityScore.invalidFields);

  return [...new Set(fieldsToReExtract)]; // Remove duplicates
}

/**
 * Intelligently merge two extraction results
 * Prefers non-null values, and if both are present, prefers the one from the first result
 */
export function mergeExtractionResults(
  primary: InvoiceData,
  secondary: Partial<InvoiceData>,
): InvoiceData {
  return {
    document_type:
      primary.document_type || secondary.document_type || "invoice",
    invoice_number: primary.invoice_number || secondary.invoice_number || null,
    invoice_date: primary.invoice_date || secondary.invoice_date || null,
    due_date: primary.due_date || secondary.due_date || null,
    currency: primary.currency || secondary.currency || null,
    total_amount:
      primary.total_amount !== null && primary.total_amount !== undefined
        ? primary.total_amount
        : secondary.total_amount !== null &&
            secondary.total_amount !== undefined
          ? secondary.total_amount
          : null,
    tax_amount: primary.tax_amount || secondary.tax_amount || null,
    tax_rate: primary.tax_rate || secondary.tax_rate || null,
    tax_type: primary.tax_type || secondary.tax_type || null,
    vendor_name: primary.vendor_name || secondary.vendor_name || null,
    vendor_address: primary.vendor_address || secondary.vendor_address || null,
    customer_name: primary.customer_name || secondary.customer_name || null,
    customer_address:
      primary.customer_address || secondary.customer_address || null,
    website: primary.website || secondary.website || null,
    email: primary.email || secondary.email || null,
    line_items:
      primary.line_items && primary.line_items.length > 0
        ? primary.line_items
        : secondary.line_items && secondary.line_items.length > 0
          ? secondary.line_items
          : [],
    payment_instructions:
      primary.payment_instructions || secondary.payment_instructions || null,
    notes: primary.notes || secondary.notes || null,
    language: primary.language || secondary.language || null,
  };
}

/**
 * Quality score for receipt extraction result (0-100)
 */
export interface ReceiptQualityScore {
  score: number;
  issues: string[];
  missingCriticalFields: string[];
  invalidFields: string[];
}

export function calculateReceiptQualityScore(
  result: ReceiptData,
): ReceiptQualityScore {
  const issues: string[] = [];
  const missingCriticalFields: string[] = [];
  const invalidFields: string[] = [];
  let score = 100;

  // Check critical fields
  if (!result.total_amount || !isValidAmount(result.total_amount)) {
    missingCriticalFields.push("total_amount");
    score -= 30;
  } else if (!isValidAmount(result.total_amount)) {
    invalidFields.push("total_amount");
    score -= 15;
  }

  if (!result.currency || !isValidCurrencyCode(result.currency)) {
    missingCriticalFields.push("currency");
    score -= 25;
  } else if (!isValidCurrencyCode(result.currency)) {
    invalidFields.push("currency");
    score -= 10;
  }

  if (!result.store_name) {
    missingCriticalFields.push("store_name");
    score -= 20;
  }

  if (!result.date) {
    missingCriticalFields.push("date");
    score -= 15;
  } else {
    if (!isValidDateFormat(result.date)) {
      invalidFields.push("date");
      score -= 5;
    } else if (!isDateInReasonableRange(result.date)) {
      invalidFields.push("date");
      issues.push("date out of reasonable range");
      score -= 5;
    }
  }

  // Validate tax fields
  if (result.tax_amount !== null && result.tax_amount !== undefined) {
    if (!isValidAmount(result.tax_amount)) {
      invalidFields.push("tax_amount");
      score -= 5;
    }
  } else {
    // Tax amount is required for receipts
    missingCriticalFields.push("tax_amount");
    score -= 10;
  }

  if (result.tax_rate !== null && result.tax_rate !== undefined) {
    if (!isValidTaxRate(result.tax_rate)) {
      invalidFields.push("tax_rate");
      score -= 5;
    }
  }

  // Cross-field validation
  if (
    result.total_amount &&
    result.subtotal_amount &&
    result.tax_amount &&
    !validateAmountConsistency(
      result.total_amount,
      result.tax_amount,
      result.items?.map((item) => ({ total_price: item.total_price })) || [],
    )
  ) {
    issues.push("Amount consistency check failed (tax + subtotal ≠ total)");
    score -= 10;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    score,
    issues,
    missingCriticalFields,
    invalidFields,
  };
}

/**
 * Check if receipt extraction quality is poor
 * @param result - The extraction result to check
 * @param threshold - Quality score threshold (default: 70)
 */
export function isReceiptDataQualityPoor(
  result: ReceiptData,
  threshold = 70,
): boolean {
  const qualityScore = calculateReceiptQualityScore(result);
  return (
    qualityScore.score < threshold ||
    qualityScore.missingCriticalFields.length > 0
  );
}

/**
 * Get list of receipt fields that need re-extraction
 */
export function getReceiptFieldsNeedingReExtraction(
  result: ReceiptData,
): string[] {
  const qualityScore = calculateReceiptQualityScore(result);
  const fieldsToReExtract: string[] = [];

  fieldsToReExtract.push(...qualityScore.missingCriticalFields);
  fieldsToReExtract.push(...qualityScore.invalidFields);

  return [...new Set(fieldsToReExtract)];
}

/**
 * Intelligently merge two receipt extraction results
 */
export function mergeReceiptExtractionResults(
  primary: ReceiptData,
  secondary: Partial<ReceiptData>,
): ReceiptData {
  return {
    document_type:
      primary.document_type || secondary.document_type || "receipt",
    date: primary.date || secondary.date || null,
    currency: primary.currency || secondary.currency || null,
    total_amount:
      primary.total_amount !== null && primary.total_amount !== undefined
        ? primary.total_amount
        : secondary.total_amount !== null &&
            secondary.total_amount !== undefined
          ? secondary.total_amount
          : null,
    subtotal_amount:
      primary.subtotal_amount || secondary.subtotal_amount || null,
    tax_amount:
      primary.tax_amount !== null && primary.tax_amount !== undefined
        ? primary.tax_amount
        : secondary.tax_amount !== null && secondary.tax_amount !== undefined
          ? secondary.tax_amount
          : null,
    tax_rate: primary.tax_rate || secondary.tax_rate,
    tax_type: primary.tax_type || secondary.tax_type || null,
    store_name: primary.store_name || secondary.store_name || null,
    website: primary.website || secondary.website || null,
    payment_method: primary.payment_method || secondary.payment_method || null,
    items:
      primary.items && primary.items.length > 0
        ? primary.items
        : secondary.items && secondary.items.length > 0
          ? secondary.items
          : [],
    cashier_name: primary.cashier_name || secondary.cashier_name || null,
    email: primary.email || secondary.email || null,
    register_number:
      primary.register_number || secondary.register_number || null,
    language: primary.language || secondary.language || null,
  };
}
