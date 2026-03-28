import { z } from "zod";

// ============================================================
// Shared sub-schemas (reused across entities)
// ============================================================

const mcpTagSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
});

const mcpAssignedUserSchema = z.object({
  id: z.string(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

const mcpConnectionSchema = z.object({
  name: z.string(),
  logoUrl: z.string().nullable(),
});

const mcpAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  connection: mcpConnectionSchema.nullable(),
});

const mcpAttachmentSchema = z.object({
  id: z.string(),
  filename: z.string().nullable(),
  type: z.string(),
  size: z.number(),
});

const mcpCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  slug: z.string(),
});

// ============================================================
// Transaction schemas
// ============================================================

export const mcpTransactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  amount: z.number(),
  currency: z.string(),
  baseAmount: z.number().nullable().optional(),
  baseCurrency: z.string().nullable().optional(),
  method: z.string().nullable().optional(),
  status: z.string(),
  note: z.string().nullable().optional(),
  manual: z.boolean().nullable().optional(),
  internal: z.boolean().nullable().optional(),
  recurring: z.boolean().nullable().optional(),
  counterpartyName: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  isFulfilled: z.boolean().optional(),
  taxRate: z.number().nullable().optional(),
  taxType: z.string().nullable().optional(),
  taxAmount: z.number().nullable().optional(),
  assigned: mcpAssignedUserSchema.nullable().optional(),
  category: mcpCategorySchema.nullable().optional(),
  account: mcpAccountSchema.nullable().optional(),
  tags: z.array(mcpTagSchema).nullable().optional(),
  attachments: z.array(mcpAttachmentSchema).nullable().optional(),
});

export const mcpTransactionDetailSchema = mcpTransactionSchema.extend({
  hasPendingSuggestion: z.boolean().optional(),
  suggestion: z
    .object({
      suggestionId: z.string(),
      documentName: z.string().nullable(),
      documentAmount: z.number().nullable(),
      documentCurrency: z.string().nullable(),
      confidenceScore: z.number().nullable(),
    })
    .nullable()
    .optional(),
});

// ============================================================
// Invoice schemas
// ============================================================

const mcpInvoiceCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().nullable().optional(),
  email: z.string().optional(),
});

const mcpInvoiceRecurringSchema = z.object({
  id: z.string(),
  status: z.string(),
  frequency: z.string(),
  frequencyInterval: z.number().nullable().optional(),
});

export const mcpInvoiceListItemSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  status: z.string(),
  dueDate: z.string().nullable().optional(),
  issueDate: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  sentAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  sentTo: z.string().nullable().optional(),
  discount: z.number().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  vat: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  lineItems: z.any().nullable().optional(),
  recurringSequence: z.number().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  previewUrl: z.string().nullable().optional(),
  customer: mcpInvoiceCustomerSchema.nullable().optional(),
  recurring: mcpInvoiceRecurringSchema.nullable().optional(),
});

export const mcpInvoiceDetailSchema = mcpInvoiceListItemSchema.extend({
  paymentDetails: z.any().nullable().optional(),
  customerDetails: z.any().nullable().optional(),
  fromDetails: z.any().nullable().optional(),
  noteDetails: z.any().nullable().optional(),
  topBlock: z.any().nullable().optional(),
  bottomBlock: z.any().nullable().optional(),
  template: z.any().nullable().optional(),
  refundedAt: z.string().nullable().optional(),
});

// ============================================================
// Customer schemas
// ============================================================

export const mcpCustomerListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  isArchived: z.boolean().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  invoiceCount: z.number().optional(),
  projectCount: z.number().optional(),
  totalRevenue: z.number().optional(),
  outstandingAmount: z.number().optional(),
  lastInvoiceDate: z.string().nullable().optional(),
  invoiceCurrency: z.string().nullable().optional(),
  tags: z.array(mcpTagSchema).optional(),
});

export const mcpCustomerDetailSchema = mcpCustomerListItemSchema.extend({
  billingEmail: z.string().nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  vatNumber: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  preferredCurrency: z.string().nullable().optional(),
  defaultPaymentTerms: z.number().nullable().optional(),
});

