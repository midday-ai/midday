/**
 * Test fixtures for insight evals
 *
 * 4 representative scenarios covering the main branches in prompts
 */
import type { InsightSlots } from "../src/content/prompts/slots";

/**
 * Great week - personal best, high margin, streak
 * Tests: confident tone, milestone handling
 */
export const greatWeek: InsightSlots = {
  weekType: "great",
  highlight: {
    type: "personal_best",
    description: "Best profit week since October",
  },

  // Core financials
  profit: "338,958 kr",
  profitRaw: 338958,
  revenue: "340,000 kr",
  revenueRaw: 340000,
  expenses: "1,042 kr",
  expensesRaw: 1042,
  margin: "99.7",
  marginRaw: 99.7,
  runway: 14,
  cashFlow: "338,958 kr",
  cashFlowRaw: 338958,

  // Changes
  profitChange: 45,
  profitDirection: "up",
  profitChangeDescription: "up 45% vs last week",
  revenueChange: 40,
  revenueDirection: "up",

  // Historical
  historicalContext: "Best profit week since October",
  isPersonalBest: true,

  // Money on table
  hasOverdue: true,
  overdueTotal: "750 kr",
  overdueCount: 1,
  overdue: [
    {
      id: "inv-001",
      company: "Acme Corp",
      amount: "750 kr",
      rawAmount: 750,
      daysOverdue: 71,
    },
  ],
  largestOverdue: {
    id: "inv-001",
    company: "Acme Corp",
    amount: "750 kr",
    rawAmount: 750,
    daysOverdue: 71,
  },

  hasDrafts: false,
  draftsTotal: "0 kr",
  draftsCount: 0,
  drafts: [],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity
  invoicesPaid: 3,
  invoicesSent: 2,
  hoursTracked: 45,
  newCustomers: 1,
  largestPayment: {
    customer: "Beta Inc",
    amount: "180,000 kr",
  },

  // Context
  streak: {
    type: "profitable",
    count: 5,
    description: "5th consecutive profitable week",
  },
  momentum: "accelerating",
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 19-25, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Good week - normal profitable week with some overdue
 * Tests: warm professional tone, common case handling
 */
export const goodWeek: InsightSlots = {
  weekType: "good",
  highlight: { type: "none" },

  // Core financials
  profit: "117,061 kr",
  profitRaw: 117061,
  revenue: "120,200 kr",
  revenueRaw: 120200,
  expenses: "3,139 kr",
  expensesRaw: 3139,
  margin: "97.4",
  marginRaw: 97.4,
  runway: 8,
  cashFlow: "117,061 kr",
  cashFlowRaw: 117061,

  // Changes
  profitChange: 12,
  profitDirection: "up",
  profitChangeDescription: "up 12% vs last week",
  revenueChange: 8,
  revenueDirection: "up",

  // Historical
  isPersonalBest: false,

  // Money on table
  hasOverdue: true,
  overdueTotal: "24,300 kr",
  overdueCount: 1,
  overdue: [
    {
      id: "inv-002",
      company: "Klarna",
      amount: "24,300 kr",
      rawAmount: 24300,
      daysOverdue: 45,
    },
  ],
  largestOverdue: {
    id: "inv-002",
    company: "Klarna",
    amount: "24,300 kr",
    rawAmount: 24300,
    daysOverdue: 45,
  },

  hasDrafts: true,
  draftsTotal: "12,000 kr",
  draftsCount: 1,
  drafts: [
    {
      id: "draft-001",
      company: "Spotify",
      amount: "12,000 kr",
      rawAmount: 12000,
    },
  ],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity
  invoicesPaid: 2,
  invoicesSent: 1,
  hoursTracked: 32,
  newCustomers: 0,

  // Context
  streak: {
    type: "profitable",
    count: 3,
    description: "3rd consecutive profitable week",
  },
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 12-18, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Challenging week - no revenue, expenses only
 * Tests: reassuring tone, no false positivity, focus on runway buffer
 */
export const challengingWeek: InsightSlots = {
  weekType: "challenging",
  highlight: { type: "none" },

  // Core financials
  profit: "-22,266 kr",
  profitRaw: -22266,
  revenue: "0 kr",
  revenueRaw: 0,
  expenses: "22,266 kr",
  expensesRaw: 22266,
  margin: "0",
  marginRaw: 0,
  runway: 14,
  cashFlow: "-22,266 kr",
  cashFlowRaw: -22266,

  // Changes
  profitChange: -100,
  profitDirection: "down",
  profitChangeDescription: "turned to loss",
  revenueChange: -100,
  revenueDirection: "down",

  // Historical
  isPersonalBest: false,

  // Money on table
  hasOverdue: true,
  overdueTotal: "8,500 kr",
  overdueCount: 2,
  overdue: [
    {
      id: "inv-003",
      company: "Acme Corp",
      amount: "5,000 kr",
      rawAmount: 5000,
      daysOverdue: 30,
    },
    {
      id: "inv-004",
      company: "Beta Inc",
      amount: "3,500 kr",
      rawAmount: 3500,
      daysOverdue: 15,
    },
  ],
  largestOverdue: {
    id: "inv-003",
    company: "Acme Corp",
    amount: "5,000 kr",
    rawAmount: 5000,
    daysOverdue: 30,
  },

  hasDrafts: false,
  draftsTotal: "0 kr",
  draftsCount: 0,
  drafts: [],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity
  invoicesPaid: 0,
  invoicesSent: 0,
  hoursTracked: 20,
  newCustomers: 0,

  // Context
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 5-11, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * First insight - no prior data for comparison
 * Tests: welcome message, no "vs last week" comparisons
 */
export const firstInsight: InsightSlots = {
  weekType: "good",
  highlight: { type: "none" },

  // Core financials
  profit: "85,000 kr",
  profitRaw: 85000,
  revenue: "92,000 kr",
  revenueRaw: 92000,
  expenses: "7,000 kr",
  expensesRaw: 7000,
  margin: "92.4",
  marginRaw: 92.4,
  runway: 10,
  cashFlow: "85,000 kr",
  cashFlowRaw: 85000,

  // No changes for first insight
  profitChange: 0,
  profitDirection: "flat",
  profitChangeDescription: "flat vs last week",
  revenueChange: 0,
  revenueDirection: "flat",

  // Historical
  isPersonalBest: false,

  // Money on table
  hasOverdue: true,
  overdueTotal: "4,200 kr",
  overdueCount: 1,
  overdue: [
    {
      id: "inv-005",
      company: "Gamma Ltd",
      amount: "4,200 kr",
      rawAmount: 4200,
      daysOverdue: 10,
    },
  ],
  largestOverdue: {
    id: "inv-005",
    company: "Gamma Ltd",
    amount: "4,200 kr",
    rawAmount: 4200,
    daysOverdue: 10,
  },

  hasDrafts: false,
  draftsTotal: "0 kr",
  draftsCount: 0,
  drafts: [],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity
  invoicesPaid: 1,
  invoicesSent: 2,
  hoursTracked: 25,
  newCustomers: 2,

  // Context
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 1-4, 2026",
  periodType: "weekly",
  isFirstInsight: true,
};

/**
 * Zero activity week - no revenue, no expenses
 * Tests: handling quiet periods without drama
 */
export const zeroActivityWeek: InsightSlots = {
  weekType: "quiet",
  highlight: { type: "none" },

  // Core financials - all zeros
  profit: "0 kr",
  profitRaw: 0,
  revenue: "0 kr",
  revenueRaw: 0,
  expenses: "0 kr",
  expensesRaw: 0,
  margin: "0",
  marginRaw: 0,
  runway: 12,
  cashFlow: "0 kr",
  cashFlowRaw: 0,

  // Changes
  profitChange: -100,
  profitDirection: "down",
  profitChangeDescription: "break-even this week",
  revenueChange: -100,
  revenueDirection: "down",

  // Historical
  isPersonalBest: false,

  // Money on table - still has overdue from before
  hasOverdue: true,
  overdueTotal: "15,000 kr",
  overdueCount: 2,
  overdue: [
    {
      id: "inv-010",
      company: "Delta Inc",
      amount: "10,000 kr",
      rawAmount: 10000,
      daysOverdue: 14,
    },
    {
      id: "inv-011",
      company: "Echo Ltd",
      amount: "5,000 kr",
      rawAmount: 5000,
      daysOverdue: 7,
    },
  ],
  largestOverdue: {
    id: "inv-010",
    company: "Delta Inc",
    amount: "10,000 kr",
    rawAmount: 10000,
    daysOverdue: 14,
  },

  hasDrafts: false,
  draftsTotal: "0 kr",
  draftsCount: 0,
  drafts: [],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity - minimal
  invoicesPaid: 0,
  invoicesSent: 0,
  hoursTracked: 0,
  newCustomers: 0,

  // Context
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 5-11, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Recovery week - profit after 2 loss weeks
 * Tests: recovery tone, acknowledging improvement
 */
export const recoveryWeek: InsightSlots = {
  weekType: "good",
  highlight: {
    type: "recovery",
    description: "Back to profit after 2 down weeks",
  },

  // Core financials
  profit: "45,000 kr",
  profitRaw: 45000,
  revenue: "60,000 kr",
  revenueRaw: 60000,
  expenses: "15,000 kr",
  expensesRaw: 15000,
  margin: "75",
  marginRaw: 75,
  runway: 9,
  cashFlow: "45,000 kr",
  cashFlowRaw: 45000,

  // Changes - big improvement
  profitChange: 250,
  profitDirection: "up",
  profitChangeDescription: "returned to profit",
  revenueChange: 180,
  revenueDirection: "up",

  // Historical
  isPersonalBest: false,

  // Money on table
  hasOverdue: false,
  overdueTotal: "0 kr",
  overdueCount: 0,
  overdue: [],

  hasDrafts: true,
  draftsTotal: "20,000 kr",
  draftsCount: 1,
  drafts: [
    {
      id: "draft-005",
      company: "Foxtrot AB",
      amount: "20,000 kr",
      rawAmount: 20000,
    },
  ],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity
  invoicesPaid: 3,
  invoicesSent: 2,
  hoursTracked: 35,
  newCustomers: 1,

  // Context - recovery!
  isRecovery: true,
  recoveryDescription: "Back to profit after 2 down weeks",

  // Meta
  currency: "SEK",
  periodLabel: "January 12-18, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Loss decreased week - THE BUG SCENARIO
 * Previous loss: -189,376 kr, Current loss: -7,148 kr
 * Must say "loss decreased", NOT "profit doubled" or "strong momentum"
 */
export const lossDecreasedWeek: InsightSlots = {
  weekType: "challenging",
  highlight: { type: "none" },

  // Core financials - still in loss but improved
  profit: "-7,148 kr",
  profitRaw: -7148,
  revenue: "0 kr",
  revenueRaw: 0,
  expenses: "7,148 kr",
  expensesRaw: 7148,
  margin: "0",
  marginRaw: 0,
  runway: 8,
  cashFlow: "-7,148 kr",
  cashFlowRaw: -7148,

  // Changes - 96% "improvement" but still a loss
  profitChange: 96,
  profitDirection: "up",
  profitChangeDescription: "loss decreased 96% vs last week",
  revenueChange: -100,
  revenueDirection: "down",

  // Historical
  isPersonalBest: false,

  // Money on table
  hasOverdue: false,
  overdueTotal: "0 kr",
  overdueCount: 0,
  overdue: [],

  hasDrafts: true,
  draftsTotal: "15,000 kr",
  draftsCount: 1,
  drafts: [
    {
      id: "draft-010",
      company: "Acme Corp",
      amount: "15,000 kr",
      rawAmount: 15000,
    },
  ],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity
  invoicesPaid: 0,
  invoicesSent: 0,
  hoursTracked: 10,
  newCustomers: 0,

  // Context
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 5-11, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Loss increased week - loss got worse
 * Previous loss: -10,000 kr, Current loss: -50,000 kr
 */
export const lossIncreasedWeek: InsightSlots = {
  weekType: "challenging",
  highlight: { type: "none" },

  // Core financials - loss increased
  profit: "-50,000 kr",
  profitRaw: -50000,
  revenue: "10,000 kr",
  revenueRaw: 10000,
  expenses: "60,000 kr",
  expensesRaw: 60000,
  margin: "-500",
  marginRaw: -500,
  runway: 6,
  cashFlow: "-50,000 kr",
  cashFlowRaw: -50000,

  // Changes - loss got worse
  profitChange: -400,
  profitDirection: "down",
  profitChangeDescription: "loss increased 400% vs last week",
  revenueChange: -50,
  revenueDirection: "down",

  // Historical
  isPersonalBest: false,

  // Money on table
  hasOverdue: true,
  overdueTotal: "25,000 kr",
  overdueCount: 2,
  overdue: [
    {
      id: "inv-020",
      company: "Beta Inc",
      amount: "15,000 kr",
      rawAmount: 15000,
      daysOverdue: 45,
    },
    {
      id: "inv-021",
      company: "Gamma Ltd",
      amount: "10,000 kr",
      rawAmount: 10000,
      daysOverdue: 30,
    },
  ],
  largestOverdue: {
    id: "inv-020",
    company: "Beta Inc",
    amount: "15,000 kr",
    rawAmount: 15000,
    daysOverdue: 45,
  },

  hasDrafts: false,
  draftsTotal: "0 kr",
  draftsCount: 0,
  drafts: [],

  // Expense spikes
  hasExpenseSpikes: true,
  expenseSpikes: [
    {
      category: "Equipment",
      amount: "45,000 kr",
      rawAmount: 45000,
      changePercent: 500,
    },
  ],

  // Activity
  invoicesPaid: 1,
  invoicesSent: 0,
  hoursTracked: 20,
  newCustomers: 0,

  // Context
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 12-18, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Profit to loss week - crossed from positive to negative
 * Previous: +50,000 kr, Current: -10,000 kr
 */
export const profitToLossWeek: InsightSlots = {
  weekType: "challenging",
  highlight: { type: "none" },

  // Core financials - turned to loss
  profit: "-10,000 kr",
  profitRaw: -10000,
  revenue: "30,000 kr",
  revenueRaw: 30000,
  expenses: "40,000 kr",
  expensesRaw: 40000,
  margin: "-33.3",
  marginRaw: -33.3,
  runway: 10,
  cashFlow: "-10,000 kr",
  cashFlowRaw: -10000,

  // Changes - crossed into loss
  profitChange: -120,
  profitDirection: "down",
  profitChangeDescription: "turned to loss",
  revenueChange: -40,
  revenueDirection: "down",

  // Historical
  isPersonalBest: false,

  // Money on table
  hasOverdue: false,
  overdueTotal: "0 kr",
  overdueCount: 0,
  overdue: [],

  hasDrafts: true,
  draftsTotal: "20,000 kr",
  draftsCount: 1,
  drafts: [
    {
      id: "draft-030",
      company: "Delta Corp",
      amount: "20,000 kr",
      rawAmount: 20000,
    },
  ],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity
  invoicesPaid: 1,
  invoicesSent: 1,
  hoursTracked: 25,
  newCustomers: 0,

  // Context
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 19-25, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Expense spike week - significant category increases
 * Tests expense alert handling
 */
export const expenseSpikeWeek: InsightSlots = {
  weekType: "good",
  highlight: { type: "none" },

  // Core financials - profitable but high expenses
  profit: "25,000 kr",
  profitRaw: 25000,
  revenue: "100,000 kr",
  revenueRaw: 100000,
  expenses: "75,000 kr",
  expensesRaw: 75000,
  margin: "25",
  marginRaw: 25,
  runway: 12,
  cashFlow: "25,000 kr",
  cashFlowRaw: 25000,

  // Changes
  profitChange: -50,
  profitDirection: "down",
  profitChangeDescription: "down 50% vs last week",
  revenueChange: 10,
  revenueDirection: "up",

  // Historical
  isPersonalBest: false,

  // Money on table
  hasOverdue: false,
  overdueTotal: "0 kr",
  overdueCount: 0,
  overdue: [],

  hasDrafts: false,
  draftsTotal: "0 kr",
  draftsCount: 0,
  drafts: [],

  // Expense spikes - multiple significant increases
  hasExpenseSpikes: true,
  expenseSpikes: [
    {
      category: "Travel",
      amount: "27,584 kr",
      rawAmount: 27584,
      changePercent: 100,
    },
    {
      category: "Software",
      amount: "15,000 kr",
      rawAmount: 15000,
      changePercent: 80,
    },
    {
      category: "Banking",
      amount: "5,240 kr",
      rawAmount: 5240,
      changePercent: 100,
    },
  ],

  // Activity
  invoicesPaid: 2,
  invoicesSent: 3,
  hoursTracked: 40,
  newCustomers: 1,

  // Context
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 5-11, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Concentration risk week - 90% revenue from single customer
 * Tests revenue concentration warning
 */
export const concentrationRiskWeek: InsightSlots = {
  weekType: "good",
  highlight: { type: "none" },

  // Core financials - good week but concentrated
  profit: "80,000 kr",
  profitRaw: 80000,
  revenue: "100,000 kr",
  revenueRaw: 100000,
  expenses: "20,000 kr",
  expensesRaw: 20000,
  margin: "80",
  marginRaw: 80,
  runway: 10,
  cashFlow: "80,000 kr",
  cashFlowRaw: 80000,

  // Changes
  profitChange: 60,
  profitDirection: "up",
  profitChangeDescription: "up 60% vs last week",
  revenueChange: 50,
  revenueDirection: "up",

  // Historical
  isPersonalBest: false,

  // Money on table
  hasOverdue: false,
  overdueTotal: "0 kr",
  overdueCount: 0,
  overdue: [],

  hasDrafts: false,
  draftsTotal: "0 kr",
  draftsCount: 0,
  drafts: [],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Revenue concentration - 90% from one customer
  concentrationWarning: {
    customerName: "MegaCorp AB",
    percentage: 90,
    recommendation: "Consider diversifying revenue sources",
  },

  // Activity
  invoicesPaid: 1,
  invoicesSent: 1,
  hoursTracked: 45,
  newCustomers: 0,
  largestPayment: {
    customer: "MegaCorp AB",
    amount: "90,000 kr",
  },

  // Context
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 12-18, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Short runway week - runway exhaustion date should be mentioned
 * Tests: runway date formatting, urgency tone
 */
export const shortRunwayWeek: InsightSlots = {
  weekType: "challenging",
  highlight: { type: "none" },

  // Core financials
  profit: "-15,000 kr",
  profitRaw: -15000,
  revenue: "20,000 kr",
  revenueRaw: 20000,
  expenses: "35,000 kr",
  expensesRaw: 35000,
  margin: "-75",
  marginRaw: -75,
  runway: 3,
  runwayExhaustionDate: "April 25, 2026", // ~3 months from now
  cashFlow: "-15,000 kr",
  cashFlowRaw: -15000,

  // Changes
  profitChange: -200,
  profitDirection: "down",
  profitChangeDescription: "loss increased vs last week",
  revenueChange: -40,
  revenueDirection: "down",

  // Historical
  isPersonalBest: false,

  // Money on table - urgent collections needed
  hasOverdue: true,
  overdueTotal: "45,000 kr",
  overdueCount: 3,
  overdue: [
    {
      id: "inv-sr-1",
      company: "Alpha Corp",
      amount: "20,000 kr",
      rawAmount: 20000,
      daysOverdue: 30,
    },
    {
      id: "inv-sr-2",
      company: "Beta Ltd",
      amount: "15,000 kr",
      rawAmount: 15000,
      daysOverdue: 21,
    },
    {
      id: "inv-sr-3",
      company: "Gamma Inc",
      amount: "10,000 kr",
      rawAmount: 10000,
      daysOverdue: 14,
    },
  ],
  largestOverdue: {
    id: "inv-sr-1",
    company: "Alpha Corp",
    amount: "20,000 kr",
    rawAmount: 20000,
    daysOverdue: 30,
  },

  hasDrafts: true,
  draftsTotal: "30,000 kr",
  draftsCount: 2,
  drafts: [
    {
      id: "d-sr-1",
      company: "Delta AB",
      amount: "18,000 kr",
      rawAmount: 18000,
    },
    {
      id: "d-sr-2",
      company: "Echo Ltd",
      amount: "12,000 kr",
      rawAmount: 12000,
    },
  ],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity
  invoicesPaid: 1,
  invoicesSent: 0,
  hoursTracked: 15,
  newCustomers: 0,

  // Context
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 19-25, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Quarter pace week - includes quarter projection and YoY comparison
 * Tests: quarter pace formatting, positive comparison
 */
export const quarterPaceWeek: InsightSlots = {
  weekType: "good",
  highlight: { type: "none" },

  // Core financials
  profit: "95,000 kr",
  profitRaw: 95000,
  revenue: "110,000 kr",
  revenueRaw: 110000,
  expenses: "15,000 kr",
  expensesRaw: 15000,
  margin: "86.4",
  marginRaw: 86.4,
  runway: 14,
  runwayExhaustionDate: "March 2027",
  cashFlow: "95,000 kr",
  cashFlowRaw: 95000,

  // Changes
  profitChange: 25,
  profitDirection: "up",
  profitChangeDescription: "up 25% vs last week",
  revenueChange: 20,
  revenueDirection: "up",

  // Historical
  isPersonalBest: false,

  // YoY
  yoyRevenue: "up 35% vs last year",
  yoyProfit: "up 40% vs last year",

  // Quarter pace projection
  quarterPace: "On pace for 450,000 kr this Q1 — 22% ahead of Q1 last year",

  // Money on table
  hasOverdue: false,
  overdueTotal: "0 kr",
  overdueCount: 0,
  overdue: [],

  hasDrafts: true,
  draftsTotal: "25,000 kr",
  draftsCount: 1,
  drafts: [
    {
      id: "d-qp-1",
      company: "MegaCorp",
      amount: "25,000 kr",
      rawAmount: 25000,
    },
  ],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity
  invoicesPaid: 4,
  invoicesSent: 2,
  hoursTracked: 42,
  newCustomers: 1,

  // Context
  streak: {
    type: "revenue_growth",
    count: 3,
    description: "3 consecutive growth weeks",
  },
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 19-25, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * Payment anomaly week - overdue invoices with unusual delays
 * Tests: anomaly detection, urgent customer-specific messaging
 */
export const paymentAnomalyWeek: InsightSlots = {
  weekType: "good",
  highlight: { type: "none" },

  // Core financials
  profit: "72,000 kr",
  profitRaw: 72000,
  revenue: "85,000 kr",
  revenueRaw: 85000,
  expenses: "13,000 kr",
  expensesRaw: 13000,
  margin: "84.7",
  marginRaw: 84.7,
  runway: 11,
  cashFlow: "72,000 kr",
  cashFlowRaw: 72000,

  // Changes
  profitChange: 15,
  profitDirection: "up",
  profitChangeDescription: "up 15% vs last week",
  revenueChange: 12,
  revenueDirection: "up",

  // Historical
  isPersonalBest: false,

  // Money on table - with payment anomalies
  hasOverdue: true,
  overdueTotal: "37,500 kr",
  overdueCount: 3,
  overdue: [
    {
      id: "inv-pa-1",
      company: "FastPay AB",
      amount: "15,000 kr",
      rawAmount: 15000,
      daysOverdue: 21,
      isUnusual: true,
      unusualReason: "usually pays within 5 days",
    },
    {
      id: "inv-pa-2",
      company: "SlowPay Ltd",
      amount: "12,500 kr",
      rawAmount: 12500,
      daysOverdue: 45,
      isUnusual: false, // Normal for this customer
    },
    {
      id: "inv-pa-3",
      company: "ReliableCorp",
      amount: "10,000 kr",
      rawAmount: 10000,
      daysOverdue: 30,
      isUnusual: true,
      unusualReason: "usually pays within 14 days",
    },
  ],
  largestOverdue: {
    id: "inv-pa-1",
    company: "FastPay AB",
    amount: "15,000 kr",
    rawAmount: 15000,
    daysOverdue: 21,
    isUnusual: true,
    unusualReason: "usually pays within 5 days",
  },

  hasDrafts: false,
  draftsTotal: "0 kr",
  draftsCount: 0,
  drafts: [],

  // Expense spikes
  hasExpenseSpikes: false,
  expenseSpikes: [],

  // Activity
  invoicesPaid: 3,
  invoicesSent: 2,
  hoursTracked: 38,
  newCustomers: 0,

  // Context
  isRecovery: false,

  // Meta
  currency: "SEK",
  periodLabel: "January 19-25, 2026",
  periodType: "weekly",
  isFirstInsight: false,
};

/**
 * All fixtures for iteration
 */
export const allFixtures = [
  { name: "great-week", slots: greatWeek },
  { name: "good-week", slots: goodWeek },
  { name: "challenging-week", slots: challengingWeek },
  { name: "first-insight", slots: firstInsight },
  { name: "zero-activity", slots: zeroActivityWeek },
  { name: "recovery-week", slots: recoveryWeek },
  { name: "loss-decreased", slots: lossDecreasedWeek },
  { name: "loss-increased", slots: lossIncreasedWeek },
  { name: "profit-to-loss", slots: profitToLossWeek },
  { name: "expense-spike", slots: expenseSpikeWeek },
  { name: "concentration-risk", slots: concentrationRiskWeek },
  // Wow feature fixtures
  { name: "short-runway", slots: shortRunwayWeek },
  { name: "quarter-pace", slots: quarterPaceWeek },
  { name: "payment-anomaly", slots: paymentAnomalyWeek },
];
