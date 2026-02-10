import type { z } from "zod/v4";
import type { invoiceSchema, receiptSchema } from "../schema";
import { isValidAmount, isValidDateFormat } from "./validation";

type InvoiceData = z.infer<typeof invoiceSchema>;
type ReceiptData = z.infer<typeof receiptSchema>;

export interface ConsistencyIssue {
  field: string;
  issue: string;
  severity: "error" | "warning";
  suggestedFix?: {
    field: string;
    value: any;
    reason: string;
  };
}

export interface ConsistencyValidationResult {
  isValid: boolean;
  issues: ConsistencyIssue[];
  suggestedFixes: Array<{
    field: string;
    value: any;
    reason: string;
  }>;
}

/**
 * Validate cross-field consistency for invoices
 */
export function validateInvoiceConsistency(
  result: InvoiceData,
): ConsistencyValidationResult {
  const issues: ConsistencyIssue[] = [];
  const suggestedFixes: Array<{
    field: string;
    value: any;
    reason: string;
  }> = [];

  // 1. Validate: tax_amount + subtotal ≈ total_amount
  const subtotal = calculateSubtotalFromLineItems(result.line_items);
  const hasSubtotal = subtotal > 0;
  const hasTaxAmount =
    result.tax_amount !== null && result.tax_amount !== undefined;
  const hasTotalAmount =
    result.total_amount !== null && result.total_amount !== undefined;

  if (hasTotalAmount && isValidAmount(result.total_amount)) {
    // Check if tax_amount + subtotal matches total_amount
    if (hasTaxAmount && hasSubtotal) {
      const calculatedTotal = subtotal + result.tax_amount!;
      const difference = Math.abs(calculatedTotal - result.total_amount!);

      if (difference > 0.01) {
        issues.push({
          field: "total_amount",
          issue: `Total amount (${result.total_amount}) doesn't match subtotal (${subtotal}) + tax (${result.tax_amount}) = ${calculatedTotal}. Difference: ${difference.toFixed(2)}`,
          severity: "error",
        });

        // Suggest fix: use calculated total if difference is reasonable
        if (difference < result.total_amount! * 0.05) {
          // Within 5% - likely rounding issue
          suggestedFixes.push({
            field: "total_amount",
            value: Math.round(calculatedTotal * 100) / 100,
            reason:
              "Calculated from subtotal + tax_amount (rounding correction)",
          });
        }
      }
    }

    // Check if we can calculate tax_amount from tax_rate and subtotal
    if (
      !hasTaxAmount &&
      result.tax_rate !== null &&
      result.tax_rate !== undefined &&
      hasSubtotal &&
      result.tax_rate > 0 &&
      result.tax_rate <= 100
    ) {
      const calculatedTax = (subtotal * result.tax_rate) / 100;
      const calculatedTotal = subtotal + calculatedTax;
      const difference = Math.abs(calculatedTotal - result.total_amount!);

      if (difference < 0.01 || difference < result.total_amount! * 0.01) {
        // Very close match - suggest calculating tax_amount
        suggestedFixes.push({
          field: "tax_amount",
          value: Math.round(calculatedTax * 100) / 100,
          reason: `Calculated from subtotal (${subtotal}) × tax_rate (${result.tax_rate}%)`,
        });
      }
    }

    // Check if we can calculate total_amount from subtotal and tax_amount
    if (!hasTotalAmount && hasSubtotal && hasTaxAmount) {
      const calculatedTotal = subtotal + result.tax_amount!;
      suggestedFixes.push({
        field: "total_amount",
        value: Math.round(calculatedTotal * 100) / 100,
        reason: `Calculated from subtotal (${subtotal}) + tax_amount (${result.tax_amount})`,
      });
    }
  }

  // 2. Validate: due_date >= invoice_date
  if (
    result.due_date &&
    result.invoice_date &&
    isValidDateFormat(result.due_date) &&
    isValidDateFormat(result.invoice_date)
  ) {
    const invoiceDate = new Date(result.invoice_date);
    const dueDate = new Date(result.due_date);

    if (dueDate < invoiceDate) {
      issues.push({
        field: "due_date",
        issue: `Due date (${result.due_date}) is before invoice date (${result.invoice_date})`,
        severity: "error",
      });
    }
  }

  // 3. Validate: tax_rate matches tax_amount / subtotal
  if (
    hasTaxAmount &&
    hasSubtotal &&
    result.tax_rate !== null &&
    result.tax_rate !== undefined &&
    subtotal > 0
  ) {
    const calculatedRate = (result.tax_amount! / subtotal) * 100;
    const rateDifference = Math.abs(calculatedRate - result.tax_rate);

    if (rateDifference > 0.1) {
      // More than 0.1% difference
      issues.push({
        field: "tax_rate",
        issue: `Tax rate (${result.tax_rate}%) doesn't match tax_amount (${result.tax_amount}) / subtotal (${subtotal}) = ${calculatedRate.toFixed(2)}%`,
        severity: "warning",
      });

      // Suggest fix if calculated rate is reasonable
      if (calculatedRate >= 0 && calculatedRate <= 100) {
        suggestedFixes.push({
          field: "tax_rate",
          value: Math.round(calculatedRate * 100) / 100,
          reason: `Calculated from tax_amount (${result.tax_amount}) / subtotal (${subtotal})`,
        });
      }
    }
  }

  // 4. Validate: currency consistency (all amounts should use same currency)
  // This is handled at schema level, but we can add additional checks here if needed

  return {
    isValid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    suggestedFixes,
  };
}

