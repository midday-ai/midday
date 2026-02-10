import { z } from "zod/v4";

export const taxTypeSchema = z.enum([
  "vat",
  "sales_tax",
  "gst",
  "withholding_tax",
  "service_tax",
  "excise_tax",
  "reverse_charge",
  "custom_tax",
]);

export const documentTypeSchema = z.enum(["invoice", "receipt", "other"]);

export const invoiceSchema = z.object({
  document_type: documentTypeSchema.describe(
    "Classify this document type FIRST before extracting data:\n" +
      "- 'invoice': A bill requesting payment with amounts due, from vendor to customer\n" +
      "- 'receipt': Proof of completed purchase showing items and payment made\n" +
      "- 'other': Any non-financial document (contracts, agreements, newsletters, shipping notifications, confirmations without amounts, terms of service, correspondence)\n" +
      "If 'other', financial fields (amount, currency, etc.) may be left as null.",
  ),
  invoice_number: z
    .string()
    .nullable()
    .describe("Unique identifier for the invoice"),
  invoice_date: z
    .string()
    .nullable()
    .describe("Date of invoice in ISO 8601 format (YYYY-MM-DD)"),
  due_date: z
    .string()
    .nullable()
    .describe("Payment due date in ISO 8601 format (YYYY-MM-DD)"),
  currency: z
    .string()
    .nullable()
    .describe(
      "Three-letter ISO 4217 currency code (e.g., USD, EUR, SEK). Null if document_type is 'other'.",
    ),
  total_amount: z
    .number()
    .nullable()
    .describe(
      "Total amount for the invoice. Null if document_type is 'other'.",
    ),
  tax_amount: z.number().nullable().describe("Tax amount for the invoice"),
  tax_rate: z
    .number()
    .nullable()
    .describe("Tax rate as a percentage value (e.g., 20 for 20%)"),
  tax_type: taxTypeSchema
    .nullable()
    .describe(
      "The type of tax applied to the invoice, such as VAT, Sales Tax, GST, Withholding Tax, Service Tax, Excise Tax, Reverse Charge, or Custom Tax. This field should reflect the tax regime or system referenced on the invoice, and is important for correct accounting and compliance. If the document does not specify a tax type, infer it based on the country or context if possible.",
    ),
  vendor_name: z
    .string()
    .nullable()
    .describe(
      "The legal registered business name of the company issuing the invoice. Look for names that include entity types like 'Inc.', 'Ltd', 'AB', 'GmbH', 'LLC', etc. This name is typically found in the letterhead, header, or footer of the invoice. Do not extract brands, divisions, or 'Trading as' names unless no legal name is visible. If multiple company names appear, prioritize the one that appears to be issuing the invoice rather than subsidiaries or parent companies.",
    ),
  vendor_address: z
    .string()
    .nullable()
    .describe("Complete address of the vendor"),
  customer_name: z.string().nullable().describe("Name of the customer/buyer"),
  customer_address: z
    .string()
    .nullable()
    .describe("Complete address of the customer"),
  website: z
    .string()
    .nullable()
    .describe(
      "The root domain name of the vendor (e.g., 'example.com', not 'www.example.com' or 'shop.example.com'). If not explicitly mentioned in the document, infer it from the vendor's email address or search online using the Vendor Name. Prioritize the root domain.",
    ),
  email: z.string().nullable().describe("Email of the vendor/seller"),
  line_items: z
    .array(
      z.object({
        description: z.string().nullable().describe("Description of the item"),
        quantity: z.number().nullable().describe("Quantity of items"),
        unit_price: z.number().nullable().describe("Price per unit"),
        total_price: z
          .number()
          .nullable()
          .describe("Total price for this line item"),
      }),
    )
    .describe("Array of items listed in the document"),
  payment_instructions: z
    .string()
    .nullable()
    .describe("Payment terms or instructions"),
  notes: z.string().nullable().describe("Additional notes or comments"),
  language: z
    .string()
    .nullable()
    .describe(
      "The language of the document as a PostgreSQL text search configuration name (e.g., 'english', 'swedish', 'german', 'french')",
    ),
});

