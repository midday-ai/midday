/**
 * Transaction test data factories.
 * These create both "happy path" data AND edge case variants
 * that might cause validateResponse to fail.
 */

interface TransactionResponse {
  id: string;
  name: string;
  amount: number;
  taxAmount: number | null;
  taxRate: number | null;
  taxType: string | null;
  currency: string;
  counterpartyName: string | null;
  date: string;
  category: {
    id: string;
    name: string;
    color: string;
    taxRate: number | null;
    taxType: string | null;
    slug: string;
  } | null;
  status: string;
  internal: boolean | null;
  recurring: boolean | null;
  manual: boolean | null;
  frequency: string | null;
  isFulfilled: boolean;
  note: string | null;
  account: {
    id: string;
    name: string;
    currency: string;
    connection: {
      id: string;
      name: string;
      logoUrl: string | null;
    };
  };
  tags: Array<{ id: string; name: string }> | null;
  attachments: Array<{
    id: string;
    path: string[];
    size: number;
    type: string;
    filename: string;
  }> | null;
}

/**
 * Creates a complete valid transaction response with all fields present.
 * This represents the ideal data shape from the database.
 */
export function createValidTransactionResponse(
  overrides: Partial<TransactionResponse> = {},
): TransactionResponse {
  return {
    id: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    name: "Office Supplies",
    amount: 150.75,
    taxAmount: null,
    taxRate: null,
    taxType: null,
    currency: "USD",
    counterpartyName: null,
    date: "2024-05-01T12:00:00.000Z",
    category: null,
    status: "completed",
    internal: false,
    recurring: false,
    manual: false,
    frequency: null,
    isFulfilled: true,
    note: null,
    account: {
      id: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
      name: "Business Checking",
      currency: "USD",
      connection: {
        id: "conn-123",
        name: "Chase Bank",
        logoUrl: null,
      },
    },
    tags: [],
    attachments: [],
    ...overrides,
  };
}

/**
 * Creates a transaction with all nullable fields set to null.
 * Tests that the schema correctly handles null values.
 */
export function createMinimalTransactionResponse() {
  return createValidTransactionResponse({
    taxAmount: null,
    taxRate: null,
    taxType: null,
    counterpartyName: null,
    category: null,
    internal: null,
    recurring: null,
    manual: null,
    frequency: null,
    note: null,
    tags: null,
    attachments: null,
  });
}

/**
 * Creates a transaction with a nested category object.
 * Tests deep schema validation.
 */
export function createTransactionWithCategory() {
  return createValidTransactionResponse({
    category: {
      id: "office-supplies",
      name: "Office Supplies",
      color: "#FF5733",
      taxRate: 10,
      taxType: "VAT",
      slug: "office-supplies",
    },
  });
}

/**
 * Creates a transaction with tags.
 * Tests array handling with nested objects.
 */
export function createTransactionWithTags() {
  return createValidTransactionResponse({
    tags: [
      { id: "tag-1", name: "Business" },
      { id: "tag-2", name: "Tax Deductible" },
    ],
  });
}

/**
 * Creates a transaction with attachments.
 * Tests array handling with complex nested objects.
 */
export function createTransactionWithAttachments() {
  return createValidTransactionResponse({
    attachments: [
      {
        id: "att-123",
        path: ["team-id", "transactions", "tx-id", "receipt.pdf"],
        size: 1024000,
        type: "application/pdf",
        filename: "receipt.pdf",
      },
    ],
  });
}

/**
 * Creates a malformed transaction response that is missing required fields.
 * This simulates what the DB might return when data is incomplete.
 * Should cause validateResponse to throw!
 */
export function createMalformedTransactionResponse() {
  return {
    id: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    name: "Office Supplies",
    amount: 150.75,
    currency: "USD",
    date: "2024-05-01T12:00:00.000Z",
    status: "completed",
    // MISSING: account, isFulfilled, etc.
    // This will cause validateResponse to throw!
  };
}

interface TransactionInput {
  name: string;
  amount: number;
  currency: string;
  date: string;
  bankAccountId: string;
}

/**
 * Creates a valid transaction input for POST/create operations.
 */
export function createTransactionInput(
  overrides: Partial<TransactionInput> = {},
): TransactionInput {
  return {
    name: "New Transaction",
    amount: 100.0,
    currency: "USD",
    date: "2024-05-01T12:00:00.000Z",
    bankAccountId: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
    ...overrides,
  };
}

/**
 * Creates a transactions list response with pagination metadata.
 */
export function createTransactionsListResponse(
  transactions: ReturnType<typeof createValidTransactionResponse>[] = [],
  meta: {
    cursor?: string;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  } = {},
) {
  return {
    data: transactions,
    meta: {
      cursor: meta.cursor,
      hasNextPage: meta.hasNextPage ?? false,
      hasPreviousPage: meta.hasPreviousPage ?? false,
    },
  };
}
