import type { z } from "zod/v4";
import type { invoiceSchema, receiptSchema } from "../schema";

type InvoiceData = z.infer<typeof invoiceSchema>;
type ReceiptData = z.infer<typeof receiptSchema>;

export interface DocumentFormat {
  numberFormat: "us" | "european"; // 1,234.56 vs 1.234,56
  dateFormat: "us" | "european" | "iso"; // MM/DD/YYYY vs DD/MM/YYYY vs YYYY-MM-DD
  language: string | null;
  currency: string | null;
  taxTerm: "vat" | "sales_tax" | "gst" | "unknown";
}

/**
 * Detect document format from extracted data
 */
export function detectInvoiceFormat(data: InvoiceData): DocumentFormat {
  const format: DocumentFormat = {
    numberFormat: "us",
    dateFormat: "iso",
    language: data.language,
    currency: data.currency,
    taxTerm: "unknown",
  };

  // Detect number format from amounts
  // This is tricky without seeing the original document, but we can infer from context
  // European formats often use comma as decimal separator
  // We'll default to US format unless we have strong indicators

  // Detect date format from invoice_date
  if (data.invoice_date) {
    const dateParts = data.invoice_date.split("-");
    if (dateParts.length === 3) {
      // We always normalize to ISO format, so dateFormat detection is based on language/currency
      format.dateFormat = "iso";
    }
  }

  // Detect tax term from tax_type
  if (data.tax_type) {
    // Map tax types to our format categories
    if (
      data.tax_type === "vat" ||
      data.tax_type === "sales_tax" ||
      data.tax_type === "gst"
    ) {
      format.taxTerm = data.tax_type;
    } else {
      format.taxTerm = "unknown";
    }
  } else {
    // Infer from currency/language
    if (
      data.currency === "EUR" ||
      data.language === "german" ||
      data.language === "french"
    ) {
      format.taxTerm = "vat";
    } else if (data.currency === "USD" || data.currency === "CAD") {
      format.taxTerm = "sales_tax";
    } else if (data.currency === "AUD" || data.currency === "NZD") {
      format.taxTerm = "gst";
    }
  }

  // Detect number format from currency
  // European currencies often use European number format
  const europeanCurrenciesReceipt = ["EUR", "SEK", "DKK", "NOK", "PLN", "CZK"];
  if (data.currency && europeanCurrenciesReceipt.includes(data.currency)) {
    format.numberFormat = "european";
  }

  // Detect date format from language
  // European languages often use DD/MM/YYYY
  const europeanLanguages = [
    "german",
    "french",
    "spanish",
    "italian",
    "portuguese",
    "swedish",
    "danish",
    "norwegian",
  ];
  if (data.language && europeanLanguages.includes(data.language)) {
    format.dateFormat = "european";
  }

  return format;
}

/**
 * Detect document format from extracted receipt data
 */
export function detectReceiptFormat(data: ReceiptData): DocumentFormat {
  const format: DocumentFormat = {
    numberFormat: "us",
    dateFormat: "iso",
    language: data.language,
    currency: data.currency,
    taxTerm: "unknown",
  };

  // Detect tax term from tax_type
  if (data.tax_type) {
    // Map tax types to our format categories
    if (
      data.tax_type === "vat" ||
      data.tax_type === "sales_tax" ||
      data.tax_type === "gst"
    ) {
      format.taxTerm = data.tax_type;
    } else {
      format.taxTerm = "unknown";
    }
  } else {
    // Infer from currency/language
    if (
      data.currency === "EUR" ||
      data.language === "german" ||
      data.language === "french"
    ) {
      format.taxTerm = "vat";
    } else if (data.currency === "USD" || data.currency === "CAD") {
      format.taxTerm = "sales_tax";
    } else if (data.currency === "AUD" || data.currency === "NZD") {
      format.taxTerm = "gst";
    }
  }

  // Detect number format from currency
  const europeanCurrenciesReceipt = ["EUR", "SEK", "DKK", "NOK", "PLN", "CZK"];
  if (data.currency && europeanCurrenciesReceipt.includes(data.currency)) {
    format.numberFormat = "european";
  }

  // Detect date format from language
  const europeanLanguages = [
    "german",
    "french",
    "spanish",
    "italian",
    "portuguese",
    "swedish",
    "danish",
    "norwegian",
  ];
  if (data.language && europeanLanguages.includes(data.language)) {
    format.dateFormat = "european";
  }

  return format;
}

/**
 * Get format-specific prompt hints
 */
export function getFormatSpecificHints(format: DocumentFormat): string {
  const hints: string[] = [];

  if (format.numberFormat === "european") {
    hints.push(
      "NUMBER FORMAT: This document uses European number format (1.234,56). Use comma as decimal separator and period as thousands separator.",
    );
  }

  if (format.dateFormat === "european") {
    hints.push(
      "DATE FORMAT: This document likely uses European date format (DD/MM/YYYY). Convert to YYYY-MM-DD.",
    );
  }

  if (format.taxTerm === "vat") {
    hints.push(
      "TAX TERM: This document uses VAT (Value Added Tax). Look for 'VAT', 'MwSt', 'TVA', 'IVA' labels.",
    );
  } else if (format.taxTerm === "sales_tax") {
    hints.push(
      "TAX TERM: This document uses Sales Tax. Look for 'Sales Tax', 'Tax' labels.",
    );
  } else if (format.taxTerm === "gst") {
    hints.push(
      "TAX TERM: This document uses GST (Goods and Services Tax). Look for 'GST' labels.",
    );
  }

  return hints.join("\n");
}
