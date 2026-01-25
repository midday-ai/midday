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
 * All fixtures for iteration
 */
export const allFixtures = [
  { name: "great-week", slots: greatWeek },
  { name: "good-week", slots: goodWeek },
  { name: "challenging-week", slots: challengingWeek },
  { name: "first-insight", slots: firstInsight },
];
