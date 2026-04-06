import { mock } from "bun:test";

// Set required environment variables BEFORE any mock.module calls
// to prevent module-level code (e.g. auth.ts JWKS, banking env validation) from failing
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || "https://test.supabase.co";
process.env.SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || "test-service-key";
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
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_test_key";
process.env.RESEND_AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID || "aud_test_resend_audience";
process.env.FILE_KEY_SECRET = process.env.FILE_KEY_SECRET || "test-secret";
process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "test-internal";
process.env.PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || "test";
process.env.PLAID_SECRET = process.env.PLAID_SECRET || "test";
process.env.GOCARDLESS_SECRET_ID = process.env.GOCARDLESS_SECRET_ID || "test";
process.env.GOCARDLESS_SECRET_KEY = process.env.GOCARDLESS_SECRET_KEY || "test";
process.env.ENABLEBANKING_APPLICATION_ID =
  process.env.ENABLEBANKING_APPLICATION_ID || "test";
process.env.ENABLE_BANKING_KEY_CONTENT =
  process.env.ENABLE_BANKING_KEY_CONTENT || "test";
process.env.ENABLEBANKING_REDIRECT_URL =
  process.env.ENABLEBANKING_REDIRECT_URL || "https://test.midday.ai/callback";
process.env.TELLER_CERT_BASE64 = process.env.TELLER_CERT_BASE64 || "dGVzdA==";
process.env.TELLER_KEY_BASE64 = process.env.TELLER_KEY_BASE64 || "dGVzdA==";
process.env.R2_ENDPOINT = process.env.R2_ENDPOINT || "https://test.r2.dev";
process.env.R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "test";
process.env.R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "test";
process.env.R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "test";
process.env.LOGO_DEV_TOKEN = process.env.LOGO_DEV_TOKEN || "test";
process.env.STRIPE_CONNECT_CLIENT_ID =
  process.env.STRIPE_CONNECT_CLIENT_ID || "ca_test_connect_client";
process.env.STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || "sk_test_mock_secret";

// Create a mock db object for tRPC tests that simulates Drizzle's query interface
const createMockDb = () => ({
  query: {
    users: {
      findFirst: mock(() =>
        Promise.resolve({
          id: "test-user-id",
          teamId: "test-team-id" as string | null,
          email: "test@example.com",
          usersOnTeams: [{ id: "membership-1", teamId: "test-team-id" }],
        }),
      ),
    },
    invoices: {
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
    },
  },
  // Used by invoice-recurring delete/pause (transaction + invoices.findMany)
  transaction: mock(async (fn: (tx: any) => Promise<unknown>) =>
    fn({
      query: {
        invoices: {
          findMany: mock(() => Promise.resolve([])),
        },
      },
    }),
  ),
  // Add usePrimaryOnly for the withReplicas pattern
  usePrimaryOnly: () => createMockDb(),
  $primary: undefined,
});

export const mockDb = createMockDb();

export type MockFn = ReturnType<typeof mock<(...args: any[]) => any>>;