// ============================================================
// Bank account schema
// ============================================================

export const mcpBankAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  subtype: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  manual: z.boolean().nullable().optional(),
  balance: z.number().nullable().optional(),
  baseCurrency: z.string().nullable().optional(),
  baseBalance: z.number().nullable().optional(),
  availableBalance: z.number().nullable().optional(),
  creditLimit: z.number().nullable().optional(),
  connection: mcpConnectionSchema.nullable().optional(),
});

// ============================================================
// Tracker schemas
// ============================================================

const mcpTrackerCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().nullable().optional(),
});

export const mcpTrackerProjectSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  estimate: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  rate: z.number().nullable().optional(),
  billable: z.boolean().nullable().optional(),
  totalDuration: z.number().nullable().optional(),
  totalAmount: z.number().nullable().optional(),
  customer: mcpTrackerCustomerSchema.nullable().optional(),
  tags: z.array(mcpTagSchema).nullable().optional(),
  users: z.array(mcpAssignedUserSchema).nullable().optional(),
});

export const mcpTrackerEntrySchema = z.object({
  id: z.string(),
  date: z.string().nullable().optional(),
  start: z.string().nullable().optional(),
  stop: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  rate: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  billed: z.boolean().nullable().optional(),
  project: z
    .object({ id: z.string(), name: z.string().nullable() })
    .nullable()
    .optional(),
  user: mcpAssignedUserSchema.nullable().optional(),
});

// ============================================================
// Document schema
// ============================================================

export const mcpDocumentSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
  pathTokens: z.array(z.string()).nullable().optional(),
  processingStatus: z.string().nullable().optional(),
  tags: z.array(mcpTagSchema).nullable().optional(),
  fileUrl: z.string().nullable().optional(),
});

// ============================================================
// Inbox schemas
// ============================================================

export const mcpInboxItemSchema = z.object({
  id: z.string(),
  fileName: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  senderEmail: z.string().nullable().optional(),
  taxAmount: z.number().nullable().optional(),
  taxRate: z.number().nullable().optional(),
  taxType: z.string().nullable().optional(),
  relatedCount: z.number().nullable().optional(),
  inboxAccount: z
    .object({ provider: z.string().nullable() })
    .nullable()
    .optional(),
  transaction: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      amount: z.number().nullable(),
      currency: z.string().nullable(),
      date: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

export const mcpInboxDetailSchema = mcpInboxItemSchema.extend({
  groupedInboxId: z.string().nullable().optional(),
  meta: z.any().nullable().optional(),
  suggestion: z.any().nullable().optional(),
  relatedItems: z.array(mcpInboxItemSchema).nullable().optional(),
  fileUrl: z.string().nullable().optional(),
});

// ============================================================
// Transaction category schema
// ============================================================

export const mcpCategoryDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  system: z.boolean().nullable().optional(),
  taxRate: z.number().nullable().optional(),
  taxType: z.string().nullable().optional(),
  taxReportingCode: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  children: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string().nullable().optional(),
        slug: z.string().nullable().optional(),
      }),
    )
    .nullable()
    .optional(),
});

// ============================================================
// Invoice template schema
// ============================================================

