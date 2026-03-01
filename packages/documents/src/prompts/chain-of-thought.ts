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