export function asMock(fn: (...args: any[]) => any): MockFn {
  return fn as MockFn;
}

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
  draftInvoice: mock(() => ({
    id: "d1e2f3a4-b5c6-7890-abcd-ef1234567890",
    invoiceNumber: "INV-0001",
    status: "draft",
    token: "test-token",
  })) as MockFn,
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

  // Invoice templates
  getInvoiceTemplates: mock(() => []) as MockFn,
  getInvoiceTemplateById: mock(() => null) as MockFn,
  createInvoiceTemplate: mock(() => ({})) as MockFn,
  deleteInvoiceTemplate: mock(() => ({})) as MockFn,
  getInvoiceTemplateCount: mock(() => 0) as MockFn,
  upsertInvoiceTemplate: mock(() => ({})) as MockFn,
  setDefaultTemplate: mock(() => ({})) as MockFn,

  // Invoice recurring
  getInvoiceRecurringList: mock(() => ({
    data: [],
    meta: {},
  })) as MockFn,
  getInvoiceRecurringById: mock(() => null) as MockFn,
  deleteInvoiceRecurring: mock(() => null) as MockFn,
  pauseInvoiceRecurring: mock(() => null) as MockFn,
  resumeInvoiceRecurring: mock(() => null) as MockFn,
  createInvoiceRecurring: mock(() => ({
    id: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
    frequency: "monthly_last_day",
  })) as MockFn,
  updateInvoiceRecurring: mock(() => ({
    id: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  })) as MockFn,
  getUpcomingInvoices: mock(() => ({
    invoices: [{ date: "2026-04-01T00:00:00.000Z", amount: 100 }],
    summary: {
      hasEndDate: false,
      totalCount: null,
      totalAmount: null,
      currency: "USD",
    },
  })) as MockFn,

  // Invoice products
  getInvoiceProducts: mock(() => []) as MockFn,
  getInvoiceProductById: mock(() => null) as MockFn,
  deleteInvoiceProduct: mock(() => false) as MockFn,
  createInvoiceProduct: mock(() => ({})) as MockFn,
  upsertInvoiceProduct: mock(() => ({})) as MockFn,
  updateInvoiceProduct: mock(() => ({})) as MockFn,
  incrementProductUsage: mock(() => Promise.resolve()) as MockFn,
  saveLineItemAsProduct: mock(() => ({
    product: { id: "c4d5e6f7-8901-4234-a789-abcdef012345", name: "Item" },
    shouldClearProductId: false,
  })) as MockFn,

  // Customer queries
  getCustomers: mock(() => ({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false },
  })) as MockFn,
  getCustomerById: mock(() => null) as MockFn,
  createCustomer: mock(() => ({})) as MockFn,
  updateCustomer: mock(() => ({})) as MockFn,
  deleteCustomer: mock(() => ({})) as MockFn,
  upsertCustomer: mock(() =>
    Promise.resolve({
      id: "a1b2c3d4-e5f6-4789-a012-345678901234",
      name: "Customer",
    }),
  ) as MockFn,
  getCustomerInvoiceSummary: mock(() =>
    Promise.resolve({ total: 0, paid: 0, overdue: 0 }),
  ) as MockFn,
  toggleCustomerPortal: mock(() =>
    Promise.resolve({
      id: "a1b2c3d4-e5f6-4789-a012-345678901234",
      portalEnabled: true,
      portalId: "portal_test_id",
    }),
  ) as MockFn,
  getCustomerByPortalId: mock(() => null) as MockFn,
  getCustomerPortalInvoices: mock(() =>
    Promise.resolve({ data: [], nextCursor: null, hasMore: false }),
  ) as MockFn,

  // Bank account queries
  getBankAccounts: mock(() => []) as MockFn,
  getBankAccountById: mock(() => null) as MockFn,
  createBankAccount: mock(() => ({})) as MockFn,
  updateBankAccount: mock(() => ({})) as MockFn,
  deleteBankAccount: mock(() => ({})) as MockFn,
  getBankAccountDetails: mock(() =>
    Promise.resolve({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      iban: null,
      accountNumber: null,
      routingNumber: null,
      wireRoutingNumber: null,
      bic: null,
      sortCode: null,
    }),
  ) as MockFn,
  getBankAccountsBalances: mock(() =>
    Promise.resolve([
      {
        accountId: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        balance: 1000,
      },
    ]),
  ) as MockFn,
  getBankAccountsCurrencies: mock(() =>
    Promise.resolve(["USD", "EUR"]),
  ) as MockFn,
  getTransactionCountByBankAccountId: mock(() => Promise.resolve(5)) as MockFn,

  // Inbox queries
  getInboxItems: mock(() => ({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false },
  })) as MockFn,
  getInboxItemById: mock(() => null) as MockFn,
  updateInboxItem: mock(() => ({})) as MockFn,
  deleteInboxItem: mock(() => ({})) as MockFn,

  // Inbox router (getInbox / matching — distinct from inbox *items* helpers above)
  getInbox: mock(() => ({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false },
  })) as MockFn,
  getInboxById: mock(() => null) as MockFn,
  updateInbox: mock(() => ({})) as MockFn,
  deleteInbox: mock(() => ({})) as MockFn,
  deleteInboxMany: mock(() =>
    Promise.resolve([{ id: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4" }]),
  ) as MockFn,
  createInbox: mock(() =>
    Promise.resolve({
      id: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    }),
  ) as MockFn,
  getInboxByStatus: mock(() => []) as MockFn,

  // API Keys
  getApiKeyByToken: mock(() => null) as MockFn,
  upsertApiKey: mock(() =>
    Promise.resolve({
      key: "md_test_key_plaintext",
      data: {
        id: "a1b2c3d4-e5f6-4789-a012-345678901234",
        name: "Test Key",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    }),
  ) as MockFn,
  getApiKeysByTeam: mock(() => []) as MockFn,
  deleteApiKey: mock(() => Promise.resolve("key-hash-for-cache")) as MockFn,
  updateApiKeyLastUsedAt: mock(() => ({})) as MockFn,

  // Users
  getUserById: mock(() => null) as MockFn,
  getUser: mock(() => null) as MockFn,
  updateUser: mock(() => ({})) as MockFn,

  // Teams
  getTeamById: mock(() => null) as MockFn,
  getTeam: mock(() => null) as MockFn,
  updateTeam: mock(() => ({})) as MockFn,
  createTeam: mock(() =>
    Promise.resolve("b2c3d4e5-f6a7-4890-b123-456789012345"),
  ) as MockFn,
  leaveTeam: mock(() => Promise.resolve({ id: "membership-row" })) as MockFn,
  acceptTeamInvite: mock(() => Promise.resolve({})) as MockFn,
  declineTeamInvite: mock(() => Promise.resolve({})) as MockFn,
  deleteTeam: mock(() =>
    Promise.resolve({
      id: "c3d4e5f6-a7b8-4901-c234-567890123456",
      memberUserIds: ["test-user-id"],
    }),
  ) as MockFn,
  deleteTeamInvite: mock(() => Promise.resolve({})) as MockFn,
  deleteTeamMember: mock(() =>
    Promise.resolve({ id: "deleted-membership" }),
  ) as MockFn,
  updateTeamMember: mock(() => Promise.resolve({ updated: true })) as MockFn,
  getTeamInvites: mock(() => Promise.resolve([])) as MockFn,
  getInvitesByEmail: mock(() => Promise.resolve([])) as MockFn,
  createTeamInvites: mock(() =>
    Promise.resolve({
      results: [
        {
          email: "test@example.com",
          team: { name: "Test Team" },
        },
      ],
      skippedInvites: [],
    }),
  ) as MockFn,
  getAvailablePlans: mock(() => Promise.resolve([])) as MockFn,
  hasTeamAccess: mock(() => Promise.resolve(true)) as MockFn,
  getTeamMemberRole: mock(() => Promise.resolve(null)) as MockFn,
  getTeamMembersByTeamId: mock(() => Promise.resolve([])) as MockFn,
  getTeamsByUserId: mock(() => Promise.resolve([])) as MockFn,
  switchUserTeam: mock(() =>
    Promise.resolve({
      id: "test-user-id",
      teamId: "d4e5f6a7-b8c9-4012-d345-678901234567",
      previousTeamId: "test-team-id",
    }),
  ) as MockFn,
  deleteUser: mock(() => Promise.resolve({ id: "test-user-id" })) as MockFn,
  supabaseAdminDeleteUser: mock(() =>
    Promise.resolve({ data: {}, error: null }),
  ) as MockFn,
  resendContactsRemove: mock(() =>
    Promise.resolve({ data: {}, error: null }),
  ) as MockFn,
  resendEmailsSend: mock(() => Promise.resolve()) as MockFn,

  // Tracker queries
  getTrackerRecordsByDate: mock(() => ({
    meta: { totalDuration: 0 },
    data: [],
  })) as MockFn,
  getTrackerRecordsByRange: mock(() => ({
    meta: {
      totalDuration: 0,
      totalAmount: 0,
      from: "",
      to: "",
    },
    result: {},
  })) as MockFn,
  upsertTrackerEntries: mock(() => ({ id: "entry-id" })) as MockFn,
  deleteTrackerEntry: mock(() => ({ id: "entry-id" })) as MockFn,
  startTimer: mock(() => ({ id: "timer-id", isRunning: true })) as MockFn,
  stopTimer: mock(() => ({ id: "timer-id", isRunning: false })) as MockFn,
  getCurrentTimer: mock(() => null) as MockFn,
  getTimerStatus: mock(() => ({ isRunning: false })) as MockFn,
  getTrackerProjects: mock(() => ({
    data: [],
    meta: { hasNextPage: false, cursor: null },
  })) as MockFn,
  getTrackerProjectById: mock(() => null) as MockFn,
  upsertTrackerProject: mock(() => ({
    id: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
    name: "New Project",
  })) as MockFn,
  deleteTrackerProject: mock(() => ({
    id: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2",
  })) as MockFn,

  // Documents
  getDocuments: mock(() => ({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, cursor: undefined },
  })) as MockFn,
  getDocumentById: mock(() => null) as MockFn,
  getRelatedDocuments: mock(() => Promise.resolve([])) as MockFn,
  checkDocumentAttachments: mock(() => Promise.resolve([])) as MockFn,
  deleteDocument: mock(() => null) as MockFn,

  // Document tags & assignments
  getDocumentTags: mock(() => []) as MockFn,
  createDocumentTag: mock(() => null) as MockFn,
  createDocumentTagEmbedding: mock(() => ({})) as MockFn,
  deleteDocumentTag: mock(() => ({
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })) as MockFn,
  createDocumentTagAssignment: mock(() => ({})) as MockFn,
  deleteDocumentTagAssignment: mock(() => ({})) as MockFn,

  // OAuth applications (team apps list / CRUD used by router)
  getOAuthApplicationsByTeam: mock(() => []) as MockFn,
  getOAuthApplicationById: mock(() => null) as MockFn,
  createOAuthApplication: mock(() =>
    Promise.resolve({
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "Test App",
      clientId: "mid_client_test",
      clientSecret: "secret_plaintext",
    }),
  ) as MockFn,
  updateOAuthApplication: mock(() =>
    Promise.resolve({
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "Updated",
    }),
  ) as MockFn,
  regenerateClientSecret: mock(() =>
    Promise.resolve({ clientSecret: "new-secret" }),
  ) as MockFn,
  getUserAuthorizedApplications: mock(() => Promise.resolve([])) as MockFn,
  revokeUserApplicationTokens: mock(() => Promise.resolve()) as MockFn,
  deleteOAuthApplication: mock(() => ({})) as MockFn,

  // Institutions
  getInstitutions: mock(() => []) as MockFn,
  getInstitutionById: mock(() => null) as MockFn,
  updateInstitutionUsage: mock(() =>
    Promise.resolve({
      id: "inst_abc123",
      name: "Test Bank",
      logo: null,
      availableHistory: 90,
      maximumConsentValidity: null,
      popularity: 1,
      provider: "plaid" as const,
      type: "personal" as const,
      countries: ["US"],
    }),
  ) as MockFn,

  // Short links
  getShortLinkByShortId: mock(() => null) as MockFn,
  createShortLink: mock(() =>
    Promise.resolve({
      id: "short-link-row-id",
      shortId: "shrt1",
      url: "https://example.com",
    }),
  ) as MockFn,

  // Job client (tRPC jobs router)
  getJobStatus: mock(() =>
    Promise.resolve({ status: "completed" as const }),
  ) as MockFn,

  // Search
  globalSearchQuery: mock(() => []) as MockFn,
  globalSemanticSearchQuery: mock(() => []) as MockFn,
  getInboxSearch: mock(() => []) as MockFn,

  // Reports
  getReports: mock(() => ({
    summary: { currency: "USD", currentTotal: 0, prevTotal: 0 },
    meta: { type: "revenue", currency: "USD" },
    result: [],
  })) as MockFn,
  getBurnRate: mock(() => ({ data: [], currency: "USD" })) as MockFn,
  getRunway: mock(() => ({ months: 12, medianBurn: 5000 })) as MockFn,
  getExpenses: mock(() => ({ data: [], meta: {} })) as MockFn,
  getSpending: mock(() => []) as MockFn,
  getTaxSummary: mock(() =>
    Promise.resolve({
      summary: {
        totalTaxAmount: 0,
        totalTransactionAmount: 0,
        totalTransactions: 0,
        categoryCount: 0,
        type: "paid" as const,
        currency: "USD",
      },
      meta: { type: "tax", taxType: "paid", currency: "USD", period: {} },
      result: [],
    }),
  ) as MockFn,
  createReport: mock(() =>
    Promise.resolve({
      id: "report-row-id",
      linkId: "link-abc",
    }),
  ) as MockFn,
  getReportByLinkId: mock(() =>
    Promise.resolve({
      id: "report-row-id",
      type: "revenue",
      from: "2026-01-01",
      to: "2026-03-31",
    }),
  ) as MockFn,

  // Widgets (DB query wrappers)
  getGrowthRate: mock(() =>
    Promise.resolve({
      summary: {
        currentTotal: 120,
        previousTotal: 100,
        growthRate: 20,
        periodGrowthRate: 20,
        currency: "USD",
        trend: "positive" as const,
        period: "quarterly" as const,
        type: "revenue" as const,
        revenueType: "net" as const,
      },
      meta: { type: "growth_rate", period: "quarterly", currency: "USD" },
    }),
  ) as MockFn,
  getProfitMargin: mock(() =>
    Promise.resolve({
      summary: {
        totalRevenue: 1000,
        totalProfit: 200,
        profitMargin: 20,
        averageMargin: 20,
        currency: "USD",
        revenueType: "net" as const,
        trend: "neutral" as const,
        monthCount: 1,
      },
      meta: { type: "profit_margin", currency: "USD", revenueType: "net" },
      result: [],
    }),
  ) as MockFn,
  getCashFlow: mock(() =>
    Promise.resolve({
      summary: {
        netCashFlow: 500,
        totalIncome: 1000,
        totalExpenses: 500,
        averageMonthlyCashFlow: 500,
        currency: "USD",
        period: "monthly" as const,
      },
      monthlyData: [],
      meta: { type: "cash_flow", currency: "USD", period: {} },
    }),
  ) as MockFn,
  getOutstandingInvoices: mock(() =>
    Promise.resolve({
      summary: {
        count: 2,
        totalAmount: 300,
        currency: "USD",
        status: ["unpaid", "overdue"] as const,
      },
      meta: { type: "outstanding_invoices", currency: "USD" },
    }),
  ) as MockFn,
  getInboxStats: mock(() =>
    Promise.resolve({
      result: {
        newItems: 1,
        pendingItems: 0,
        analyzingItems: 0,
        suggestedMatches: 0,
        recentMatches: 2,
        totalItems: 1,
      },
      meta: {},
    }),
  ) as MockFn,
  getTrackedTime: mock(() =>
    Promise.resolve({
      totalDuration: 3600,
      from: "2026-01-01",
      to: "2026-03-31",
    }),
  ) as MockFn,
  getRecentDocuments: mock(() =>
    Promise.resolve({ data: [], total: 0 }),
  ) as MockFn,
  getCashBalance: mock(() =>
    Promise.resolve({
      totalBalance: 10_000,
      currency: "USD",
      accountCount: 1,
      accountBreakdown: [],
    }),
  ) as MockFn,
  getNetPosition: mock(() =>
    Promise.resolve({
      cash: 10_000,
      creditDebt: 2000,
      netPosition: 8000,
      currency: "USD",
      cashAccountCount: 1,
      creditAccountCount: 1,
    }),
  ) as MockFn,
  getSpendingForPeriod: mock(() =>
    Promise.resolve({
      totalSpending: 1500,
      currency: "USD",
      topCategory: null,
    }),
  ) as MockFn,
  getRecurringExpenses: mock(() =>
    Promise.resolve({
      summary: {
        totalMonthlyEquivalent: 400,
        totalExpenses: 1,
        currency: "USD",
        byFrequency: { weekly: 0, monthly: 400, annually: 0, irregular: 0 },
      },
      expenses: [],
      meta: { type: "recurring_expenses", currency: "USD" },
    }),
  ) as MockFn,
  getOverdueInvoicesAlert: mock(() =>
    Promise.resolve({
      summary: {
        count: 1,
        totalAmount: 99,
        currency: "USD",
        oldestDueDate: "2026-01-01",
        daysOverdue: 10,
      },
      meta: { type: "overdue_invoices_alert", currency: "USD" },
    }),
  ) as MockFn,
  getBillableHours: mock(() =>
    Promise.resolve({
      totalDuration: 7200,
      totalAmount: 500,
      earningsByCurrency: { USD: 500 },
      projectBreakdown: [],
      currency: "USD",
    }),
  ) as MockFn,
  getCustomerLifetimeValue: mock(() =>
    Promise.resolve({
      summary: {
        averageCLV: 1000,
        medianCLV: 800,
        totalCustomers: 3,
        activeCustomers: 2,
        averageLifespanDays: 365,
        currency: "USD",
      },
      topCustomers: [],
      meta: { type: "customer_lifetime_value", currency: "USD" },
    }),
  ) as MockFn,

  // Polar (billing)
  polarSubscriptionsList: mock(() =>
    Promise.resolve({ result: { items: [] as unknown[] } }),
  ) as MockFn,
  polarSubscriptionsUpdate: mock(() => Promise.resolve({})) as MockFn,

  // Notifications (activities)
  getActivities: mock(() =>
    Promise.resolve({
      data: [],
      meta: {
        cursor: null,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    }),
  ) as MockFn,
  updateActivityStatus: mock(() =>
    Promise.resolve({ id: "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2" }),
  ) as MockFn,
  updateAllActivitiesStatus: mock(() => Promise.resolve([])) as MockFn,

  // Notification settings
  getNotificationSettings: mock(() => Promise.resolve([])) as MockFn,
  getUserNotificationPreferences: mock(() => Promise.resolve([])) as MockFn,
  upsertNotificationSetting: mock(() =>
    Promise.resolve({
      id: "notif-setting-1",
      notificationType: "transaction",
      channel: "email",
      enabled: true,
    }),
  ) as MockFn,
  bulkUpdateNotificationSettings: mock(() =>
    Promise.resolve([
      {
        id: "notif-setting-1",
        notificationType: "transaction",
        channel: "email",
        enabled: true,
      },
    ]),
  ) as MockFn,

  // Apps
  getApps: mock(() => Promise.resolve([])) as MockFn,
  createApp: mock(() =>
    Promise.resolve({
      config: {},
      settings: {},
    }),
  ) as MockFn,
  addTelegramConnection: mock(() =>
    Promise.resolve({
      id: "telegram_app_123",
    }),
  ) as MockFn,
  addWhatsAppConnection: mock(() =>
    Promise.resolve({
      id: "whatsapp_app_123",
    }),
  ) as MockFn,
  consumePlatformLinkToken: mock(() =>
    Promise.resolve({
      code: "tst12345",
      provider: "slack",
      teamId: "test-team-id",
      userId: "test-user-id",
    }),
  ) as MockFn,
  createOrUpdatePlatformIdentity: mock(() =>
    Promise.resolve({
      id: "identity_123",
    }),
  ) as MockFn,
  createPlatformLinkToken: mock(() =>
    Promise.resolve({
      code: "tst12345",
      provider: "slack",
      teamId: "test-team-id",
      userId: "test-user-id",
    }),
  ) as MockFn,
  getAppBySlackTeamId: mock(() => Promise.resolve(null)) as MockFn,
  getPlatformIdentity: mock(() => Promise.resolve(null)) as MockFn,
  updatePlatformIdentityMetadata: mock(() => Promise.resolve(null)) as MockFn,

  // Bank connections
  getBankConnections: mock(() => Promise.resolve([])) as MockFn,
  deleteBankConnection: mock(() => Promise.resolve(null)) as MockFn,

  // Inbox accounts (tRPC inbox-accounts router)
  getInboxAccounts: mock(() => Promise.resolve([])) as MockFn,
  deleteInboxAccount: mock(() =>
    Promise.resolve({ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }),
  ) as MockFn,

  // Banking (exchange rates — internalProcedure.rates)
  getRates: mock(() => Promise.resolve([])) as MockFn,

  // Transaction attachments / tags
  deleteAttachment: mock(() =>
    Promise.resolve({ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }),
  ) as MockFn,
  createAttachments: mock(() => Promise.resolve([{ id: "att-1" }])) as MockFn,
  createTransactionTag: mock(() =>
    Promise.resolve([
      {
        teamId: "test-team-id",
        transactionId: "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
        tagId: "e2d3c4b5-a6f7-8901-bcde-f12345678901",
      },
    ]),
  ) as MockFn,
  deleteTransactionTag: mock(() => Promise.resolve({})) as MockFn,

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

  /** Next `withTeamPermission` resolution sees no team (UNAUTHORIZED edges). */
  simulateMissingTeamOnce() {
    mockDb.query.users.findFirst.mockImplementationOnce(() =>
      Promise.resolve({
        id: "test-user-id",
        teamId: null,
        email: "test@example.com",
        usersOnTeams: [],
      }),
    );
  },
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

    getInvoiceTemplates: mocks.getInvoiceTemplates,
    getInvoiceTemplateById: mocks.getInvoiceTemplateById,
    createInvoiceTemplate: mocks.createInvoiceTemplate,
    deleteInvoiceTemplate: mocks.deleteInvoiceTemplate,
    getInvoiceTemplateCount: mocks.getInvoiceTemplateCount,
    upsertInvoiceTemplate: mocks.upsertInvoiceTemplate,
    setDefaultTemplate: mocks.setDefaultTemplate,

    getInvoiceRecurringList: mocks.getInvoiceRecurringList,
    getInvoiceRecurringById: mocks.getInvoiceRecurringById,
    deleteInvoiceRecurring: mocks.deleteInvoiceRecurring,
    pauseInvoiceRecurring: mocks.pauseInvoiceRecurring,
    resumeInvoiceRecurring: mocks.resumeInvoiceRecurring,
    createInvoiceRecurring: mocks.createInvoiceRecurring,
    updateInvoiceRecurring: mocks.updateInvoiceRecurring,
    getUpcomingInvoices: mocks.getUpcomingInvoices,

    getInvoiceProducts: mocks.getInvoiceProducts,
    getInvoiceProductById: mocks.getInvoiceProductById,
    deleteInvoiceProduct: mocks.deleteInvoiceProduct,
    upsertInvoiceProduct: mocks.upsertInvoiceProduct,
    createInvoiceProduct: mocks.createInvoiceProduct,
    updateInvoiceProduct: mocks.updateInvoiceProduct,
    incrementProductUsage: mocks.incrementProductUsage,
    saveLineItemAsProduct: mocks.saveLineItemAsProduct,
    shouldSendNotification: createDefaultMock(),
    findRecentActivity: createDefaultMock(),
    getTeamMembers: createDefaultMock(),
    createActivity: createDefaultMock(),
    updateActivityMetadata: createDefaultMock(),

    // Customer functions
    getCustomers: mocks.getCustomers,
    getCustomerById: mocks.getCustomerById,
    createCustomer: mocks.createCustomer,
    updateCustomer: mocks.updateCustomer,
    deleteCustomer: mocks.deleteCustomer,
    upsertCustomer: mocks.upsertCustomer,
    getCustomerInvoiceSummary: mocks.getCustomerInvoiceSummary,
    clearCustomerEnrichment: mock(() => ({})),
    updateCustomerEnrichmentStatus: mock(() => ({})),
    toggleCustomerPortal: mocks.toggleCustomerPortal,
    getCustomerByPortalId: mocks.getCustomerByPortalId,
    getCustomerPortalInvoices: mocks.getCustomerPortalInvoices,

    // Bank account functions
    getBankAccounts: mocks.getBankAccounts,
    getBankAccountById: mocks.getBankAccountById,
    createBankAccount: mocks.createBankAccount,
    updateBankAccount: mocks.updateBankAccount,
    deleteBankAccount: mocks.deleteBankAccount,
    getBankAccountDetails: mocks.getBankAccountDetails,
    getBankAccountsBalances: mocks.getBankAccountsBalances,
    getBankAccountsCurrencies: mocks.getBankAccountsCurrencies,
    getBankAccountsWithPaymentInfo: mock(() => []),

    // Inbox functions
    getInboxItems: mocks.getInboxItems,
    getInboxItemById: mocks.getInboxItemById,
    updateInboxItem: mocks.updateInboxItem,
    deleteInboxItem: mocks.deleteInboxItem,
    getInbox: mocks.getInbox,
    getInboxById: mocks.getInboxById,
    createInbox: mocks.createInbox,
    updateInbox: mocks.updateInbox,
    deleteInbox: mocks.deleteInbox,
    deleteInboxMany: mocks.deleteInboxMany,
    getInboxByStatus: mocks.getInboxByStatus,
    getInboxSearch: mocks.getInboxSearch,
    getInboxAccounts: mocks.getInboxAccounts,
    getInboxAccountById: createDefaultMock(),
    upsertInboxAccount: createDefaultMock(),
    updateInboxAccount: createDefaultMock(),
    deleteInboxAccount: mocks.deleteInboxAccount,
    getInboxBlocklist: mock(() => []),
    createInboxBlocklist: mock(() => ({})),
    deleteInboxBlocklist: mock(() => ({})),
    checkInboxAttachments: mock(() => []),
    matchTransaction: mock(() => ({})),
    unmatchTransaction: mock(() => ({})),
    confirmSuggestedMatch: mock(() => ({})),
    declineSuggestedMatch: mock(() => ({})),

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
    updateTeamById: mocks.updateTeam,
    acceptTeamInvite: mocks.acceptTeamInvite,
    createTeam: mocks.createTeam,
    createTeamInvites: mocks.createTeamInvites,
    declineTeamInvite: mocks.declineTeamInvite,
    deleteTeam: mocks.deleteTeam,
    deleteTeamInvite: mocks.deleteTeamInvite,
    deleteTeamMember: mocks.deleteTeamMember,
    getAvailablePlans: mocks.getAvailablePlans,
    getBankConnections: mocks.getBankConnections,
    getInvitesByEmail: mocks.getInvitesByEmail,
    getTeamInvites: mocks.getTeamInvites,
    getTeamMemberRole: mocks.getTeamMemberRole,
    getTeamMembersByTeamId: mocks.getTeamMembersByTeamId,
    getTeamsByUserId: mocks.getTeamsByUserId,
    hasTeamAccess: mocks.hasTeamAccess,
    leaveTeam: mocks.leaveTeam,
    updateTeamMember: mocks.updateTeamMember,

    // Tags
    getTags: mock(() => Promise.resolve([])) as MockFn,
    createTag: mock(() =>
      Promise.resolve({
        id: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
        name: "Tag",
      }),
    ) as MockFn,
    updateTag: mock(() =>
      Promise.resolve({
        id: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
        name: "Updated",
      }),
    ) as MockFn,
    deleteTag: mock(() =>
      Promise.resolve({
        id: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
        name: "Deleted",
      }),
    ) as MockFn,

    // Users (additional query exports used by routers)
    getUserInvites: createDefaultMock(),
    switchUserTeam: mocks.switchUserTeam,
    deleteUser: mocks.deleteUser,

    // Transaction categories
    getCategories: createDefaultMock(),
    getCategoryById: createDefaultMock(),
    createTransactionCategory: createDefaultMock(),
    updateTransactionCategory: createDefaultMock(),
    deleteTransactionCategory: createDefaultMock(),

    // Tracker
    getTrackerRecordsByDate: mocks.getTrackerRecordsByDate,
    getTrackerRecordsByRange: mocks.getTrackerRecordsByRange,
    getTrackerProjects: mocks.getTrackerProjects,
    getTrackerProjectById: mocks.getTrackerProjectById,
    upsertTrackerProject: mocks.upsertTrackerProject,
    upsertTrackerEntries: mocks.upsertTrackerEntries,
    deleteTrackerEntry: mocks.deleteTrackerEntry,
    deleteTrackerProject: mocks.deleteTrackerProject,
    startTimer: mocks.startTimer,
    stopTimer: mocks.stopTimer,
    getCurrentTimer: mocks.getCurrentTimer,
    getTimerStatus: mocks.getTimerStatus,

    // Documents
    getDocuments: mocks.getDocuments,
    getDocumentById: mocks.getDocumentById,
    getRelatedDocuments: mocks.getRelatedDocuments,
    checkDocumentAttachments: mocks.checkDocumentAttachments,
    deleteDocument: mocks.deleteDocument,

    // Document tags & assignments
    getDocumentTags: mocks.getDocumentTags,
    createDocumentTag: mocks.createDocumentTag,
    createDocumentTagEmbedding: mocks.createDocumentTagEmbedding,
    deleteDocumentTag: mocks.deleteDocumentTag,
    createDocumentTagAssignment: mocks.createDocumentTagAssignment,
    deleteDocumentTagAssignment: mocks.deleteDocumentTagAssignment,

    // OAuth applications
    getOAuthApplicationsByTeam: mocks.getOAuthApplicationsByTeam,
    getOAuthApplicationById: mocks.getOAuthApplicationById,
    createOAuthApplication: mocks.createOAuthApplication,
    updateOAuthApplication: mocks.updateOAuthApplication,
    regenerateClientSecret: mocks.regenerateClientSecret,
    getUserAuthorizedApplications: mocks.getUserAuthorizedApplications,
    revokeUserApplicationTokens: mocks.revokeUserApplicationTokens,
    deleteOAuthApplication: mocks.deleteOAuthApplication,

    // Institutions
    getInstitutions: mocks.getInstitutions,
    getInstitutionById: mocks.getInstitutionById,
    updateInstitutionUsage: mocks.updateInstitutionUsage,

    // Short links
    getShortLinkByShortId: mocks.getShortLinkByShortId,
    createShortLink: mocks.createShortLink,
    updateDocumentProcessingStatus: createDefaultMock(),
    updateDocuments: createDefaultMock(),

    // Search
    globalSearchQuery: mocks.globalSearchQuery,
    globalSemanticSearchQuery: mocks.globalSemanticSearchQuery,

    // Reports
    getReports: mocks.getReports,
    getBurnRate: mocks.getBurnRate,
    getRunway: mocks.getRunway,
    getExpenses: mocks.getExpenses,
    getSpending: mocks.getSpending,
    getChartDataByLinkId: createDefaultMock(),
    getRevenueForecast: createDefaultMock(),
    getTaxSummary: mocks.getTaxSummary,
    createReport: mocks.createReport,
    getReportByLinkId: mocks.getReportByLinkId,

    // Validation
    validateAccessToken: mocks.validateAccessToken,

    // Notifications
    getActivities: mocks.getActivities,
    updateActivityStatus: mocks.updateActivityStatus,
    updateAllActivitiesStatus: mocks.updateAllActivitiesStatus,

    // Notification settings
    getNotificationSettings: mocks.getNotificationSettings,
    getUserNotificationPreferences: mocks.getUserNotificationPreferences,
    upsertNotificationSetting: mocks.upsertNotificationSetting,
    bulkUpdateNotificationSettings: mocks.bulkUpdateNotificationSettings,

    // Apps
    addTelegramConnection: mocks.addTelegramConnection,
    addWhatsAppConnection: mocks.addWhatsAppConnection,
    consumePlatformLinkToken: mocks.consumePlatformLinkToken,
    getApps: mocks.getApps,
    createApp: mocks.createApp,
    createOrUpdatePlatformIdentity: mocks.createOrUpdatePlatformIdentity,
    createPlatformLinkToken: mocks.createPlatformLinkToken,
    getAppBySlackTeamId: mocks.getAppBySlackTeamId,
    getPlatformIdentity: mocks.getPlatformIdentity,
    updatePlatformIdentityMetadata: mocks.updatePlatformIdentityMetadata,
    getAppByAppId: createDefaultMock(),
    deleteApp: createDefaultMock(),

    // Accounting sync
    getAccountingSyncStatus: createDefaultMock(),

    // Bank connections
    deleteBankConnection: mocks.deleteBankConnection,

    // Transaction attachments / tags
    createAttachments: mocks.createAttachments,
    deleteAttachment: mocks.deleteAttachment,
    createTransactionTag: mocks.createTransactionTag,
    deleteTransactionTag: mocks.deleteTransactionTag,

    // Apps (mutations on router)
    disconnectApp: createDefaultMock(),
    updateAppSettings: createDefaultMock(),
    updateAppSettingsBulk: createDefaultMock(),
    removeWhatsAppConnection: createDefaultMock(),

    // Bank connections (mutations on router)
    addProviderAccounts: createDefaultMock(),
    createBankConnection: createDefaultMock(),
    reconnectBankConnection: createDefaultMock(),

    // OAuth applications router (additional @midday/db/queries named imports)
    claimDCRApplication: createDefaultMock(),
    createAuthorizationCode: createDefaultMock(),
    getOAuthApplicationByClientId: createDefaultMock(),
    hasUserEverAuthorizedApp: createDefaultMock(),
    updateOAuthApplicationstatus: createDefaultMock(),

    getBillableHours: mocks.getBillableHours,
    getCashBalance: mocks.getCashBalance,
    getCashFlow: mocks.getCashFlow,
    getCustomerLifetimeValue: mocks.getCustomerLifetimeValue,
    getGrowthRate: mocks.getGrowthRate,
    getInboxStats: mocks.getInboxStats,
    getNetPosition: mocks.getNetPosition,
    getOutstandingInvoices: mocks.getOutstandingInvoices,
    getOverdueInvoicesAlert: mocks.getOverdueInvoicesAlert,
    getProfitMargin: mocks.getProfitMargin,
    getRecentDocuments: mocks.getRecentDocuments,
    getRecurringExpenses: mocks.getRecurringExpenses,
    getSpendingForPeriod: mocks.getSpendingForPeriod,
    getTrackedTime: mocks.getTrackedTime,

    // Bank accounts router
    getTransactionCountByBankAccountId:
      mocks.getTransactionCountByBankAccountId,
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

const noop = () => undefined;
const createMockLogger = () => ({
  info: mock(noop),
  error: mock(noop),
  warn: mock(noop),
  debug: mock(noop),
  trace: mock(noop),
  fatal: mock(noop),
});
const mockLogger = createMockLogger();
mock.module("@midday/logger", () => ({
  logger: mockLogger,
  default: mockLogger,
  createLoggerWithContext: () => createMockLogger(),
  setLogLevel: mock(noop),
}));

mock.module("@midday/cache/api-key-cache", () => ({
  apiKeyCache: {
    delete: mock(() => Promise.resolve()),
    get: mock(() => Promise.resolve(null)),
    set: mock(() => Promise.resolve()),
  },
}));

// Mock @midday/supabase/storage
mock.module("@midday/supabase/storage", () => ({
  signedUrl: mocks.signedUrl,
  remove: mock(() => Promise.resolve({ error: null })),
  download: mock(() =>
    Promise.resolve({ data: null, error: new Error("not used in tests") }),
  ),
}));

// Mock @midday/job-client
mock.module("@midday/job-client", () => ({
  triggerJob: mocks.triggerJob,
  getJobStatus: mocks.getJobStatus,
  getQueue: mock(() => ({
    getJob: mock(() => null),
    getJobs: mock(() => []),
  })),
  decodeJobId: mock((id: string) => ({ id, queue: "default" })),
}));

mock.module("@midday/notifications", () => ({
  Notifications: class {
    create() {
      return Promise.resolve();
    }
  },
}));

mock.module("@midday/documents/embed", () => ({
  Embed: class {
    async embed(_content: string) {
      return {
        embedding: [0, 0, 0],
        model: "gemini-embedding-001",
      };
    }
  },
}));

mock.module("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: mock(() => Promise.resolve({ id: "evt_trigger_test" })),
  },
  schedules: {
    del: mock(() => Promise.resolve()),
  },
}));

// Mock @midday/import
mock.module("@midday/import", () => ({
  formatAmountValue: mocks.formatAmountValue,
  compactSampleRows: mock(
    (rows: Record<string, string>[]) => rows?.slice(0, 2) ?? [],
  ),
  selectPromptColumns: mock((cols: string[]) => cols ?? []),
  buildCsvMappingPrompt: mock(() => "mock-csv-mapping-prompt"),
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
  PdfTemplate: mock(async () => ({})),
  renderToStream: mock(() =>
    Promise.resolve(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
          controller.close();
        },
      }),
    ),
  ),
}));

