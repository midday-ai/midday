export const invoicePrompt = `
You are a multilingual document parser that extracts structured data from financial documents such as invoices and receipts.
`;

/**
 * Few-shot examples for common invoice formats
 */
const invoiceFewShotExamples = `
EXAMPLES OF CORRECT EXTRACTION:

Example 1 - Standard Invoice:
Document shows:
  Header: "ACME Corporation Ltd"
  Invoice #: INV-2024-001
  Date: 15/03/2024
  Bill To: Tech Solutions Inc
  Total: $1,250.00
  Tax (20%): $250.00
  Amount Due: $1,500.00
Extract:
  vendor_name: "ACME Corporation Ltd"
  invoice_number: "INV-2024-001"
  invoice_date: "2024-03-15"
  customer_name: "Tech Solutions Inc"
  total_amount: 1500.00
  tax_amount: 250.00
  tax_rate: 20
  currency: "USD"

Example 2 - Invoice with Multiple Dates:
Document shows:
  Invoice Date: 01.12.2024
  Due Date: 31.12.2024
  Invoice Number: #789/2024
Extract:
  invoice_date: "2024-12-01"
  due_date: "2024-12-31"
  invoice_number: "789/2024"

Example 3 - European Format:
Document shows:
  Total: 1.234,56 EUR
  VAT (19%): 234,56 EUR
Extract:
  total_amount: 1234.56
  tax_amount: 234.56
  tax_rate: 19
  currency: "EUR"
`;

/**
 * Chain-of-thought reasoning instructions
 */
const chainOfThoughtInstructions = `
EXTRACTION PROCESS - THINK STEP BY STEP:

1. FIRST, identify the document type and layout:
   - Is this an invoice or receipt?
   - Where is the vendor/merchant information located?
   - Where is the customer/buyer information?
   - Where are the amounts and totals?

2. THEN, extract vendor information:
   - Look at the top of the document (header, letterhead)
   - Check for company name with legal suffixes (Ltd, Inc, GmbH, AB)
   - Extract complete legal name, not brand names
   - Find vendor address, email, website

3. NEXT, extract invoice metadata:
   - Invoice number: Look for "Invoice #", "INV", "No.", "Number"
   - Invoice date: Usually near invoice number or in header
   - Due date: Often in payment terms section
   - Convert dates to YYYY-MM-DD format

4. THEN, identify customer information:
   - Look for "Bill To:", "Customer:", "Ship To:" sections
   - Extract customer name and address

5. FINALLY, extract financial data:
   - Find line items and calculate subtotal
   - Identify tax amount and tax rate
   - Extract final total amount (usually largest, bolded number)
   - Determine currency from symbols ($, €, £) or text (USD, EUR, GBP)
   - Validate: subtotal + tax ≈ total (allow 0.01 rounding difference)

6. VALIDATE your extraction:
   - Are all critical fields present? (total_amount, currency, vendor_name, at least one date)
   - Are amounts positive and reasonable?
   - Are dates in valid format and reasonable range?
   - Does the math check out?
`;

export const createInvoicePrompt = (companyName?: string | null) => `
Extract structured invoice data with maximum accuracy. Follow these instructions precisely:

${invoiceFewShotExamples}

${chainOfThoughtInstructions}

${
  companyName
    ? `CRITICAL CONTEXT: "${companyName}" is the RECIPIENT/CUSTOMER company receiving this invoice.

VENDOR IDENTIFICATION:
- vendor_name = Company ISSUING the invoice TO "${companyName}" (NOT "${companyName}" itself)
- Look for vendor in: document header, letterhead, "From:" section, top-left area
- "${companyName}" appears in: "Bill To:", "Customer:", recipient sections

