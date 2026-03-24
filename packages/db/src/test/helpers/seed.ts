import type { Database } from "../../client";
import {
  bankAccounts,
  bankConnections,
  exchangeRates,
  invoices,
  teams,
  transactionCategories,
  transactions,
  users,
} from "../../schema";

// ─── Deterministic IDs ───────────────────────────────────────────────────────
// Using fixed UUIDs so tests can reference specific records.

export const TEAM_USD_ID = "00000000-0000-0000-0000-000000000001";
export const TEAM_EUR_ID = "00000000-0000-0000-0000-000000000002";

// Category IDs (team-usd)
const CAT_IDS = {
  revenue: "10000000-0000-0000-0000-000000000001",
  income: "10000000-0000-0000-0000-000000000002",
  productSales: "10000000-0000-0000-0000-000000000003",
  consultingRevenue: "10000000-0000-0000-0000-000000000004",
  customerRefunds: "10000000-0000-0000-0000-000000000005",
  cogsParent: "10000000-0000-0000-0000-000000000006",
  materials: "10000000-0000-0000-0000-000000000007",
  directLabor: "10000000-0000-0000-0000-000000000008",
  officeSupplies: "10000000-0000-0000-0000-000000000009",
  software: "10000000-0000-0000-0000-000000000010",
  travel: "10000000-0000-0000-0000-000000000011",
  rent: "10000000-0000-0000-0000-000000000012",
  marketing: "10000000-0000-0000-0000-000000000013",
  creditCardPayment: "10000000-0000-0000-0000-000000000014",
  internalTransfer: "10000000-0000-0000-0000-000000000015",
};

// Category IDs (team-eur)
const CAT_EUR_IDS = {
  revenue: "20000000-0000-0000-0000-000000000001",
  officeSupplies: "20000000-0000-0000-0000-000000000002",
};

// User ID
export const TEST_USER_ID = "00000000-0000-0000-0000-000000000099";

// Bank account IDs
export const BANK_CONN_ID = "30000000-0000-0000-0000-000000000001";
export const BANK_USD_CHECKING_ID = "40000000-0000-0000-0000-000000000001";
export const BANK_USD_SAVINGS_ID = "40000000-0000-0000-0000-000000000002";
export const BANK_EUR_ACCOUNT_ID = "40000000-0000-0000-0000-000000000003";
export const BANK_CREDIT_CARD_ID = "40000000-0000-0000-0000-000000000004";

// Invoice IDs
export const INV_UNPAID_1 = "50000000-0000-0000-0000-000000000001";
export const INV_UNPAID_2 = "50000000-0000-0000-0000-000000000002";
export const INV_OVERDUE_1 = "50000000-0000-0000-0000-000000000003";
export const INV_OVERDUE_2 = "50000000-0000-0000-0000-000000000004";
export const INV_PAID = "50000000-0000-0000-0000-000000000005";

export async function seedAll(db: Database): Promise<void> {
  await seedUsers(db);
  await seedTeams(db);
  await seedCategories(db);
  await seedBankAccounts(db);
  await seedExchangeRates(db);
  await seedInvoices(db);
  await seedTransactions(db);
}

async function seedUsers(db: Database): Promise<void> {
  await db.insert(users).values([
    {
      id: TEST_USER_ID,
      fullName: "Test User",
      email: "test@midday.ai",
      teamId: null,
    },
  ]);
}

async function seedTeams(db: Database): Promise<void> {
  await db.insert(teams).values([
    {
      id: TEAM_USD_ID,
      name: "Test Co USD",
      baseCurrency: "USD",
      inboxId: "test-usd-inbox",
    },
    {
      id: TEAM_EUR_ID,
      name: "Test Co EUR",
      baseCurrency: "EUR",
      inboxId: "test-eur-inbox",
    },
  ]);
}