// Mock @api/services/supabase
mock.module("@api/services/supabase", () => ({
  createClient: mock(async () => ({})),
  createAdminClient: mock(async () => ({
    auth: {
      admin: {
        deleteUser: (...args: unknown[]) =>
          mocks.supabaseAdminDeleteUser(...args),
      },
    },
  })),
}));

mock.module("@api/services/resend", () => ({
  resend: {
    emails: {
      send: (...args: unknown[]) => mocks.resendEmailsSend(...args),
    },
    contacts: {
      remove: (...args: unknown[]) => mocks.resendContactsRemove(...args),
    },
  },
}));

// Mock @api/utils/auth - needed by tRPC init
mock.module("@api/utils/polar", () => ({
  api: {
    checkouts: {
      create: mock(() =>
        Promise.resolve({ url: "https://polar.test/checkout" }),
      ),
    },
    customers: {
      getExternal: mock(() => Promise.resolve({ id: "polar-customer-id" })),
      create: mock(() => Promise.resolve({ id: "polar-customer-id" })),
      list: mock(() =>
        Promise.resolve({ result: { items: [{ id: "polar-customer-id" }] } }),
      ),
    },
    orders: {
      list: mock(() => Promise.reject(new Error("polar not configured"))),
      get: mock(() => Promise.reject(new Error("polar not configured"))),
      generateInvoice: mock(() => Promise.resolve({})),
      invoice: mock(() => Promise.reject(new Error("polar not configured"))),
    },
    customerSessions: {
      create: mock(() =>
        Promise.resolve({ customerPortalUrl: "https://polar.test/portal" }),
      ),
    },
    subscriptions: {
      list: mocks.polarSubscriptionsList,
      update: mocks.polarSubscriptionsUpdate,
    },
  },
}));

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
    invalidateForUser: mock(async () => {}),
  },
}));

