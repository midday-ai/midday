import { mock } from "bun:test";

// Mock all external dependencies that the API uses
// These mocks are applied globally before any test files run

// Create a mock db object for tRPC tests that simulates Drizzle's query interface
const createMockDb = () => ({
  query: {
    users: {
      findFirst: mock(() =>
        Promise.resolve({
          id: "test-user-id",
          teamId: "test-team-id",
          email: "test@example.com",
          usersOnTeams: [{ id: "membership-1", teamId: "test-team-id" }],
        }),
      ),
    },
  },
  // Add usePrimaryOnly for the withReplicas pattern
  usePrimaryOnly: () => createMockDb(),
  $primary: undefined,
});

export const mockDb = createMockDb();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock<(...args: any[]) => any>>;

// Create reusable mock functions that tests can access
export const mocks = {
  // Transaction queries
  getTransactions: mock(() => ({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false },
  })) as MockFn,
  getTransactionById: mock(() => null) as MockFn,
  createTransaction: mock(() => ({})) as MockFn,
  createTransactions: mock(() => []) as MockFn,
  updateTransaction: mock(() => ({})) as MockFn,
  updateTransactions: mock(() => ({ data: [], meta: {} })) as MockFn,
  deleteTransactions: mock(() => []) as MockFn,
  getTransactionAttachment: mock(() => null) as MockFn,
  getSimilarTransactions: mock(() => []) as MockFn,
  searchTransactionMatch: mock(() => []) as MockFn,
  getTransactionsReadyForExportCount: mock(() => 0) as MockFn,
  moveTransactionToReview: mock(() => ({})) as MockFn,

  // Invoice queries
  getInvoices: mock(() => ({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false },
  })) as MockFn,
  getInvoiceById: mock(() => null) as MockFn,
  createInvoice: mock(() => ({})) as MockFn,
  updateInvoice: mock(() => ({})) as MockFn,
  deleteInvoice: mock(() => ({})) as MockFn,
  draftInvoice: mock(() => ({})) as MockFn,
  duplicateInvoice: mock(() => ({})) as MockFn,
  getInvoiceNumber: mock(() => "INV-001") as MockFn,
  getNextInvoiceNumber: mock(() => "INV-002") as MockFn,
  getInvoiceSummary: mock(() => ({
    paid: { count: 0, amount: 0 },
    unpaid: { count: 0, amount: 0 },
    overdue: { count: 0, amount: 0 },
    draft: { count: 0, amount: 0 },
  })) as MockFn,
  getInvoiceTemplate: mock(() => null) as MockFn,
  getPaymentStatus: mock(() => ({ status: "unpaid" })) as MockFn,
  isInvoiceNumberUsed: mock(() => false) as MockFn,
  searchInvoiceNumber: mock(() => []) as MockFn,
  getAverageDaysToPayment: mock(() => 15) as MockFn,
  getAverageInvoiceSize: mock(() => 1000) as MockFn,
  getInactiveClientsCount: mock(() => 0) as MockFn,
  getNewCustomersCount: mock(() => 5) as MockFn,
  getMostActiveClient: mock(() => null) as MockFn,
  getTopRevenueClient: mock(() => null) as MockFn,

  // Customer queries
  getCustomers: mock(() => ({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false },
  })) as MockFn,
  getCustomerById: mock(() => null) as MockFn,
  createCustomer: mock(() => ({})) as MockFn,
  updateCustomer: mock(() => ({})) as MockFn,
  deleteCustomer: mock(() => ({})) as MockFn,

  // Bank account queries
  getBankAccounts: mock(() => []) as MockFn,
  getBankAccountById: mock(() => null) as MockFn,
  createBankAccount: mock(() => ({})) as MockFn,
  updateBankAccount: mock(() => ({})) as MockFn,
  deleteBankAccount: mock(() => ({})) as MockFn,

  // Inbox queries
  getInboxItems: mock(() => ({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false },
  })) as MockFn,
  getInboxItemById: mock(() => null) as MockFn,
  updateInboxItem: mock(() => ({})) as MockFn,
  deleteInboxItem: mock(() => ({})) as MockFn,

  // API Keys
  getApiKeyByToken: mock(() => null) as MockFn,
  upsertApiKey: mock(() => ({})) as MockFn,
  getApiKeysByTeam: mock(() => []) as MockFn,
  deleteApiKey: mock(() => ({})) as MockFn,
  updateApiKeyLastUsedAt: mock(() => ({})) as MockFn,

  // Users
  getUserById: mock(() => null) as MockFn,
  getUser: mock(() => null) as MockFn,
  updateUser: mock(() => ({})) as MockFn,

  // Teams
  getTeamById: mock(() => null) as MockFn,
  getTeam: mock(() => null) as MockFn,
  updateTeam: mock(() => ({})) as MockFn,

  // Other commonly used queries
  validateAccessToken: mock(() => null) as MockFn,
  triggerJob: mock(() => ({ id: "job-123" })) as MockFn,
  signedUrl: mock(() => ({
    data: { signedUrl: "https://example.com/signed" },
    error: null,
  })) as MockFn,
  formatAmountValue: mock(
    ({ amount }: { amount: string }) => Number.parseFloat(amount) || 0,
  ) as MockFn,
};