/**
 * Validate cross-field consistency for receipts
 */
export function validateReceiptConsistency(
  result: ReceiptData,
): ConsistencyValidationResult {
  const issues: ConsistencyIssue[] = [];
  const suggestedFixes: Array<{
    field: string;
    value: any;
    reason: string;
  }> = [];

  // 1. Validate: tax_amount + subtotal_amount ≈ total_amount
  const hasSubtotal =
    result.subtotal_amount !== null &&
    result.subtotal_amount !== undefined &&
    isValidAmount(result.subtotal_amount);
  const hasTaxAmount =
    result.tax_amount !== null &&
    result.tax_amount !== undefined &&
    isValidAmount(result.tax_amount);
  const hasTotalAmount =
    result.total_amount !== null &&
    result.total_amount !== undefined &&
    isValidAmount(result.total_amount);

  if (hasTotalAmount) {
    if (hasSubtotal && hasTaxAmount) {
      const calculatedTotal = result.subtotal_amount! + result.tax_amount!;
      const difference = Math.abs(calculatedTotal - result.total_amount!);

      if (difference > 0.01) {
        issues.push({
          field: "total_amount",
          issue: `Total amount (${result.total_amount}) doesn't match subtotal (${result.subtotal_amount}) + tax (${result.tax_amount}) = ${calculatedTotal}. Difference: ${difference}`,
          severity: "error",
        });

        if (difference < result.total_amount! * 0.05) {
          suggestedFixes.push({
            field: "total_amount",
            value: Math.round(calculatedTotal * 100) / 100,
            reason:
              "Calculated from subtotal + tax_amount (rounding correction)",
          });
        }
      }
    }

    // Calculate tax_amount from tax_rate and subtotal
    if (
      !hasTaxAmount &&
      result.tax_rate !== null &&
      result.tax_rate !== undefined &&
      hasSubtotal &&
      result.tax_rate > 0 &&
      result.tax_rate <= 100
    ) {
      const calculatedTax = (result.subtotal_amount! * result.tax_rate) / 100;
      const calculatedTotal = result.subtotal_amount! + calculatedTax;
      const difference = Math.abs(calculatedTotal - result.total_amount!);

      if (difference < 0.01 || difference < result.total_amount! * 0.01) {
        suggestedFixes.push({
          field: "tax_amount",
          value: Math.round(calculatedTax * 100) / 100,
          reason: `Calculated from subtotal (${result.subtotal_amount}) × tax_rate (${result.tax_rate}%)`,
        });
      }
    }

    // Calculate total_amount from subtotal and tax_amount
    if (!hasTotalAmount && hasSubtotal && hasTaxAmount) {
      const calculatedTotal = result.subtotal_amount! + result.tax_amount!;
      suggestedFixes.push({
        field: "total_amount",
        value: Math.round(calculatedTotal * 100) / 100,
        reason: `Calculated from subtotal (${result.subtotal_amount}) + tax_amount (${result.tax_amount})`,
      });
    }
  }

  // 2. Validate: tax_rate matches tax_amount / subtotal_amount
  if (
    hasTaxAmount &&
    hasSubtotal &&
    result.tax_rate !== null &&
    result.tax_rate !== undefined &&
    result.subtotal_amount! > 0
  ) {
    const calculatedRate = (result.tax_amount! / result.subtotal_amount!) * 100;
    const rateDifference = Math.abs(calculatedRate - result.tax_rate);

    if (rateDifference > 0.1) {
      issues.push({
        field: "tax_rate",
        issue: `Tax rate (${result.tax_rate}%) doesn't match tax_amount (${result.tax_amount}) / subtotal (${result.subtotal_amount}) = ${calculatedRate.toFixed(2)}%`,
        severity: "warning",
      });

      if (calculatedRate >= 0 && calculatedRate <= 100) {
        suggestedFixes.push({
          field: "tax_rate",
          value: Math.round(calculatedRate * 100) / 100,
          reason: `Calculated from tax_amount (${result.tax_amount}) / subtotal (${result.subtotal_amount})`,
        });
      }
    }
  }

  // 3. Validate: items sum matches subtotal_amount (if items present)
  if (result.items && result.items.length > 0) {
    const itemsTotal = result.items.reduce((sum, item) => {
      const itemTotal =
        item.total_price !== null && item.total_price !== undefined
          ? item.total_price
          : 0;
      return sum + itemTotal;
    }, 0);

    if (hasSubtotal) {
      const difference = Math.abs(itemsTotal - result.subtotal_amount!);
      if (difference > 0.01) {
        issues.push({
          field: "subtotal_amount",
          issue: `Subtotal (${result.subtotal_amount}) doesn't match sum of items (${itemsTotal}). Difference: ${difference}`,
          severity: "warning",
        });

        if (difference < result.subtotal_amount! * 0.05) {
          suggestedFixes.push({
            field: "subtotal_amount",
            value: Math.round(itemsTotal * 100) / 100,
            reason: "Calculated from sum of line items",
          });
        }
      }
    } else if (itemsTotal > 0) {
      // Subtotal missing but we can calculate it
      suggestedFixes.push({
        field: "subtotal_amount",
        value: Math.round(itemsTotal * 100) / 100,
        reason: "Calculated from sum of line items",
      });
    }
  }

  return {
    isValid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    suggestedFixes,
  };
}

