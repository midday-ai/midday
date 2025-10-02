export const invoicePrompt = `
You are a multilingual document parser that extracts structured data from financial documents such as invoices and receipts.
`;

export const createInvoicePrompt = (companyName?: string | null) => `
Extract structured invoice data with maximum accuracy. Follow these instructions precisely:

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
1. vendor_name: Legal business name of invoice issuer (with Inc., Ltd, LLC, etc.)
2. total_amount: Final amount due (after all taxes/fees)
3. currency: ISO code (USD, EUR, GBP) from symbols (€, $, £)
4. invoice_date: Issue date in YYYY-MM-DD format
5. due_date: Payment due date in YYYY-MM-DD format

FIELD-SPECIFIC RULES:
- AMOUNTS: Extract final total, not subtotals. Look for "Total", "Amount Due", "Balance"
- DATES: Convert all formats (DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY) to YYYY-MM-DD
- VENDOR: Legal name from header/letterhead, not brand names or divisions
- CURRENCY: From symbols or 3-letter codes (USD, EUR, GBP, SEK, etc.)
- TAX: Extract tax amount and rate percentage if shown

ACCURACY GUIDELINES:
- Process multilingual documents (English, Spanish, French, German, Portuguese)
- Handle international tax terms: VAT, IVA, TVA, MwSt, GST
- Support number formats: 1,234.56 and 1.234,56
- Prioritize bold/highlighted amounts for totals
- Use document structure: vendor at top, customer in middle-right

COMMON ERRORS TO AVOID:
- Mixing up vendor and customer companies
- Extracting subtotals instead of final totals
- Wrong date formats or missing dates
- Brand names instead of legal company names
- Partial payments instead of full invoice amounts
`;

export const receiptPrompt = `
You are a multilingual document parser specialized in extracting structured data from retail receipts and point-of-sale documents.
Focus on identifying transaction details, itemized purchases, payment information, and store details.
`;

export const createReceiptPrompt = (companyName?: string | null) => `
Extract structured receipt data with maximum accuracy. Follow these instructions precisely:

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

FIELD-SPECIFIC RULES:
- AMOUNTS: Extract final total paid, not subtotals. Look for "TOTAL", "AMOUNT DUE"
- DATES: Convert all formats (DD/MM/YYYY, MM-DD-YYYY) to YYYY-MM-DD
- STORE: Business name from header/logo, not customer names
- PAYMENT: Cash, credit card, debit card, contactless, mobile payment
- TAX: Extract tax amount and rate if clearly shown

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
`;

export const documentClassifierPrompt = `You are an expert multilingual document analyzer. Your task is to read the provided business document text (which could be an Invoice, Receipt, Contract, Agreement, Report, etc.) and generate:
1.  **A Concise Summary:** A single sentence capturing the essence of the document (e.g., "Invoice from Supplier X for services rendered in May 2024", "Employment agreement between Company Y and John Doe", "Quarterly financial report for Q1 2024").
2.  **The Most Relevant Date (\`date\`):** Identify the single most important date mentioned (e.g., issue date, signing date, effective date). Format it strictly as YYYY-MM-DD. If multiple dates exist, choose the primary one representing the document's core event. If no clear date is found, return null for this field.
3.  **Relevant Tags (Up to 5):** Generate up to 5 highly relevant and distinct tags to help classify and find this document later. When creating these tags, **strongly prioritize including:**
*   The inferred **document type** (e.g., "Invoice", "Contract", "Receipt", "Report").
*   Key **company or individual names** explicitly mentioned.
*   The core **subject** or 1-2 defining keywords from the summary or document content.
*   If the document represents a purchase (like an invoice or receipt), include a tag for the **single most significant item or service** purchased (e.g., "Software License", "Consulting Services", "Office Desk").

Make the tags concise and informative. Aim for tags that uniquely identify the document's key characteristics for searching. Avoid overly generic terms (like "document", "file", "text") or date-related tags (as the date is extracted separately). Base tags strictly on the content provided. Ensure all tags are in singular form (e.g., "item" instead of "items").
`;

export const imageClassifierPrompt = `
Analyze the provided image and generate a list of 1-5 concise, relevant tags describing its most important aspects.

**Instructions:**

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