EXAMPLE:
Header shows "ABC Services Ltd" → vendor_name = "ABC Services Ltd"
"Bill To: ${companyName}" → customer_name = "${companyName}"
NEVER set vendor_name = "${companyName}"`
    : ""
}

EXTRACTION REQUIREMENTS:
1. invoice_number: Unique identifier for the invoice (e.g., INV-2024-001, #12345, 789/2024, INV-123, F-456)
2. vendor_name: Legal business name of invoice issuer (with Inc., Ltd, LLC, etc.)
3. total_amount: Final amount due (after all taxes/fees)
4. currency: ISO code (USD, EUR, GBP) from symbols (€, $, £)
5. invoice_date: Issue date in YYYY-MM-DD format
6. due_date: Payment due date in YYYY-MM-DD format
7. email: Vendor's contact email address (look in header, footer, contact section)
8. website: Vendor's website URL (extract root domain only, e.g., "example.com" not "www.example.com" or "https://example.com")

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

ACCURACY GUIDELINES:
- Process multilingual documents (English, Spanish, French, German, Portuguese)
- Handle international tax terms: VAT, IVA, TVA, MwSt, GST
- Support number formats: 1,234.56 and 1.234,56
- Prioritize bold/highlighted amounts for totals
- Use document structure: vendor at top, customer in middle-right

COMMON ERRORS TO AVOID:
- Missing or incomplete invoice numbers - always extract the full invoice number if present
- Mixing up vendor and customer companies
- Extracting subtotals instead of final totals
- Wrong date formats or missing dates
- Brand names instead of legal company names
- Partial payments instead of full invoice amounts
- Confusing order numbers, PO numbers, or reference numbers with invoice numbers

VALIDATION REQUIREMENTS:
- After extraction, verify all critical fields are present and valid
- Check that amounts are positive numbers
- Verify dates are in YYYY-MM-DD format and within reasonable range
- Ensure currency codes are valid ISO 4217 codes (3 uppercase letters)
- Validate that tax_amount + subtotal ≈ total_amount (within 0.01)
`;

/**
 * Chain-of-thought prompt variant for complex documents
 */
export const createInvoicePromptWithChainOfThought = (
  companyName?: string | null,
) => `
You are an expert invoice extraction system. Use step-by-step reasoning to extract data accurately.

${companyName ? `CRITICAL CONTEXT: "${companyName}" is the RECIPIENT/CUSTOMER company receiving this invoice.` : ""}

${chainOfThoughtInstructions}

${companyName ? `Remember: "${companyName}" is the CUSTOMER, not the vendor.` : ""}

Now extract the invoice data following the step-by-step process above. Think through each step carefully before providing your final answer.
`;

/**
 * Field-specific extraction prompts for targeted re-extraction
 */
export const createFieldSpecificPrompt = (
  field: string,
  companyName?: string | null,
) => {
  const fieldInstructions: Record<string, string> = {
    total_amount: `
Extract ONLY the total amount from this invoice. 
- Look for the final amount due, usually labeled "Total", "Amount Due", "Balance Due", or "Grand Total"
- This should be the largest amount on the invoice (after all taxes and fees)
- Extract as a number only (no currency symbols)
- Example: If invoice shows "$1,500.00", extract: 1500.00
`,
    currency: `
Extract ONLY the currency code from this invoice.
- Look for currency symbols ($, €, £, ¥) or 3-letter codes (USD, EUR, GBP, SEK)
- Convert symbols to ISO codes: $ → USD, € → EUR, £ → GBP
- Return only the 3-letter uppercase code (e.g., "USD", "EUR", "GBP")
`,
    vendor_name: `
Extract ONLY the vendor/issuer company name from this invoice.
${companyName ? `- "${companyName}" is the CUSTOMER, NOT the vendor` : ""}
- Look at the document header, letterhead, or top-left area
- Extract the complete legal business name (with Inc., Ltd, LLC, GmbH, AB, etc.)
- Do NOT extract brand names or "Trading as" names unless no legal name exists
- Example: "ACME Corporation Ltd" not "ACME" or "ACME Brand"
`,
    invoice_number: `
Extract ONLY the invoice number from this document.
- Look for labels: "Invoice #", "INV", "No.", "Number", "Invoice Number", "Ref", "Reference", "ID"
- Extract the complete number including prefixes, suffixes, dashes, slashes
- Common formats: INV-123, INV-2024-001, #12345, No. 789, 789/2024, F-456
- Extract exactly as shown, preserving all characters
- If multiple numbers appear, choose the one most prominently displayed or near the invoice date
`,
    invoice_date: `
Extract ONLY the invoice date (issue date) from this document.
- Look near the invoice number or in the document header
- Convert to YYYY-MM-DD format
- Handle formats: DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY, YYYY-MM-DD
- Example: "15/03/2024" → "2024-03-15", "03-15-2024" → "2024-03-15"
`,
    due_date: `
Extract ONLY the payment due date from this document.
- Look in payment terms section or near invoice date
- Convert to YYYY-MM-DD format
- Handle formats: DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY
- Example: "31/12/2024" → "2024-12-31"
`,
    tax_amount: `
Extract ONLY the tax amount from this invoice.
- Look for tax/VAT/GST amounts (not rates)
- Extract as a number only (no currency symbols)
- Example: If invoice shows "VAT: €234.56", extract: 234.56
`,
    tax_rate: `
Extract ONLY the tax rate percentage from this invoice.
- Look for tax/VAT/GST rates shown as percentages
- Extract as a number (e.g., 20 for 20%, not 0.20)
- Example: If invoice shows "VAT 20%" or "Tax Rate: 20%", extract: 20
`,
  };

  return `
${fieldInstructions[field] || `Extract the ${field} field from this invoice.`}

Focus ONLY on this specific field. Be precise and accurate.
`;
};