/**
 * Calculate subtotal from line items
 */
function calculateSubtotalFromLineItems(
  lineItems: InvoiceData["line_items"] | null | undefined,
): number {
  if (!lineItems || lineItems.length === 0) {
    return 0;
  }

  return lineItems.reduce((sum, item) => {
    const itemTotal =
      item.total_price !== null &&
      item.total_price !== undefined &&
      isValidAmount(item.total_price)
        ? item.total_price
        : 0;
    return sum + itemTotal;
  }, 0);
}

/**
 * Apply suggested fixes to invoice data
 */
export function applyInvoiceFixes(
  data: InvoiceData,
  fixes: Array<{ field: string; value: any; reason: string }>,
): InvoiceData {
  const fixed = { ...data };

  for (const fix of fixes) {
    const currentValue = (fixed as any)[fix.field];

    // Only apply fix if field is missing or invalid
    if (
      currentValue === null ||
      currentValue === undefined ||
      (typeof currentValue === "number" &&
        (Number.isNaN(currentValue) ||
          (currentValue === 0 && fix.field !== "total_amount")))
    ) {
      (fixed as any)[fix.field] = fix.value;
    }
  }

  return fixed;
}

/**
 * Apply suggested fixes to receipt data
 */
export function applyReceiptFixes(
  data: ReceiptData,
  fixes: Array<{ field: string; value: any; reason: string }>,
): ReceiptData {
  const fixed = { ...data };

  for (const fix of fixes) {
    const currentValue = (fixed as any)[fix.field];

    // Only apply fix if field is missing or invalid
    if (
      currentValue === null ||
      currentValue === undefined ||
      (typeof currentValue === "number" &&
        (Number.isNaN(currentValue) ||
          (currentValue === 0 && fix.field !== "total_amount")))
    ) {
      (fixed as any)[fix.field] = fix.value;
    }
  }

  return fixed;
}
