/**
 * Invoice test data factories.
 * These match the invoiceResponseSchema from @api/schemas/invoice.ts
 */

interface InvoiceCustomer {
  id: string;
  name: string;
  website: string | null;
  email: string;
}

interface InvoiceResponse {
  id: string;
  status: "draft" | "pending" | "paid" | "overdue" | "canceled" | "unpaid";
  dueDate: string;
  issueDate: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  customer: InvoiceCustomer | null;
  paidAt: string | null;
  reminderSentAt: string | null;
  note: string | null;
  vat: number | null;
  tax: number | null;
  discount: number | null;
  subtotal: number | null;
  viewedAt: string | null;
  customerName: string | null;
  sentTo: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  pdfUrl: string | null;
  previewUrl: string | null;
}

interface InvoiceInput {
  customerId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: Array<{ name: string; quantity: number; price: number }>;
}

interface InvoiceListMeta {
  cursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Creates a complete valid invoice response matching the REST API schema.
 */
export function createValidInvoiceResponse(
  overrides: Partial<InvoiceResponse> = {},
): InvoiceResponse {
  return {
    id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    status: "draft",
    dueDate: "2024-05-31T00:00:00.000Z",
    issueDate: "2024-05-01T00:00:00.000Z",
    invoiceNumber: "INV-001",
    amount: 1000,
    currency: "USD",
    customer: {
      id: "cust-1234-5678-90ab-cdef01234567",
      name: "Acme Corp",
      website: null,
      email: "billing@acme.com",
    },
    paidAt: null,
    reminderSentAt: null,
    note: null,
    vat: null,
    tax: null,
    discount: null,
    subtotal: 1000,
    viewedAt: null,
    customerName: "Acme Corp",
    sentTo: null,
    sentAt: null,
    createdAt: "2024-05-01T00:00:00.000Z",
    updatedAt: "2024-05-01T00:00:00.000Z",
    pdfUrl: null,
    previewUrl: null,
    ...overrides,
  };
}

/**
 * Creates an invoice with all nullable fields as null.
 */
export function createMinimalInvoiceResponse(): InvoiceResponse {
  return createValidInvoiceResponse({
    customer: null,
    paidAt: null,
    reminderSentAt: null,
    note: null,
    vat: null,
    tax: null,
    discount: null,
    subtotal: null,
    viewedAt: null,
    customerName: null,
    sentTo: null,
    sentAt: null,
    pdfUrl: null,
    previewUrl: null,
  });
}

/**
 * Creates an invoice with paid status.
 */
export function createPaidInvoiceResponse(): InvoiceResponse {
  return createValidInvoiceResponse({
    status: "paid",
    paidAt: "2024-05-15T10:00:00.000Z",
  });
}

/**
 * Creates an invoice with overdue status.
 */
export function createOverdueInvoiceResponse(): InvoiceResponse {
  return createValidInvoiceResponse({
    status: "overdue",
    dueDate: "2024-04-01T00:00:00.000Z",
  });
}

/**
 * Creates an invoice with multiple line items.
 * Note: Line items are part of the internal structure, not the response schema.
 */
export function createInvoiceWithLineItems(): InvoiceResponse {
  return createValidInvoiceResponse({
    amount: 1100,
    subtotal: 1100,
  });
}

/**
 * Creates a valid invoice input for POST/create operations.
 */
export function createInvoiceInput(
  overrides: Partial<InvoiceInput> = {},
): InvoiceInput {
  return {
    customerId: "cust-1234-5678-90ab-cdef01234567",
    issueDate: "2024-05-01",
    dueDate: "2024-05-31",
    currency: "USD",
    lineItems: [{ name: "Service", quantity: 1, price: 1000 }],
    ...overrides,
  };
}

/**
 * Creates an invoices list response with pagination metadata.
 * Note: cursor must be null (not undefined) when there's no next page.
 */
export function createInvoicesListResponse(
  invoices: InvoiceResponse[] = [],
  meta: Partial<InvoiceListMeta> = {},
): { data: InvoiceResponse[]; meta: InvoiceListMeta } {
  return {
    data: invoices,
    meta: {
      cursor: meta.cursor ?? null,
      hasNextPage: meta.hasNextPage ?? false,
      hasPreviousPage: meta.hasPreviousPage ?? false,
    },
  };
}

/**
 * Creates an invoice summary response.
 */
export function createInvoiceSummaryResponse() {
  return {
    paid: { count: 10, amount: 50000 },
    unpaid: { count: 5, amount: 25000 },
    overdue: { count: 2, amount: 10000 },
    draft: { count: 3, amount: 15000 },
  };
}