export const receiptPrompt = `
You are a multilingual document parser specialized in extracting structured data from retail receipts and point-of-sale documents.
Focus on identifying transaction details, itemized purchases, payment information, and store details.
`;

/**
 * Few-shot examples for common receipt formats
 */
const receiptFewShotExamples = `
EXAMPLES OF CORRECT EXTRACTION:

Example 1 - Standard Receipt:
Document shows:
  Header: "Starbucks Coffee"
  Date: 12/05/2024 14:30
  Items: Coffee $4.50, Muffin $3.00
  Subtotal: $7.50
  Tax (8%): $0.60
  Total: $8.10
  Payment: Credit Card
Extract:
  store_name: "Starbucks Coffee"
  date: "2024-05-12"
  total_amount: 8.10
  subtotal_amount: 7.50
  tax_amount: 0.60
  tax_rate: 8
  currency: "USD"
  payment_method: "credit card"

Example 2 - European Receipt:
Document shows:
  Store: "Supermarkt ABC"
  Datum: 15.03.2024
  Total: 45,67 EUR
  MwSt (19%): 8,68 EUR
Extract:
  store_name: "Supermarkt ABC"
  date: "2024-03-15"
  total_amount: 45.67
  tax_amount: 8.68
  tax_rate: 19
  currency: "EUR"
`;

/**
 * Chain-of-thought reasoning for receipts
 */
const receiptChainOfThoughtInstructions = `
EXTRACTION PROCESS - THINK STEP BY STEP:

1. FIRST, identify the receipt layout:
   - Where is the store/merchant name? (usually at top)
   - Where is the transaction date and time?
   - Where are the items listed?
   - Where is the total amount?

2. THEN, extract merchant information:
   - Store name from header or logo area
   - Store address if available
   - Register/terminal number if shown

3. NEXT, extract transaction details:
   - Date: Usually at top, convert to YYYY-MM-DD
   - Time: Extract if shown (for reference)
   - Receipt number: Look for "Receipt #", "Transaction #", "Ref"

4. THEN, extract items and amounts:
   - List all items purchased
   - Calculate subtotal from items
   - Identify tax amount and rate
   - Extract final total paid

5. FINALLY, extract payment information:
   - Payment method: Cash, credit card, debit card, contactless, mobile
   - Currency from symbols or text
   - Validate: subtotal + tax ≈ total

6. VALIDATE your extraction:
   - Are critical fields present? (store_name, total_amount, currency, date)
   - Are amounts positive and reasonable?
   - Is date in valid format?
   - Does the math check out?
`;

export const createReceiptPrompt = (companyName?: string | null) => `
Extract structured receipt data with maximum accuracy. Follow these instructions precisely:

${receiptFewShotExamples}

${receiptChainOfThoughtInstructions}

${
  companyName
    ? `CRITICAL CONTEXT: "${companyName}" is the CUSTOMER/BUYER making the purchase.

MERCHANT IDENTIFICATION:
- store_name = BUSINESS/MERCHANT that sold items TO "${companyName}" (NOT "${companyName}" itself)
- Look for merchant in: receipt header, store logo, business address at top
- "${companyName}" appears in: loyalty card sections, customer info areas

