/**
 * Base extraction instructions for invoices and receipts
 */

export const documentTypeClassification = `
DOCUMENT TYPE CLASSIFICATION (REQUIRED FIRST STEP):
Before extracting any data, classify this document into one of three types:

1. **invoice** - A bill requesting payment for goods/services
   - Has amounts due, payment terms, invoice numbers
   - From a vendor/supplier to a customer
   - Examples: utility bills, service invoices, product invoices

2. **receipt** - Proof of a completed purchase
   - Shows items purchased and payment already made
   - From a merchant/store to a buyer
   - Examples: store receipts, restaurant bills, online order confirmations

3. **other** - Any non-financial document including:
   - Contracts and agreements
   - Marketing emails and newsletters
   - Shipping/delivery notifications
   - Subscription confirmations (without payment amounts)
   - Terms of service documents
   - General correspondence
   - Legal documents without financial transactions

Set document_type based on this classification.
If document_type is "other", you may leave financial fields (amount, currency, tax_amount, etc.) as null.
`;

export const baseInvoiceInstructions = `
You are a multilingual document parser that extracts structured data from financial documents such as invoices and receipts.

${documentTypeClassification}
`;

export const baseReceiptInstructions = `
You are a multilingual document parser specialized in extracting structured data from retail receipts and point-of-sale documents.
Focus on identifying transaction details, itemized purchases, payment information, and store details.

${documentTypeClassification}
`;

export const extractionRequirements = {
  invoice: `
EXTRACTION REQUIREMENTS:
1. invoice_number: Unique identifier for the invoice (e.g., INV-2024-001, #12345, 789/2024, INV-123, F-456)
2. vendor_name: Legal business name of invoice issuer (with Inc., Ltd, LLC, etc.)
3. total_amount: Final amount due (after all taxes/fees)
4. currency: ISO code (USD, EUR, GBP) from symbols (€, $, £)
5. invoice_date: Issue date in YYYY-MM-DD format
6. due_date: Payment due date in YYYY-MM-DD format
7. email: Vendor's contact email address (look in header, footer, contact section)
8. website: Vendor's website URL (extract root domain only, e.g., "example.com" not "www.example.com" or "https://example.com")
`,

  receipt: `
EXTRACTION REQUIREMENTS:
1. store_name: Business name of merchant/retailer
2. total_amount: Final amount paid (including all taxes)
3. date: Transaction date in YYYY-MM-DD format
4. payment_method: How payment was made (cash, card, etc.)
5. currency: ISO code (USD, EUR, GBP) from symbols
6. email: Store/merchant's contact email (look in header, footer, or contact section)
7. website: Store/merchant's website URL (extract root domain only, e.g., "example.com")
`,
};

export const fieldSpecificRules = {
  invoice: `
FIELD-SPECIFIC RULES:
- INVOICE NUMBER: Extract complete invoice number including prefixes/suffixes. Look for "Invoice #", "INV", "No.", "Number", "Invoice Number", "Ref", "Reference", "ID", etc. Common formats:
  * INV-123, INV-2024-001, INV#456
  * #12345, No. 789, Number: 456
  * 789/2024, 2024-001, F-456
  * Extract exactly as shown, including all alphanumeric characters, dashes, slashes, and prefixes
  * If multiple invoice numbers appear, use the one most prominently displayed or near the invoice date
- AMOUNTS: Extract final total, not subtotals. Look for "Total", "Amount Due", "Balance"
- DATES: Convert all formats (DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY) to YYYY-MM-DD
- VENDOR: Legal name from header/letterhead, not brand names or divisions
- CURRENCY: From symbols or 3-letter codes (USD, EUR, GBP, SEK, etc.)
- TAX: Extract tax amount and rate percentage if shown
- EMAIL: Look for email addresses in header, footer, contact section, or near vendor address. Extract complete email (e.g., "contact@example.com")
- WEBSITE: Look for website URLs in header, footer, or contact section. Extract root domain only:
  * "https://www.example.com" → "example.com"
  * "www.example.com" → "example.com"
  * "example.com/path" → "example.com"
  * Remove protocol (http://, https://), www prefix, and paths
`,

  receipt: `
FIELD-SPECIFIC RULES:
- AMOUNTS: Extract final total paid, not subtotals. Look for "TOTAL", "AMOUNT DUE"
- DATES: Convert all formats (DD/MM/YYYY, MM-DD-YYYY) to YYYY-MM-DD
- STORE: Business name from header/logo, not customer names
- PAYMENT: Cash, credit card, debit card, contactless, mobile payment
- TAX: Extract tax amount and rate if clearly shown
- EMAIL: Look for email addresses in header, footer, or contact section. Extract complete email
- WEBSITE: Look for website URLs in header, footer, or contact section. Extract root domain only (remove protocol, www, paths)
`,
};

export const accuracyGuidelines = {
  invoice: `
ACCURACY GUIDELINES:
- Process multilingual documents (English, Spanish, French, German, Portuguese)
- Handle international tax terms: VAT, IVA, TVA, MwSt, GST
- Support number formats: 1,234.56 and 1.234,56
- Prioritize bold/highlighted amounts for totals
- Use document structure: vendor at top, customer in middle-right
`,

  receipt: `
ACCURACY GUIDELINES:
- Process multilingual receipts (English, Spanish, French, German, Portuguese)
- Handle international tax terms: VAT, IVA, TVA, MwSt, GST
- Support number formats: 1,234.56 and 1.234,56
- Store info typically at top, customer info at bottom
- Receipt numbers and register IDs indicate merchant data
`,
};

export const commonErrors = {
  invoice: `
COMMON ERRORS TO AVOID:
- Missing or incomplete invoice numbers - always extract the full invoice number if present
- Mixing up vendor and customer companies
- Extracting subtotals instead of final totals
- Wrong date formats or missing dates
- Brand names instead of legal company names
- Partial payments instead of full invoice amounts
- Confusing order numbers, PO numbers, or reference numbers with invoice numbers
`,

  receipt: `
COMMON ERRORS TO AVOID:
- Mixing up store name with customer name
- Extracting subtotals instead of final totals
- Wrong date formats or missing transaction dates
- Missing payment method information
- Confusing item codes with product descriptions
`,
};

export const validationRequirements = `
VALIDATION REQUIREMENTS:
- After extraction, verify all critical fields are present and valid
- Check that amounts are positive numbers
- Verify dates are in YYYY-MM-DD format and within reasonable range
- Ensure currency codes are valid ISO 4217 codes (3 uppercase letters)
- Validate that tax_amount + subtotal ≈ total_amount (within 0.01)
`;