// Create a default mock function that returns empty data
const createDefaultMock = () => mock(() => null);

// Mock @midday/db/queries with a Proxy to handle any export
const dbQueriesMock = new Proxy(
  {
    // Transaction functions
    getTransactions: mocks.getTransactions,
    getTransactionById: mocks.getTransactionById,
    createTransaction: mocks.createTransaction,
    createTransactions: mocks.createTransactions,
    updateTransaction: mocks.updateTransaction,
    updateTransactions: mocks.updateTransactions,
    deleteTransactions: mocks.deleteTransactions,
    getTransactionAttachment: mocks.getTransactionAttachment,
    getSimilarTransactions: mocks.getSimilarTransactions,
    searchTransactionMatch: mocks.searchTransactionMatch,
    getTransactionsReadyForExportCount:
      mocks.getTransactionsReadyForExportCount,
    moveTransactionToReview: mocks.moveTransactionToReview,

    // Invoice functions
    getInvoices: mocks.getInvoices,
    getInvoiceById: mocks.getInvoiceById,
    createInvoice: mocks.createInvoice,
    updateInvoice: mocks.updateInvoice,
    deleteInvoice: mocks.deleteInvoice,
    draftInvoice: mocks.draftInvoice,
    duplicateInvoice: mocks.duplicateInvoice,
    getInvoiceNumber: mocks.getInvoiceNumber,
    getNextInvoiceNumber: mocks.getNextInvoiceNumber,
    getInvoiceSummary: mocks.getInvoiceSummary,
    getInvoiceTemplate: mocks.getInvoiceTemplate,
    getPaymentStatus: mocks.getPaymentStatus,
    isInvoiceNumberUsed: mocks.isInvoiceNumberUsed,
    searchInvoiceNumber: mocks.searchInvoiceNumber,
    getAverageDaysToPayment: mocks.getAverageDaysToPayment,
    getAverageInvoiceSize: mocks.getAverageInvoiceSize,
    getInactiveClientsCount: mocks.getInactiveClientsCount,
    getNewCustomersCount: mocks.getNewCustomersCount,
    getMostActiveClient: mocks.getMostActiveClient,
    getTopRevenueClient: mocks.getTopRevenueClient,

    // Customer functions
    getCustomers: mocks.getCustomers,
    getCustomerById: mocks.getCustomerById,
    createCustomer: mocks.createCustomer,
    updateCustomer: mocks.updateCustomer,
    deleteCustomer: mocks.deleteCustomer,
    upsertCustomer: mock(() => ({})),
    getCustomerInvoiceSummary: mock(() => ({ total: 0, paid: 0, overdue: 0 })),
    clearCustomerEnrichment: mock(() => ({})),
    updateCustomerEnrichmentStatus: mock(() => ({})),
    toggleCustomerPortal: mock(() => ({})),
    getCustomerByPortalId: mock(() => null),
    getCustomerPortalInvoices: mock(() => ({ data: [], meta: {} })),

    // Bank account functions
    getBankAccounts: mocks.getBankAccounts,
    getBankAccountById: mocks.getBankAccountById,
    createBankAccount: mocks.createBankAccount,
    updateBankAccount: mocks.updateBankAccount,
    deleteBankAccount: mocks.deleteBankAccount,
    getBankAccountDetails: mock(() => null),
    getBankAccountsBalances: mock(() => []),
    getBankAccountsCurrencies: mock(() => []),
    getBankAccountsWithPaymentInfo: mock(() => []),

    // Inbox functions
    getInboxItems: mocks.getInboxItems,
    getInboxItemById: mocks.getInboxItemById,
    updateInboxItem: mocks.updateInboxItem,
    deleteInboxItem: mocks.deleteInboxItem,
    getInbox: mock(() => ({
      data: [],
      meta: { hasNextPage: false, hasPreviousPage: false },
    })),
    getInboxById: mock(() => null),
    createInbox: mock(() => ({})),
    updateInbox: mock(() => ({})),
    deleteInbox: mock(() => ({})),
    deleteInboxMany: mock(() => []),
    getInboxByStatus: mock(() => ({ pending: 0, completed: 0 })),
    getInboxSearch: mock(() => []),
    getInboxBlocklist: mock(() => []),
    createInboxBlocklist: mock(() => ({})),
    deleteInboxBlocklist: mock(() => ({})),
    checkInboxAttachments: mock(() => []),
    matchTransaction: mock(() => ({})),
    unmatchTransaction: mock(() => ({})),
    confirmSuggestedMatch: mock(() => ({})),
    declineSuggestedMatch: mock(() => ({})),
    deleteInboxEmbedding: mock(() => ({})),

    // API Keys
    getApiKeyByToken: mocks.getApiKeyByToken,
    upsertApiKey: mocks.upsertApiKey,
    getApiKeysByTeam: mocks.getApiKeysByTeam,
    deleteApiKey: mocks.deleteApiKey,
    updateApiKeyLastUsedAt: mocks.updateApiKeyLastUsedAt,

    // Users
    getUserById: mocks.getUserById,
    getUser: mocks.getUser,
    updateUser: mocks.updateUser,
    getUserTeamId: mock(() => "test-team-id"),

    // Teams
    getTeamById: mocks.getTeamById,
    getTeam: mocks.getTeam,
    updateTeam: mocks.updateTeam,

    // Tracker
    getTrackerProjectById: mock(() => null),
    getTrackerRecordsByRange: mock(() => []),

    // Validation
    validateAccessToken: mocks.validateAccessToken,
  } as Record<string, any>,
  {
    get(target, prop) {
      if (prop in target) {
        return target[prop as string];
      }
      // Return a default mock for any unspecified export
      target[prop as string] = createDefaultMock();
      return target[prop as string];
    },
  },
);

