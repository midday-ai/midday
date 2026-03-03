/**
 * Few-shot examples for invoice and receipt extraction
 */

export const invoiceFewShotExamples = `
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
