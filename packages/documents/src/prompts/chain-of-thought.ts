/**
 * Chain-of-thought reasoning instructions for document extraction
 */

export const chainOfThoughtInstructions = `
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

export const receiptChainOfThoughtInstructions = `
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
