/**
 * Field-specific extraction prompts for targeted re-extraction
 */

export const fieldSpecificInstructions: Record<
  string,
  (companyName?: string | null) => string
> = {
  total_amount: () => `
Extract ONLY the total amount from this invoice. 
- Look for the final amount due, usually labeled "Total", "Amount Due", "Balance Due", or "Grand Total"
- This should be the largest amount on the invoice (after all taxes and fees)
- Extract as a number only (no currency symbols)
- Example: If invoice shows "$1,500.00", extract: 1500.00
`,

  currency: () => `
Extract ONLY the currency code from this invoice.
- Look for currency symbols ($, €, £, ¥) or 3-letter codes (USD, EUR, GBP, SEK)
- Convert symbols to ISO codes: $ → USD, € → EUR, £ → GBP
- Return only the 3-letter uppercase code (e.g., "USD", "EUR", "GBP")
`,

  vendor_name: (companyName) => `
Extract ONLY the vendor/issuer company name from this invoice.
${companyName ? `- "${companyName}" is the CUSTOMER, NOT the vendor` : ""}
- Look at the document header, letterhead, or top-left area
- Extract the complete legal business name (with Inc., Ltd, LLC, GmbH, AB, etc.)
- Do NOT extract brand names or "Trading as" names unless no legal name exists
- Example: "ACME Corporation Ltd" not "ACME" or "ACME Brand"
`,

  invoice_number: () => `
Extract ONLY the invoice number from this document.
- Look for labels: "Invoice #", "INV", "No.", "Number", "Invoice Number", "Ref", "Reference", "ID"
- Extract the complete number including prefixes, suffixes, dashes, slashes
- Common formats: INV-123, INV-2024-001, #12345, No. 789, 789/2024, F-456
- Extract exactly as shown, preserving all characters
- If multiple numbers appear, choose the one most prominently displayed or near the invoice date
`,

  invoice_date: () => `
Extract ONLY the invoice date (issue date) from this document.
- Look near the invoice number or in the document header
- Convert to YYYY-MM-DD format
- Handle formats: DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY, YYYY-MM-DD
- Example: "15/03/2024" → "2024-03-15", "03-15-2024" → "2024-03-15"
`,

  due_date: () => `
Extract ONLY the payment due date from this document.
- Look in payment terms section or near invoice date
- Convert to YYYY-MM-DD format
- Handle formats: DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY
- Example: "31/12/2024" → "2024-12-31"
`,

  tax_amount: () => `
Extract ONLY the tax amount from this invoice.
- Look for tax/VAT/GST amounts (not rates)
- Extract as a number only (no currency symbols)
- Example: If invoice shows "VAT: €234.56", extract: 234.56
`,

  tax_rate: () => `
Extract ONLY the tax rate percentage from this invoice.
- Look for tax/VAT/GST rates shown as percentages
- Extract as a number (e.g., 20 for 20%, not 0.20)
- Example: If invoice shows "VAT 20%" or "Tax Rate: 20%", extract: 20
`,

  store_name: (companyName) => `
Extract ONLY the store/merchant name from this receipt.
${companyName ? `- "${companyName}" is the CUSTOMER, NOT the store` : ""}
- Look at the receipt header, logo area, or top section
- Extract the complete business name
- Example: "Starbucks Coffee" not "Starbucks" or "SBUX"
`,

  date: () => `
Extract ONLY the transaction date from this receipt.
- Look at the top of the receipt, usually near the store name
- Convert to YYYY-MM-DD format
- Handle formats: DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY
- Example: "12/05/2024" → "2024-05-12"
`,
};

/**
 * Create a field-specific prompt for targeted re-extraction
 */
export function createFieldSpecificPrompt(
  field: string,
  documentType: "invoice" | "receipt",
  companyName?: string | null,
): string {
  const instruction = fieldSpecificInstructions[field]?.(companyName);

  if (!instruction) {
    return `Extract the ${field} field from this ${documentType}. Focus ONLY on this specific field. Be precise and accurate.`;
  }

  return `
${instruction}

Focus ONLY on this specific field. Be precise and accurate.
`;
}