mock.module("@midday/accounting", () => ({
  getAccountingProvider: mock(() => ({
    getAccounts: mock(() => Promise.resolve([])),
  })),
  getOrgId: mock((config: any) => config?.tenantId ?? "org-1"),
  getOrgName: mock((config: any) => config?.tenantName ?? null),
  AccountingProviderConfigSchema: {
    parse: mock((v: any) => v),
  },
  parseProviderConfig: mock((v: any) => v),
}));

mock.module("@midday/banking", () => ({
  getRates: mocks.getRates,
  getProviderErrorDetails: mock((error: unknown) => ({
    message: error instanceof Error ? error.message : String(error),
  })),
  ProviderError: class ProviderError extends Error {
    code: string;
    constructor(message: string, code = "unknown") {
      super(message);
      this.name = "ProviderError";
      this.code = code;
    }
  },
  PlaidApi: class PlaidApi {
    linkTokenCreate = mock(() =>
      Promise.reject(new Error("PlaidApi not mocked")),
    );
    itemPublicTokenExchange = mock(() =>
      Promise.reject(new Error("PlaidApi not mocked")),
    );
  },
  GoCardLessApi: class GoCardLessApi {
    buildLink = mock(() =>
      Promise.reject(new Error("GoCardLessApi not mocked")),
    );
    createEndUserAgreement = mock(() =>
      Promise.reject(new Error("GoCardLessApi not mocked")),
    );
    getRequisitionByReference = mock(() =>
      Promise.reject(new Error("GoCardLessApi not mocked")),
    );
  },
  EnableBankingApi: class EnableBankingApi {
    authenticate = mock(() =>
      Promise.reject(new Error("EnableBankingApi not mocked")),
    );
    exchangeCode = mock(() =>
      Promise.reject(new Error("EnableBankingApi not mocked")),
    );
  },
  Provider: class Provider {
    getConnectionStatus = mock(() =>
      Promise.reject(new Error("Provider not mocked")),
    );
    deleteConnection = mock(() =>
      Promise.reject(new Error("Provider not mocked")),
    );
    getAccounts = mock(() => Promise.reject(new Error("Provider not mocked")));
    getAccountBalance = mock(() =>
      Promise.reject(new Error("Provider not mocked")),
    );
    getTransactions = mock(() =>
      Promise.reject(new Error("Provider not mocked")),
    );
  },
}));