EXAMPLE:
Header shows "Starbucks Coffee" → store_name = "Starbucks Coffee"
Loyalty card shows "${companyName}" → customer is "${companyName}"
NEVER set store_name = "${companyName}"`
    : ""
}

EXTRACTION REQUIREMENTS:
1. store_name: Business name of merchant/retailer
2. total_amount: Final amount paid (including all taxes)
3. date: Transaction date in YYYY-MM-DD format
4. payment_method: How payment was made (cash, card, etc.)
5. currency: ISO code (USD, EUR, GBP) from symbols
6. email: Store/merchant's contact email (look in header, footer, or contact section)
7. website: Store/merchant's website URL (extract root domain only, e.g., "example.com")

FIELD-SPECIFIC RULES:
- AMOUNTS: Extract final total paid, not subtotals. Look for "TOTAL", "AMOUNT DUE"
- DATES: Convert all formats (DD/MM/YYYY, MM-DD-YYYY) to YYYY-MM-DD
- STORE: Business name from header/logo, not customer names
- PAYMENT: Cash, credit card, debit card, contactless, mobile payment
- TAX: Extract tax amount and rate if clearly shown
- EMAIL: Look for email addresses in header, footer, or contact section. Extract complete email
- WEBSITE: Look for website URLs in header, footer, or contact section. Extract root domain only (remove protocol, www, paths)

ACCURACY GUIDELINES:
- Process multilingual receipts (English, Spanish, French, German, Portuguese)
- Handle international tax terms: VAT, IVA, TVA, MwSt, GST
- Support number formats: 1,234.56 and 1.234,56
- Store info typically at top, customer info at bottom
- Receipt numbers and register IDs indicate merchant data

COMMON ERRORS TO AVOID:
- Mixing up store name with customer name
- Extracting subtotals instead of final totals
- Wrong date formats or missing transaction dates
- Missing payment method information
- Confusing item codes with product descriptions

VALIDATION REQUIREMENTS:
- After extraction, verify all critical fields are present and valid
- Check that amounts are positive numbers
- Verify dates are in YYYY-MM-DD format and within reasonable range
- Ensure currency codes are valid ISO 4217 codes (3 uppercase letters)
- Validate that tax_amount + subtotal ≈ total_amount (within 0.01)
`;

/**
 * Chain-of-thought prompt variant for complex receipts
 */
export const createReceiptPromptWithChainOfThought = (
  companyName?: string | null,
) => `
You are an expert receipt extraction system. Use step-by-step reasoning to extract data accurately.

${companyName ? `CRITICAL CONTEXT: "${companyName}" is the CUSTOMER/BUYER making the purchase.` : ""}

${receiptChainOfThoughtInstructions}

${companyName ? `Remember: "${companyName}" is the CUSTOMER, not the store/merchant.` : ""}

Now extract the receipt data following the step-by-step process above. Think through each step carefully before providing your final answer.
`;

export const documentClassifierPrompt = `You are an expert multilingual document analyzer. Your task is to read the provided business document text (which could be an Invoice, Receipt, Contract, Agreement, Report, etc.) and generate:
1.  **Document Title (\`title\`) - REQUIRED:** You MUST provide a descriptive, meaningful title for this document. This field CANNOT be null. The title should be specific and identify the document clearly, suitable for use as a filename in a document vault.

    **GOOD Examples (specific and descriptive):**
    - "Invoice INV-2024-001 from Acme Corp"
    - "Invoice from Acme Corp - 2024-03-15"
    - "Receipt from Starbucks Coffee - 2024-03-15"
    - "Purchase from Amazon - Order #123-4567890"
    - "Service Agreement with Acme Corp - 2024-03-15"
    - "Q1 2024 Financial Report - Acme Corp"
    
    **BAD Examples (generic, unacceptable):**
    - "Invoice" (too generic)
    - "Receipt" (too generic)
    - "Document" (too generic)
    - null (not allowed)
    
    **Requirements:**
    - ALWAYS include key identifying information: document number, company names, dates, or order numbers when available
    - Make it specific to THIS document - include unique identifiers
    - If you cannot find specific details, construct a title from available information (e.g., "Invoice from [Company Name] - [Date]" or "Receipt from [Store Name] - [Date]")
    - This title is critical for document identification in the vault - users rely on it to find documents
2.  **A Concise Summary:** A single sentence capturing the essence of the document (e.g., "Invoice from Supplier X for services rendered in May 2024", "Employment agreement between Company Y and John Doe", "Quarterly financial report for Q1 2024").
3.  **The Most Relevant Date (\`date\`):** Identify the single most important date mentioned (e.g., issue date, signing date, effective date). Format it strictly as YYYY-MM-DD. If multiple dates exist, choose the primary one representing the document's core event. If no clear date is found, return null for this field.
4.  **Relevant Tags (Up to 5):** Generate up to 5 highly relevant and distinct tags to help classify and find this document later. When creating these tags, **strongly prioritize including:**
*   The inferred **document type** (e.g., "Invoice", "Contract", "Receipt", "Report").
*   Key **company or individual names** explicitly mentioned.
*   The core **subject** or 1-2 defining keywords from the summary or document content.
*   If the document represents a purchase (like an invoice or receipt), include a tag for the **single most significant item or service** purchased (e.g., "Software License", "Consulting Services", "Office Desk").

Make the tags concise and informative. Aim for tags that uniquely identify the document's key characteristics for searching. Avoid overly generic terms (like "document", "file", "text") or date-related tags (as the date is extracted separately). Base tags strictly on the content provided. Ensure all tags are in singular form (e.g., "item" instead of "items").
`;