export const receiptSchema = z.object({
  document_type: documentTypeSchema.describe(
    "Classify this document type FIRST before extracting data:\n" +
      "- 'invoice': A bill requesting payment with amounts due, from vendor to customer\n" +
      "- 'receipt': Proof of completed purchase showing items and payment made\n" +
      "- 'other': Any non-financial document (contracts, agreements, newsletters, shipping notifications, confirmations without amounts, terms of service, correspondence)\n" +
      "If 'other', financial fields (amount, currency, etc.) may be left as null.",
  ),
  date: z
    .string()
    .nullable()
    .describe("Date of receipt in ISO 8601 format (YYYY-MM-DD)"),
  currency: z
    .string()
    .nullable()
    .describe(
      "Three-letter ISO 4217 currency code (e.g., USD, EUR, SEK). Null if document_type is 'other'.",
    ),
  total_amount: z
    .number()
    .nullable()
    .describe("Total amount including tax. Null if document_type is 'other'."),
  subtotal_amount: z.number().nullable().describe("Subtotal amount before tax"),
  tax_amount: z
    .number()
    .nullable()
    .describe("Tax amount. Null if document_type is 'other'."),
  tax_rate: z
    .number()
    .optional()
    .describe("Tax rate percentage (e.g., 20 for 20%)"),
  tax_type: taxTypeSchema
    .nullable()
    .describe(
      "The type of tax applied to the receipt, such as VAT, Sales Tax, GST, Withholding Tax, Service Tax, Excise Tax, Reverse Charge, or Custom Tax. This field should reflect the tax regime or system referenced on the receipt, and is important for correct accounting and compliance. If the document does not specify a tax type, infer it based on the country or context if possible.",
    ),
  store_name: z.string().nullable().describe("Name of the store/merchant"),
  website: z
    .string()
    .nullable()
    .describe(
      "Look for the store/merchant's website URL directly on the receipt (often found near the address, phone number, or logo). It typically ends in .com, .org, .net, etc. If no website URL is explicitly printed, try to infer it from the store name or domain name in an email address if present, but prioritize finding it directly on the receipt.",
    ),
  payment_method: z
    .string()
    .nullable()
    .describe("Method of payment (e.g., cash, credit card, debit card)"),
  items: z
    .array(
      z.object({
        description: z.string().nullable().describe("Description of the item"),
        quantity: z.number().nullable().describe("Quantity of items"),
        unit_price: z.number().nullable().describe("Price per unit"),
        total_price: z
          .number()
          .nullable()
          .describe("Total price for this item"),
        discount: z
          .number()
          .nullable()
          .describe("Discount amount applied to this item if any"),
      }),
    )
    .describe("Array of items purchased"),
  cashier_name: z.string().nullable().describe("Name or ID of the cashier"),
  email: z.string().nullable().describe("Email of the store/merchant"),
  register_number: z
    .string()
    .nullable()
    .describe("POS terminal or register number"),
  language: z
    .string()
    .nullable()
    .describe(
      "The language of the document as a PostgreSQL text search configuration name (e.g., 'english', 'swedish', 'german', 'french')",
    ),
});

export const documentClassifierSchema = z.object({
  title: z
    .string()
    .nullable()
    .describe(
      "A descriptive, meaningful title for this document that can be used as a filename. Include key identifying information like document number, company names, dates, or order numbers when available. Examples: 'Invoice INV-2024-001 from Acme Corp', 'Receipt from Starbucks Coffee - 2024-03-15', 'Service Agreement with Acme Corp - 2024-03-15'. Do NOT use generic names like 'Invoice', 'Receipt', or 'Document' - make it specific to this document.",
    ),
  summary: z
    .string()
    .nullable()
    .describe(
      "A brief, one-sentence summary of the document's main purpose or content.",
    ),
  tags: z
    .array(z.string())
    .max(5)
    .nullable()
    .describe(
      "Up to 5 relevant keywords or phrases for classifying and searching the document (e.g., 'Invoice', 'Acme Corp Contract', 'Marketing Report'). Prioritize document type, key names, and subject.",
    ),
  date: z
    .string()
    .nullable()
    .describe(
      "The single most relevant date found in the document (e.g., issue date, signing date) in ISO 8601 format (YYYY-MM-DD)",
    ),
  language: z
    .string()
    .nullable()
    .describe(
      "The language of the document as a PostgreSQL text search configuration name (e.g., 'english', 'swedish', 'german', 'french')",
    ),
});

export const imageClassifierSchema = z.object({
  title: z
    .string()
    .nullable()
    .describe(
      "A descriptive, meaningful title for this image that can be used as a filename. Include key identifying information like merchant/store names, dates, invoice numbers, or order numbers when visible. Examples: 'Receipt from Starbucks Coffee - 2024-03-15', 'Invoice INV-2024-001 from Acme Corp', 'Acme Corp Logo'. Do NOT use generic names like 'Receipt', 'Invoice', or 'Image' - make it specific to this document.",
    ),
  summary: z
    .string()
    .nullable()
    .describe(
      "A brief, one-sentence summary identifying key business-related visual elements in the image (e.g., Logo, Branding, Letterhead, Invoice Design, Product Photo, Marketing Material, Website Screenshot).",
    ),
  tags: z
    .array(z.string())
    .max(5)
    .nullable()
    .describe(
      "Up to 5 relevant keywords describing business-related visual content (e.g., 'Logo', 'Branding', 'Letterhead', 'Invoice Design', 'Product Photo', 'Marketing Material', 'Website Screenshot'). Prioritize brand elements and document types.",
    ),
  content: z.string().nullable().describe("The content of the document."),
  language: z
    .string()
    .nullable()
    .describe(
      "The language of the document as a PostgreSQL text search configuration name (e.g., 'english', 'swedish', 'german', 'french')",
    ),
  date: z
    .string()
    .nullable()
    .describe(
      "The single most relevant date found in the document (e.g., issue date, signing date) in ISO 8601 format (YYYY-MM-DD)",
    ),
});