async function seedCategories(db: Database): Promise<void> {
  // Team USD categories
  await db.insert(transactionCategories).values([
    // Revenue categories (members of REVENUE_CATEGORIES)
    {
      id: CAT_IDS.revenue,
      teamId: TEAM_USD_ID,
      slug: "revenue",
      name: "Revenue",
      system: true,
      excluded: false,
    },
    {
      id: CAT_IDS.income,
      teamId: TEAM_USD_ID,
      slug: "income",
      name: "Income",
      system: true,
      excluded: false,
    },
    {
      id: CAT_IDS.productSales,
      teamId: TEAM_USD_ID,
      slug: "product-sales",
      name: "Product Sales",
      system: true,
      excluded: false,
    },
    {
      id: CAT_IDS.consultingRevenue,
      teamId: TEAM_USD_ID,
      slug: "consulting-revenue",
      name: "Consulting Revenue",
      system: true,
      excluded: false,
    },

    // Contra-revenue (member of CONTRA_REVENUE_CATEGORIES)
    {
      id: CAT_IDS.customerRefunds,
      teamId: TEAM_USD_ID,
      slug: "customer-refunds",
      name: "Customer Refunds",
      system: true,
      excluded: false,
    },

    // COGS parent (NOT itself counted as COGS in profit calc — only children are)
    {
      id: CAT_IDS.cogsParent,
      teamId: TEAM_USD_ID,
      slug: "cost-of-goods-sold",
      name: "Cost of Goods Sold",
      system: true,
      excluded: false,
    },
    // COGS children
    {
      id: CAT_IDS.materials,
      teamId: TEAM_USD_ID,
      slug: "materials",
      name: "Materials",
      system: true,
      excluded: false,
      parentId: CAT_IDS.cogsParent,
    },
    {
      id: CAT_IDS.directLabor,
      teamId: TEAM_USD_ID,
      slug: "direct-labor",
      name: "Direct Labor",
      system: true,
      excluded: false,
      parentId: CAT_IDS.cogsParent,
    },

    // Regular expense categories
    {
      id: CAT_IDS.officeSupplies,
      teamId: TEAM_USD_ID,
      slug: "office-supplies",
      name: "Office Supplies",
      system: true,
      excluded: false,
    },
    {
      id: CAT_IDS.software,
      teamId: TEAM_USD_ID,
      slug: "software",
      name: "Software",
      system: true,
      excluded: false,
      taxRate: 20,
      taxType: "vat",
    },
    {
      id: CAT_IDS.travel,
      teamId: TEAM_USD_ID,
      slug: "travel",
      name: "Travel",
      system: true,
      excluded: false,
    },
    {
      id: CAT_IDS.rent,
      teamId: TEAM_USD_ID,
      slug: "rent",
      name: "Rent",
      system: true,
      excluded: false,
    },
    {
      id: CAT_IDS.marketing,
      teamId: TEAM_USD_ID,
      slug: "marketing",
      name: "Marketing",
      system: true,
      excluded: false,
      taxRate: 10,
      taxType: "sales_tax",
    },

    // EXCLUDED categories — these MUST NOT appear in any financial calculation
    {
      id: CAT_IDS.creditCardPayment,
      teamId: TEAM_USD_ID,
      slug: "credit-card-payment",
      name: "Credit Card Payment",
      system: true,
      excluded: true,
    },
    {
      id: CAT_IDS.internalTransfer,
      teamId: TEAM_USD_ID,
      slug: "internal-transfer",
      name: "Internal Transfer",
      system: true,
      excluded: true,
    },
  ]);

  // Team EUR categories (for isolation testing)
  await db.insert(transactionCategories).values([
    {
      id: CAT_EUR_IDS.revenue,
      teamId: TEAM_EUR_ID,
      slug: "revenue",
      name: "Revenue",
      system: true,
      excluded: false,
    },
    {
      id: CAT_EUR_IDS.officeSupplies,
      teamId: TEAM_EUR_ID,
      slug: "office-supplies",
      name: "Office Supplies",
      system: true,
      excluded: false,
    },
  ]);
}