export const mcpInvoiceTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean().nullable().optional(),
  title: z.string().nullable().optional(),
  customerLabel: z.string().nullable().optional(),
  fromLabel: z.string().nullable().optional(),
  invoiceNoLabel: z.string().nullable().optional(),
  issueDateLabel: z.string().nullable().optional(),
  dueDateLabel: z.string().nullable().optional(),
  descriptionLabel: z.string().nullable().optional(),
  priceLabel: z.string().nullable().optional(),
  quantityLabel: z.string().nullable().optional(),
  totalLabel: z.string().nullable().optional(),
  totalSummaryLabel: z.string().nullable().optional(),
  vatLabel: z.string().nullable().optional(),
  subtotalLabel: z.string().nullable().optional(),
  taxLabel: z.string().nullable().optional(),
  discountLabel: z.string().nullable().optional(),
  paymentLabel: z.string().nullable().optional(),
  noteLabel: z.string().nullable().optional(),
  lineItemTaxLabel: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  dateFormat: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  includeVat: z.boolean().nullable().optional(),
  includeTax: z.boolean().nullable().optional(),
  includeDiscount: z.boolean().nullable().optional(),
  includeDecimals: z.boolean().nullable().optional(),
  includeUnits: z.boolean().nullable().optional(),
  includeQr: z.boolean().nullable().optional(),
  includeLineItemTax: z.boolean().nullable().optional(),
  includePdf: z.boolean().nullable().optional(),
  sendCopy: z.boolean().nullable().optional(),
  taxRate: z.number().nullable().optional(),
  vatRate: z.number().nullable().optional(),
  deliveryType: z.string().nullable().optional(),
  paymentEnabled: z.boolean().nullable().optional(),
  paymentTermsDays: z.number().nullable().optional(),
  emailSubject: z.string().nullable().optional(),
  emailHeading: z.string().nullable().optional(),
  emailBody: z.string().nullable().optional(),
  emailButtonText: z.string().nullable().optional(),
  fromDetails: z.any().nullable().optional(),
  paymentDetails: z.any().nullable().optional(),
  noteDetails: z.any().nullable().optional(),
});

// ============================================================
// Invoice product schema
// ============================================================

export const mcpInvoiceProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  taxRate: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
  usageCount: z.number().optional(),
  lastUsedAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

// ============================================================
// Bank account details schema (sensitive — only expose safe fields)
// ============================================================

export const mcpBankAccountDetailsSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  bic: z.string().nullable().optional(),
  routingNumber: z.string().nullable().optional(),
  sortCode: z.string().nullable().optional(),
});

// ============================================================
// Bank account balance schema
// ============================================================

export const mcpBankAccountBalanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string().nullable().optional(),
  balance: z.number().nullable().optional(),
  baseCurrency: z.string().nullable().optional(),
  baseBalance: z.number().nullable().optional(),
});

// ============================================================
// Bank account currency schema
// ============================================================

export const mcpBankAccountCurrencySchema = z.object({
  currency: z.string(),
});

// ============================================================
// Document tag schema
// ============================================================

export const mcpDocumentTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable().optional(),
});

// ============================================================
// Search result schema
// ============================================================

export const mcpSearchResultSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string().nullable().optional(),
  relevance: z.number().nullable().optional(),
});

// ============================================================
// Tag schema
// ============================================================

export const mcpTagResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// ============================================================
// Team schemas
// ============================================================

export const mcpTeamSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  plan: z.string().nullable().optional(),
  baseCurrency: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  fiscalYearStartMonth: z.number().nullable().optional(),
});

export const mcpTeamMemberSchema = z.object({
  id: z.string(),
  role: z.string().nullable().optional(),
  user: z
    .object({
      id: z.string(),
      fullName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      email: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

// ============================================================
// Utility: safe parse with allowlist fallback
// ============================================================

/**
 * Recursively keep only the keys declared in a Zod schema.
 * Wrapper types (optional, nullable, default) are unwrapped to reach
 * the underlying ZodObject/ZodArray. Leaf types pass through as-is.
 *
 * The `as any` casts on `.unwrap()`, `.element`, and `.shape` work
 * around Zod v4's split core/$ZodType vs classic/ZodType hierarchy;
 * the values are correct at runtime.
 */
function pickKnownKeys(schema: z.ZodTypeAny, data: unknown): unknown {
  if (data == null) return data;

  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault
  ) {
    return pickKnownKeys((schema as any).unwrap(), data);
  }

  if (schema instanceof z.ZodArray && Array.isArray(data)) {
    return data.map((item) => pickKnownKeys((schema as any).element, item));
  }

  if (
    schema instanceof z.ZodObject &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    const shape = (schema as any).shape as Record<string, z.ZodTypeAny>;
    const src = data as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      if (key in src) out[key] = pickKnownKeys(shape[key]!, src[key]);
    }
    return out;
  }

  return data;
}

export function sanitize<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.output<T> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  return pickKnownKeys(schema, data) as z.output<T>;
}

export function sanitizeArray<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown[],
): z.output<T>[] {
  return data.map((item) => sanitize(schema, item));
}