mock.module("@midday/db/queries", () => dbQueriesMock);

// Mock @midday/supabase/storage
mock.module("@midday/supabase/storage", () => ({
  signedUrl: mocks.signedUrl,
  remove: mock(() => Promise.resolve({ error: null })),
}));

// Mock @midday/job-client
mock.module("@midday/job-client", () => ({
  triggerJob: mocks.triggerJob,
  getQueue: mock(() => ({
    getJob: mock(() => null),
    getJobs: mock(() => []),
  })),
  decodeJobId: mock((id: string) => ({ id, queue: "default" })),
}));

// Mock @midday/import
mock.module("@midday/import", () => ({
  formatAmountValue: mocks.formatAmountValue,
}));

// Mock @midday/invoice
mock.module("@midday/invoice/calculate", () => ({
  calculateTotal: mock(({ lineItems }: { lineItems: any[] }) => ({
    subTotal: lineItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    ),
    total: lineItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    ),
    vat: 0,
    tax: 0,
  })),
}));

mock.module("@midday/invoice/utils", () => ({
  transformCustomerToContent: mock((customer: any) => ({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: customer?.name || "" }],
      },
    ],
  })),
}));

mock.module("@midday/invoice/token", () => ({
  verify: mock(() => ({ id: "invoice-123", teamId: "test-team-id" })),
}));

mock.module("@midday/invoice", () => ({
  DEFAULT_TEMPLATE: {},
}));

// Mock @api/services/supabase
mock.module("@api/services/supabase", () => ({
  createClient: mock(async () => ({})),
  createAdminClient: mock(async () => ({})),
}));

// Mock @api/utils/auth - needed by tRPC init
mock.module("@api/utils/auth", () => ({
  verifyAccessToken: mock(async () => ({
    user: {
      id: "test-user-id",
      email: "test@example.com",
      user_metadata: {},
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
    access_token: "test-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "test-refresh-token",
  })),
}));

// Mock @midday/db/client
mock.module("@midday/db/client", () => ({
  db: mockDb,
  primaryDb: mockDb,
  connectDb: mock(async () => mockDb),
}));

// Mock @midday/cache/team-cache
mock.module("@midday/cache/team-cache", () => ({
  teamCache: {
    get: mock(async () => true), // Always return cached access = true
    set: mock(async () => {}),
  },
}));

// Set required environment variables for tests
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || "https://test.supabase.co";
process.env.SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || "test-service-key";
process.env.DATABASE_PRIMARY_URL =
  process.env.DATABASE_PRIMARY_URL ||
  "postgres://test:test@localhost:5432/test";
process.env.DATABASE_FRA_URL =
  process.env.DATABASE_FRA_URL || "postgres://test:test@localhost:5432/test";
process.env.DATABASE_SJC_URL =
  process.env.DATABASE_SJC_URL || "postgres://test:test@localhost:5432/test";
process.env.DATABASE_IAD_URL =
  process.env.DATABASE_IAD_URL || "postgres://test:test@localhost:5432/test";
process.env.MIDDAY_DASHBOARD_URL =
  process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";