async function seedBankAccounts(db: Database): Promise<void> {
  await db.insert(bankConnections).values([
    {
      id: BANK_CONN_ID,
      institutionId: "test-institution",
      teamId: TEAM_USD_ID,
      name: "Test Bank",
      provider: "plaid",
    },
  ]);

  await db.insert(bankAccounts).values([
    {
      id: BANK_USD_CHECKING_ID,
      teamId: TEAM_USD_ID,
      createdBy: TEST_USER_ID,
      accountId: "acct-usd-checking",
      name: "Business Checking",
      type: "depository",
      balance: 50000,
      currency: "USD",
      baseBalance: 50000,
      baseCurrency: "USD",
      bankConnectionId: BANK_CONN_ID,
      enabled: true,
    },
    {
      id: BANK_USD_SAVINGS_ID,
      teamId: TEAM_USD_ID,
      createdBy: TEST_USER_ID,
      accountId: "acct-usd-savings",
      name: "Business Savings",
      type: "depository",
      balance: 25000,
      currency: "USD",
      baseBalance: 25000,
      baseCurrency: "USD",
      bankConnectionId: BANK_CONN_ID,
      enabled: true,
    },
    {
      id: BANK_EUR_ACCOUNT_ID,
      teamId: TEAM_USD_ID,
      createdBy: TEST_USER_ID,
      accountId: "acct-eur-operating",
      name: "EUR Operating",
      type: "depository",
      balance: 10000,
      currency: "EUR",
      baseBalance: 11000,
      baseCurrency: "USD",
      bankConnectionId: BANK_CONN_ID,
      enabled: true,
    },
    {
      id: BANK_CREDIT_CARD_ID,
      teamId: TEAM_USD_ID,
      createdBy: TEST_USER_ID,
      accountId: "acct-credit-card",
      name: "Company Credit Card",
      type: "credit",
      balance: -5000,
      currency: "USD",
      baseBalance: -5000,
      baseCurrency: "USD",
      bankConnectionId: BANK_CONN_ID,
      enabled: true,
    },
  ]);
}

async function seedExchangeRates(db: Database): Promise<void> {
  await db.insert(exchangeRates).values([
    { base: "EUR", target: "USD", rate: "1.10" },
    { base: "GBP", target: "USD", rate: "1.27" },
    { base: "USD", target: "EUR", rate: "0.91" },
    { base: "GBP", target: "EUR", rate: "1.15" },
  ]);
}

async function seedInvoices(db: Database): Promise<void> {
  await db.insert(invoices).values([
    {
      id: INV_UNPAID_1,
      teamId: TEAM_USD_ID,
      status: "unpaid",
      amount: 5000,
      currency: "USD",
      dueDate: "2024-04-15",
      invoiceNumber: "INV-001",
    },
    {
      id: INV_UNPAID_2,
      teamId: TEAM_USD_ID,
      status: "unpaid",
      amount: 3000,
      currency: "EUR",
      dueDate: "2024-04-20",
      invoiceNumber: "INV-002",
    },
    {
      id: INV_OVERDUE_1,
      teamId: TEAM_USD_ID,
      status: "overdue",
      amount: 2000,
      currency: "USD",
      dueDate: "2024-01-15",
      invoiceNumber: "INV-003",
    },
    {
      id: INV_OVERDUE_2,
      teamId: TEAM_USD_ID,
      status: "overdue",
      amount: 1500,
      currency: "USD",
      dueDate: "2024-02-10",
      invoiceNumber: "INV-004",
    },
    {
      id: INV_PAID,
      teamId: TEAM_USD_ID,
      status: "paid",
      amount: 10000,
      currency: "USD",
      dueDate: "2024-01-01",
      invoiceNumber: "INV-005",
    },
  ]);
}