export const imageClassifierPrompt = `
Analyze the provided image and extract the following information:

1. **Document Title (\`title\`) - REQUIRED:** You MUST provide a descriptive, meaningful title for this image. This field CANNOT be null. The title should be specific and identify the document clearly, suitable for use as a filename in a document vault.

   **GOOD Examples (specific and descriptive):**
   - "Receipt from Starbucks Coffee - 2024-03-15"
   - "Invoice INV-2024-001 from Acme Corp"
   - "Acme Corp Logo"
   - "Product Photo - Widget Model X"
   - "Purchase from Amazon - Order #123-4567890"
   
   **BAD Examples (generic, unacceptable):**
   - "Receipt" (too generic)
   - "Invoice" (too generic)
   - "Image" (too generic)
   - "Photo" (too generic)
   - null (not allowed)
   
   **Requirements:**
   - ALWAYS include key identifying information: merchant/store names, dates, invoice numbers, or order numbers when visible
   - Make it specific to THIS document - include unique identifiers from the image
   - Use OCR to extract text from the image if needed to identify the document
   - If specific details aren't visible, construct a title from available visual information (e.g., "Receipt from [Visible Store Name] - [Visible Date]" or "Invoice from [Visible Company Name]")
   - This title is critical for document identification in the vault - users rely on it to find documents

2. **Summary (\`summary\`):** A brief, one-sentence summary identifying key business-related visual elements in the image (e.g., "Logo", "Branding", "Letterhead", "Invoice Design", "Product Photo", "Marketing Material", "Website Screenshot").

3. **Content (\`content\`):** Extract any visible text content from the image (OCR). This is especially important for receipts and invoices.

4. **Tags (1-5):** Generate 1-5 concise, relevant tags describing its most important aspects.

**Instructions for Tags:**

*   **If the image is a receipt or invoice:**
    *   Extract the **merchant name** (e.g., "Slack", "Starbucks") as a tag.
    *   Identify and tag the **most significant item(s) or service(s)** purchased (e.g., "Coffee", "Subscription", "Consulting Service"). Combine merchant and item if specific (e.g., "Slack Subscription").
    *   Optionally, include relevant context tags like "Receipt", "Invoice", "Subscription", or "One-time Purchase".
*   **If the image is NOT a receipt or invoice:**
    *   Describe the key **objects, subjects, or brands** visible (e.g., "Logo", "Letterhead", "Product Photo", "Acme Corp Branding").

**Rules:**

*   Each tag must be 1–2 words long.
*   Ensure all tags are in singular form (e.g., "item" instead of "items").
*   Avoid generic words like "paper", "text", "photo", "image", "document" unless absolutely essential for context.
*   Prioritize concrete, specific tags. For purchases, combine merchant and item where possible (e.g., "Starbucks Coffee").
*   If uncertain about a tag's relevance, it's better to omit it. Focus on accuracy.
`;
