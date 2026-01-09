import { parseISO } from "date-fns";
import type { z } from "zod/v4";
import type { invoiceSchema, receiptSchema } from "../schema";
import {
  calculateQualityScore,
  calculateReceiptQualityScore,
} from "./validation";

type InvoiceData = z.infer<typeof invoiceSchema>;
type ReceiptData = z.infer<typeof receiptSchema>;

/**
 * Calculate confidence score for extraction result (0-1)
 * Based on quality score and field completeness
 */
export function calculateExtractionConfidence(
  result: InvoiceData,
  qualityScore: { score: number; missingCriticalFields: string[] },
): number {
  // Base confidence from quality score (0-100 -> 0-1)
  let confidence = qualityScore.score / 100;

  // Boost confidence if all critical fields are present
  if (qualityScore.missingCriticalFields.length === 0) {
    confidence = Math.min(1.0, confidence + 0.1);
  }

  // Reduce confidence for missing critical fields
  confidence -= qualityScore.missingCriticalFields.length * 0.05;

  // Boost confidence if vendor_name is present and looks complete
  if (result.vendor_name && result.vendor_name.length > 5) {
    confidence = Math.min(1.0, confidence + 0.05);
  }

  // Boost confidence if invoice_number is present
  if (result.invoice_number) {
    confidence = Math.min(1.0, confidence + 0.05);
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Calculate confidence score for receipt extraction result
 */
export function calculateReceiptExtractionConfidence(
  result: ReceiptData,
  qualityScore: { score: number; missingCriticalFields: string[] },
): number {
  // Base confidence from quality score (0-100 -> 0-1)
  let confidence = qualityScore.score / 100;

  // Boost confidence if all critical fields are present
  if (qualityScore.missingCriticalFields.length === 0) {
    confidence = Math.min(1.0, confidence + 0.1);
  }

  // Reduce confidence for missing critical fields
  confidence -= qualityScore.missingCriticalFields.length * 0.05;

  // Boost confidence if store_name is present and looks complete
  if (result.store_name && result.store_name.length > 3) {
    confidence = Math.min(1.0, confidence + 0.05);
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Field-specific merge rules for invoices
 */
const invoiceMergeRules: Record<string, (primary: any, secondary: any) => any> =
  {
    // Prefer longer vendor names (more complete)
    vendor_name: (primary, secondary) => {
      if (!primary && !secondary) return null;
      if (!primary) return secondary;
      if (!secondary) return primary;
      // Prefer the longer name (more likely to be complete)
      return primary.length >= secondary.length ? primary : secondary;
    },

    // Prefer more complete invoice numbers (with prefixes/suffixes)
    invoice_number: (primary, secondary) => {
      if (!primary && !secondary) return null;
      if (!primary) return secondary;
      if (!secondary) return primary;
      // Prefer the longer invoice number (more likely to be complete)
      return primary.length >= secondary.length ? primary : secondary;
    },

    // Prefer non-null values, but if both exist, prefer primary
    total_amount: (primary, secondary) => {
      if (primary !== null && primary !== undefined) return primary;
      return secondary !== null && secondary !== undefined ? secondary : 0;
    },

    // Prefer non-null currency, default to USD if both missing
    currency: (primary, secondary) => {
      if (primary && primary !== "USD") return primary;
      if (secondary && secondary !== "USD") return secondary;
      return primary || secondary || "USD";
    },

    // Prefer more recent dates
    invoice_date: (primary, secondary) => {
      if (!primary && !secondary) return null;
      if (!primary) return secondary;
      if (!secondary) return primary;
      // If both exist, prefer the one that's more recent (likely more accurate)
      const primaryDate = parseISO(primary);
      const secondaryDate = parseISO(secondary);
      return primaryDate >= secondaryDate ? primary : secondary;
    },

    // Prefer non-null email
    email: (primary, secondary) => {
      if (!primary && !secondary) return null;
      if (!primary) return secondary;
      if (!secondary) return primary;
      // Prefer email with @ symbol (more likely to be valid)
      if (primary.includes("@") && !secondary.includes("@")) return primary;
      if (secondary.includes("@") && !primary.includes("@")) return secondary;
      return primary;
    },

    // Prefer non-null website
    website: (primary, secondary) => {
      if (!primary && !secondary) return null;
      if (!primary) return secondary;
      if (!secondary) return primary;
      // Prefer website without www (cleaner)
      const primaryClean = primary.replace(/^www\./, "");
      const secondaryClean = secondary.replace(/^www\./, "");
      return primaryClean.length <= secondaryClean.length ? primary : secondary;
    },
  };

/**
 * Field-specific merge rules for receipts
 */
const receiptMergeRules: Record<string, (primary: any, secondary: any) => any> =
  {
    // Prefer longer store names (more complete)
    store_name: (primary, secondary) => {
      if (!primary && !secondary) return null;
      if (!primary) return secondary;
      if (!secondary) return primary;
      return primary.length >= secondary.length ? primary : secondary;
    },

    // Prefer non-null total amount
    total_amount: (primary, secondary) => {
      if (primary !== null && primary !== undefined) return primary;
      return secondary !== null && secondary !== undefined ? secondary : 0;
    },

    // Prefer non-null currency, default to USD if both missing
    currency: (primary, secondary) => {
      if (primary && primary !== "USD") return primary;
      if (secondary && secondary !== "USD") return secondary;
      return primary || secondary || "USD";
    },

    // Prefer more recent dates
    date: (primary, secondary) => {
      if (!primary && !secondary) return null;
      if (!primary) return secondary;
      if (!secondary) return primary;
      const primaryDate = parseISO(primary);
      const secondaryDate = parseISO(secondary);
      return primaryDate >= secondaryDate ? primary : secondary;
    },
  };

/**
 * Enhanced merge for invoices with field-specific rules and confidence weighting
 */
export function mergeInvoiceResults(
  primary: InvoiceData,
  secondary: Partial<InvoiceData>,
  primaryConfidence?: number,
  secondaryConfidence?: number,
): InvoiceData {
  const merged: any = { ...primary };

  // Calculate confidence scores if not provided
  const primaryConf =
    primaryConfidence ??
    calculateExtractionConfidence(primary, calculateQualityScore(primary));
  const secondaryConf =
    secondaryConfidence ??
    ((secondary as InvoiceData)
      ? calculateExtractionConfidence(
          secondary as InvoiceData,
          calculateQualityScore(secondary as InvoiceData),
        )
      : 0.5);

  for (const [field, secondaryValue] of Object.entries(secondary)) {
    if (secondaryValue === null || secondaryValue === undefined) {
      continue; // Skip null/undefined values
    }

    const primaryValue = (primary as any)[field];

    // Use confidence-weighted merging if both values exist
    if (
      primaryValue !== null &&
      primaryValue !== undefined &&
      secondaryValue !== null &&
      secondaryValue !== undefined
    ) {
      // If confidences are similar (within 0.1), use field-specific rules
      if (Math.abs(primaryConf - secondaryConf) < 0.1) {
        if (invoiceMergeRules[field]) {
          merged[field] = invoiceMergeRules[field](
            primaryValue,
            secondaryValue,
          );
        } else {
          // Prefer primary if confidences are similar
          merged[field] = primaryValue;
        }
      } else {
        // Use higher confidence value
        merged[field] =
          primaryConf >= secondaryConf ? primaryValue : secondaryValue;
      }
    } else {
      // One value is missing - use the one that exists
      merged[field] = primaryValue ?? secondaryValue;
    }
  }

  return merged as InvoiceData;
}

/**
 * Enhanced merge for receipts with field-specific rules and confidence weighting
 */
export function mergeReceiptResults(
  primary: ReceiptData,
  secondary: Partial<ReceiptData>,
  primaryConfidence?: number,
  secondaryConfidence?: number,
): ReceiptData {
  const merged: any = { ...primary };

  // Calculate confidence scores if not provided
  const primaryConf =
    primaryConfidence ??
    calculateReceiptExtractionConfidence(
      primary,
      calculateReceiptQualityScore(primary),
    );
  const secondaryConf =
    secondaryConfidence ??
    ((secondary as ReceiptData)
      ? calculateReceiptExtractionConfidence(
          secondary as ReceiptData,
          calculateReceiptQualityScore(secondary as ReceiptData),
        )
      : 0.5);

  for (const [field, secondaryValue] of Object.entries(secondary)) {
    if (secondaryValue === null || secondaryValue === undefined) {
      continue;
    }

    const primaryValue = (primary as any)[field];

    // Use confidence-weighted merging if both values exist
    if (
      primaryValue !== null &&
      primaryValue !== undefined &&
      secondaryValue !== null &&
      secondaryValue !== undefined
    ) {
      // If confidences are similar (within 0.1), use field-specific rules
      if (Math.abs(primaryConf - secondaryConf) < 0.1) {
        if (receiptMergeRules[field]) {
          merged[field] = receiptMergeRules[field](
            primaryValue,
            secondaryValue,
          );
        } else {
          // Prefer primary if confidences are similar
          merged[field] = primaryValue;
        }
      } else {
        // Use higher confidence value
        merged[field] =
          primaryConf >= secondaryConf ? primaryValue : secondaryValue;
      }
    } else {
      // One value is missing - use the one that exists
      merged[field] = primaryValue ?? secondaryValue;
    }
  }

  return merged as ReceiptData;
}