async function seedTransactions(db: Database): Promise<void> {
  await db.insert(transactions).values([
    // ═══════════════════════════════════════════════════════════════════════
    // JANUARY 2024 — Revenue
    // ═══════════════════════════════════════════════════════════════════════

    // R1: Standard USD revenue with transaction-level 20% tax
    // Gross: 5000 | Net: ROUND(5000 - 5000*20/120, 2) = 4166.67
    {
      id: "a0000000-0000-0000-0000-00000000aa01",
      date: "2024-01-15",
      name: "Invoice Alpha",
      method: "payment",
      amount: 5000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "R1",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 5000,
      baseCurrency: "USD",
      taxRate: 20,
      recurring: false,
    },

    // R2: EUR revenue converted to USD via baseAmount
    // When querying USD: uses baseAmount=4400 | When querying EUR: uses amount=4000
    // No tax → Gross=Net=4400 (USD) or 4000 (EUR)
    {
      id: "a0000000-0000-0000-0000-00000000aa02",
      date: "2024-01-20",
      name: "Invoice Beta EUR",
      method: "payment",
      amount: 4000,
      currency: "EUR",
      teamId: TEAM_USD_ID,
      internalId: "R2",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 4400,
      baseCurrency: "USD",
      recurring: false,
    },

    // R3: Product sales with 10% tax
    // Gross: 2000 | Net: ROUND(2000 - 2000*10/110, 2) = 1818.18
    {
      id: "a0000000-0000-0000-0000-00000000aa03",
      date: "2024-01-25",
      name: "Product Sale Q1",
      method: "payment",
      amount: 2000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "R3",
      status: "posted",
      internal: false,
      categorySlug: "product-sales",
      baseAmount: 2000,
      baseCurrency: "USD",
      taxRate: 10,
      recurring: false,
    },

    // FX1: GBP revenue with baseAmount converted to USD
    // Gross in USD: 2500 | No tax → Net=2500
    {
      id: "a0000000-0000-0000-0000-00000000af01",
      date: "2024-01-12",
      name: "GBP Client Payment",
      method: "payment",
      amount: 2000,
      currency: "GBP",
      teamId: TEAM_USD_ID,
      internalId: "FX1",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 2500,
      baseCurrency: "USD",
      recurring: false,
    },

    // FX2: EUR revenue with NULL baseAmount (not yet converted)
    // Converted via exchange rate fallback: 1500 * 1.10 (EUR→USD) = 1650 USD
    // Also included when inputCurrency=EUR (currency matches, uses amount=1500)
    {
      id: "a0000000-0000-0000-0000-00000000af02",
      date: "2024-01-14",
      name: "EUR Pending Conversion",
      method: "payment",
      amount: 1500,
      currency: "EUR",
      teamId: TEAM_USD_ID,
      internalId: "FX2",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: null,
      baseCurrency: "USD",
      recurring: false,
    },

    // FX3: CHF revenue with no exchange rate — tests NULL rate exclusion
    // No CHF→USD rate seeded, so resolvedAmount returns NULL → excluded from totals
    {
      id: "a0000000-0000-0000-0000-00000000af03",
      date: "2024-01-16",
      name: "CHF Client Payment",
      method: "payment",
      amount: 800,
      currency: "CHF",
      teamId: TEAM_USD_ID,
      internalId: "FX3",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: null,
      baseCurrency: "USD",
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // JANUARY 2024 — Expenses
    // ═══════════════════════════════════════════════════════════════════════

    // E1: Recurring rent expense, no tax
    {
      id: "a0000000-0000-0000-0000-00000000ae01",
      date: "2024-01-05",
      name: "Office Rent January",
      method: "transfer",
      amount: -4000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "E1",
      status: "posted",
      internal: false,
      categorySlug: "rent",
      baseAmount: -4000,
      baseCurrency: "USD",
      recurring: true,
      frequency: "monthly",
    },

    // E2: Recurring software, no tx tax (category has taxRate=20 for tax summary fallback)
    {
      id: "a0000000-0000-0000-0000-00000000ae02",
      date: "2024-01-10",
      name: "SaaS Subscription",
      method: "card_purchase",
      amount: -200,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "E2",
      status: "posted",
      internal: false,
      categorySlug: "software",
      baseAmount: -200,
      baseCurrency: "USD",
      recurring: true,
      frequency: "monthly",
    },

    // E3: Non-recurring travel, no tax
    {
      id: "a0000000-0000-0000-0000-00000000ae03",
      date: "2024-01-18",
      name: "Business Trip Flight",
      method: "card_purchase",
      amount: -600,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "E3",
      status: "posted",
      internal: false,
      categorySlug: "travel",
      baseAmount: -600,
      baseCurrency: "USD",
      recurring: false,
    },

    // E4: Multi-currency expense (EUR→USD) with transaction-level 20% tax
    // baseAmount=-550 USD used for calculations
    {
      id: "a0000000-0000-0000-0000-00000000ae04",
      date: "2024-01-22",
      name: "EUR Conference Fee",
      method: "card_purchase",
      amount: -500,
      currency: "EUR",
      teamId: TEAM_USD_ID,
      internalId: "E4",
      status: "posted",
      internal: false,
      categorySlug: "travel",
      baseAmount: -550,
      baseCurrency: "USD",
      taxRate: 20,
      recurring: false,
    },

    // EFX1: EUR expense with NULL baseAmount — tests exchange rate fallback on expenses
    // Converted via exchange rate: -400 * 1.10 (EUR→USD) = -440 USD
    {
      id: "a0000000-0000-0000-0000-00000000ae08",
      date: "2024-01-28",
      name: "EUR Software Service",
      method: "card_purchase",
      amount: -400,
      currency: "EUR",
      teamId: TEAM_USD_ID,
      internalId: "EFX1",
      status: "posted",
      internal: false,
      categorySlug: "travel",
      baseAmount: null,
      baseCurrency: "USD",
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // JANUARY 2024 — Excluded category transactions (MUST NOT affect any calc)
    // ═══════════════════════════════════════════════════════════════════════

    // X1: Credit card payment — would double-count expenses if included
    {
      id: "a0000000-0000-0000-0000-0000000b0001",
      date: "2024-01-08",
      name: "CC Payment Jan",
      method: "transfer",
      amount: -5000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "X1",
      status: "posted",
      internal: false,
      categorySlug: "credit-card-payment",
      baseAmount: -5000,
      baseCurrency: "USD",
      recurring: false,
    },

    // X2: Internal transfer — moving money between own accounts
    {
      id: "a0000000-0000-0000-0000-0000000b0002",
      date: "2024-01-28",
      name: "Transfer to Savings",
      method: "transfer",
      amount: -3000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "X2",
      status: "posted",
      internal: false,
      categorySlug: "internal-transfer",
      baseAmount: -3000,
      baseCurrency: "USD",
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FEBRUARY 2024 — Revenue + status/internal filtering tests
    // ═══════════════════════════════════════════════════════════════════════

    // R4: Product sales with 10% tax
    // Gross: 2000 | Net: 1818.18
    {
      id: "a0000000-0000-0000-0000-00000000ab01",
      date: "2024-02-10",
      name: "Product Sale Feb",
      method: "payment",
      amount: 2000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "R4",
      status: "posted",
      internal: false,
      categorySlug: "product-sales",
      baseAmount: 2000,
      baseCurrency: "USD",
      taxRate: 10,
      recurring: false,
    },

    // R5: Customer refund (CONTRA_REVENUE) — excluded from revenue, included in cash flow
    {
      id: "a0000000-0000-0000-0000-00000000ab02",
      date: "2024-02-15",
      name: "Customer Refund",
      method: "payment",
      amount: 500,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "R5",
      status: "posted",
      internal: false,
      categorySlug: "customer-refunds",
      baseAmount: 500,
      baseCurrency: "USD",
      recurring: false,
    },

    // S1: status=excluded — MUST be filtered from all calculations
    {
      id: "a0000000-0000-0000-0000-0000000c0001",
      date: "2024-02-05",
      name: "Excluded Status Revenue",
      method: "payment",
      amount: 1000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "S1",
      status: "excluded",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 1000,
      baseCurrency: "USD",
      recurring: false,
    },

    // S2: internal=true — MUST be filtered from all calculations
    {
      id: "a0000000-0000-0000-0000-0000000c0002",
      date: "2024-02-06",
      name: "Internal Revenue",
      method: "transfer",
      amount: 2000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "S2",
      status: "posted",
      internal: true,
      categorySlug: "revenue",
      baseAmount: 2000,
      baseCurrency: "USD",
      recurring: false,
    },

    // S3: status=pending — MUST be included
    {
      id: "a0000000-0000-0000-0000-0000000c0003",
      date: "2024-02-07",
      name: "Pending Revenue",
      method: "payment",
      amount: 500,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "S3",
      status: "pending",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 500,
      baseCurrency: "USD",
      recurring: false,
    },

    // S4: status=archived — MUST be included
    {
      id: "a0000000-0000-0000-0000-0000000c0004",
      date: "2024-02-08",
      name: "Archived Income",
      method: "payment",
      amount: 300,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "S4",
      status: "archived",
      internal: false,
      categorySlug: "income",
      baseAmount: 300,
      baseCurrency: "USD",
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FEBRUARY 2024 — COGS transactions
    // ═══════════════════════════════════════════════════════════════════════

    // C1: Materials (COGS child)
    {
      id: "a0000000-0000-0000-0000-00000000ac01",
      date: "2024-02-12",
      name: "Raw Materials Purchase",
      method: "card_purchase",
      amount: -1500,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "C1",
      status: "posted",
      internal: false,
      categorySlug: "materials",
      baseAmount: -1500,
      baseCurrency: "USD",
      recurring: false,
    },

    // C2: Direct labor (COGS child)
    {
      id: "a0000000-0000-0000-0000-00000000ac02",
      date: "2024-02-18",
      name: "Contractor Payment",
      method: "transfer",
      amount: -800,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "C2",
      status: "posted",
      internal: false,
      categorySlug: "direct-labor",
      baseAmount: -800,
      baseCurrency: "USD",
      recurring: false,
    },

    // X3: Excluded category in February
    {
      id: "a0000000-0000-0000-0000-0000000b0003",
      date: "2024-02-20",
      name: "CC Payment Feb",
      method: "transfer",
      amount: -2000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "X3",
      status: "posted",
      internal: false,
      categorySlug: "credit-card-payment",
      baseAmount: -2000,
      baseCurrency: "USD",
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MARCH 2024 — Tax edge cases + category tax fallback
    // ═══════════════════════════════════════════════════════════════════════

    // R6: Revenue with 15% tax
    // Gross: 4000 | Net: ROUND(4000 - 4000*15/115, 2) = 3478.26
    {
      id: "a0000000-0000-0000-0000-00000000ac03",
      date: "2024-03-01",
      name: "March Invoice",
      method: "payment",
      amount: 4000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "R6",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 4000,
      baseCurrency: "USD",
      taxRate: 15,
      recurring: false,
    },

    // R7: GBP revenue with NULL baseAmount AND NULL baseCurrency
    // Excluded when no inputCurrency | Included when inputCurrency=GBP
    {
      id: "a0000000-0000-0000-0000-00000000ac04",
      date: "2024-03-10",
      name: "GBP Unconverted Invoice",
      method: "payment",
      amount: 3000,
      currency: "GBP",
      teamId: TEAM_USD_ID,
      internalId: "R7",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: null,
      baseCurrency: null,
      recurring: false,
    },

    // R8: Explicit taxRate=0 (different from NULL — COALESCE picks 0, not category rate)
    // Gross: 1000 | Net: 1000 (0 tax)
    {
      id: "a0000000-0000-0000-0000-00000000ac05",
      date: "2024-03-15",
      name: "Tax Exempt Consulting",
      method: "payment",
      amount: 1000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "R8",
      status: "posted",
      internal: false,
      categorySlug: "consulting-revenue",
      baseAmount: 1000,
      baseCurrency: "USD",
      taxRate: 0,
      recurring: false,
    },

    // E5: Software expense — tx taxRate=NULL, category taxRate=20 (fallback test)
    {
      id: "a0000000-0000-0000-0000-00000000ae05",
      date: "2024-03-20",
      name: "Software License Q1",
      method: "card_purchase",
      amount: -500,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "E5",
      status: "posted",
      internal: false,
      categorySlug: "software",
      baseAmount: -500,
      baseCurrency: "USD",
      recurring: false,
    },

    // E6: Marketing expense — tx taxRate=NULL, category taxRate=10 (fallback test)
    {
      id: "a0000000-0000-0000-0000-00000000ae06",
      date: "2024-03-25",
      name: "Ad Campaign",
      method: "card_purchase",
      amount: -300,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "E6",
      status: "posted",
      internal: false,
      categorySlug: "marketing",
      baseAmount: -300,
      baseCurrency: "USD",
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // APRIL 2024 — EMPTY (gap month, verifies zero-filling)
    // ═══════════════════════════════════════════════════════════════════════
    // No transactions intentionally.

    // ═══════════════════════════════════════════════════════════════════════
    // MAY 2024 — Decimal precision edge cases
    // ═══════════════════════════════════════════════════════════════════════

    // R9: Tiny amount — tests ROUND at small scale
    // Gross: 0.01 | Net: ROUND(0.01 - 0.01*20/120, 2) = ROUND(0.008333, 2) = 0.01
    {
      id: "a0000000-0000-0000-0000-00000000ad01",
      date: "2024-05-01",
      name: "Micro Payment",
      method: "payment",
      amount: 0.01,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "R9",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 0.01,
      baseCurrency: "USD",
      taxRate: 20,
      recurring: false,
    },

    // R10: Large amount — tests no overflow in numeric(10,2)
    // Gross: 99999.99 | Net: ROUND(99999.99 - 99999.99*25/125, 2) = 79999.99
    {
      id: "a0000000-0000-0000-0000-00000000ad02",
      date: "2024-05-15",
      name: "Enterprise Contract",
      method: "payment",
      amount: 99999.99,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "R10",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 99999.99,
      baseCurrency: "USD",
      taxRate: 25,
      recurring: false,
    },

    // E7: Tiny expense — tests small amounts not lost
    {
      id: "a0000000-0000-0000-0000-00000000ae07",
      date: "2024-05-10",
      name: "Bank Fee",
      method: "fee",
      amount: -0.01,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "E7",
      status: "posted",
      internal: false,
      categorySlug: "office-supplies",
      baseAmount: -0.01,
      baseCurrency: "USD",
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // JUNE 2024 — Uncategorized transaction
    // ═══════════════════════════════════════════════════════════════════════

    // U1: No category — should appear in burn rate + cash flow, NOT in revenue
    {
      id: "a0000000-0000-0000-0000-0000000d0001",
      date: "2024-06-01",
      name: "Uncategorized Expense",
      method: "card_purchase",
      amount: -750,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "U1",
      status: "posted",
      internal: false,
      categorySlug: null,
      baseAmount: -750,
      baseCurrency: "USD",
      recurring: false,
    },

    // U2: No category, POSITIVE amount — should appear in cash flow income but NOT in revenue
    {
      id: "a0000000-0000-0000-0000-0000000d0002",
      date: "2024-06-15",
      name: "Uncategorized Income",
      method: "payment",
      amount: 600,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "U2",
      status: "posted",
      internal: false,
      categorySlug: null,
      baseAmount: 600,
      baseCurrency: "USD",
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RECENT 2025-2026 — For runway calculation (trailing 6-month window)
    // ═══════════════════════════════════════════════════════════════════════

    {
      id: "a0000000-0000-0000-0000-000000020001",
      date: "2025-10-15",
      name: "Recent Office Rent",
      method: "transfer",
      amount: -3000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "RW1",
      status: "posted",
      internal: false,
      categorySlug: "rent",
      baseAmount: -3000,
      baseCurrency: "USD",
      recurring: false,
    },
    {
      id: "a0000000-0000-0000-0000-000000020002",
      date: "2025-11-15",
      name: "Recent Software",
      method: "card_purchase",
      amount: -1000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "RW2",
      status: "posted",
      internal: false,
      categorySlug: "software",
      baseAmount: -1000,
      baseCurrency: "USD",
      recurring: false,
    },
    {
      id: "a0000000-0000-0000-0000-000000020003",
      date: "2025-12-15",
      name: "Recent Marketing",
      method: "card_purchase",
      amount: -2000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "RW3",
      status: "posted",
      internal: false,
      categorySlug: "marketing",
      baseAmount: -2000,
      baseCurrency: "USD",
      recurring: false,
    },
    {
      id: "a0000000-0000-0000-0000-000000020004",
      date: "2026-01-15",
      name: "Recent Travel",
      method: "card_purchase",
      amount: -1500,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "RW4",
      status: "posted",
      internal: false,
      categorySlug: "travel",
      baseAmount: -1500,
      baseCurrency: "USD",
      recurring: false,
    },
    {
      id: "a0000000-0000-0000-0000-000000020005",
      date: "2026-02-15",
      name: "Recent Supplies",
      method: "card_purchase",
      amount: -500,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "RW5",
      status: "posted",
      internal: false,
      categorySlug: "office-supplies",
      baseAmount: -500,
      baseCurrency: "USD",
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PREVIOUS YEAR 2023 — For YoY comparison (getReports)
    // ═══════════════════════════════════════════════════════════════════════

    // PY1: Jan 2023, revenue with 20% tax
    // Gross: 4000 | Net: ROUND(4000 - 4000*20/120, 2) = 3333.33
    {
      id: "a0000000-0000-0000-0000-0000000e0001",
      date: "2023-01-15",
      name: "Prior Year Invoice Jan",
      method: "payment",
      amount: 4000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "PY1",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 4000,
      baseCurrency: "USD",
      taxRate: 20,
      recurring: false,
    },

    // PY2: Feb 2023, product-sales with 10% tax
    // Gross: 1500 | Net: ROUND(1500 - 1500*10/110, 2) = 1363.64
    {
      id: "a0000000-0000-0000-0000-0000000e0002",
      date: "2023-02-10",
      name: "Prior Year Product Feb",
      method: "payment",
      amount: 1500,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "PY2",
      status: "posted",
      internal: false,
      categorySlug: "product-sales",
      baseAmount: 1500,
      baseCurrency: "USD",
      taxRate: 10,
      recurring: false,
    },

    // PY3: Mar 2023, revenue with 15% tax
    // Gross: 3000 | Net: ROUND(3000 - 3000*15/115, 2) = 2608.70
    {
      id: "a0000000-0000-0000-0000-0000000e0003",
      date: "2023-03-05",
      name: "Prior Year Invoice Mar",
      method: "payment",
      amount: 3000,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "PY3",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 3000,
      baseCurrency: "USD",
      taxRate: 15,
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Q4 2023 — For quarterly growth rate comparison
    // ═══════════════════════════════════════════════════════════════════════

    // PQ1: Oct 2023
    // Gross: 3500 | Net: ROUND(3500 - 3500*20/120, 2) = 2916.67
    {
      id: "a0000000-0000-0000-0000-0000000f0001",
      date: "2023-10-15",
      name: "Q4 Revenue Oct",
      method: "payment",
      amount: 3500,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "PQ1",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 3500,
      baseCurrency: "USD",
      taxRate: 20,
      recurring: false,
    },

    // PQ2: Nov 2023, no tax
    // Gross: 2800 | Net: 2800
    {
      id: "a0000000-0000-0000-0000-0000000f0002",
      date: "2023-11-10",
      name: "Q4 Revenue Nov",
      method: "payment",
      amount: 2800,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "PQ2",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 2800,
      baseCurrency: "USD",
      recurring: false,
    },

    // PQ3: Dec 2023, product-sales with 10% tax
    // Gross: 3200 | Net: ROUND(3200 - 3200*10/110, 2) = 2909.09
    {
      id: "a0000000-0000-0000-0000-0000000f0003",
      date: "2023-12-05",
      name: "Q4 Product Sales Dec",
      method: "payment",
      amount: 3200,
      currency: "USD",
      teamId: TEAM_USD_ID,
      internalId: "PQ3",
      status: "posted",
      internal: false,
      categorySlug: "product-sales",
      baseAmount: 3200,
      baseCurrency: "USD",
      taxRate: 10,
      recurring: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TEAM EUR — Isolation tests (must NEVER appear in team-usd queries)
    // ═══════════════════════════════════════════════════════════════════════

    {
      id: "a0000000-0000-0000-0000-000000001001",
      date: "2024-01-15",
      name: "EUR Team Revenue",
      method: "payment",
      amount: 10000,
      currency: "EUR",
      teamId: TEAM_EUR_ID,
      internalId: "TE1",
      status: "posted",
      internal: false,
      categorySlug: "revenue",
      baseAmount: 10000,
      baseCurrency: "EUR",
      recurring: false,
    },
    {
      id: "a0000000-0000-0000-0000-000000001002",
      date: "2024-01-20",
      name: "EUR Team Expense",
      method: "card_purchase",
      amount: -2000,
      currency: "EUR",
      teamId: TEAM_EUR_ID,
      internalId: "TE2",
      status: "posted",
      internal: false,
      categorySlug: "office-supplies",
      baseAmount: -2000,
      baseCurrency: "EUR",
      recurring: false,
    },
  ]);
}
