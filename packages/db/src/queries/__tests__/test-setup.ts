import { afterAll, beforeAll } from "bun:test";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../schema";

// Create mock database using Drizzle's official mock driver
export const createMockDb = () => {
  return drizzle.mock({ schema });
};

// Test data generators
export const createTestInboxItem = (overrides = {}) => ({
  id: "test-inbox-1",
  teamId: "test-team-1",
  displayName: "Amazon Purchase",
  amount: 99.99,
  currency: "USD",
  baseAmount: 85.5,
  baseCurrency: "EUR",
  date: "2024-01-15",
  embedding: new Array(1536).fill(0.8), // Mock OpenAI embedding
  website: "amazon.com",
  type: "expense" as const,
  ...overrides,
});

export const createTestTransaction = (overrides = {}) => ({
  id: "test-txn-1",
  teamId: "test-team-1",
  name: "AMAZON.COM PURCHASE",
  amount: 99.99,
  currency: "USD",
  baseAmount: 85.5,
  baseCurrency: "EUR",
  date: "2024-01-15",
  counterpartyName: "Amazon",
  description: "Online purchase",
  embedding: new Array(1536).fill(0.8), // Mock OpenAI embedding
  ...overrides,
});

export const createTestCalibrationData = (overrides = {}) => ({
  teamId: "test-team-1",
  totalSuggestions: 100,
  confirmedSuggestions: 85,
  declinedSuggestions: 15,
  avgConfidenceConfirmed: 0.92,
  avgConfidenceDeclined: 0.65,
  autoMatchAccuracy: 0.98,
  suggestedMatchAccuracy: 0.85,
  calibratedAutoThreshold: 0.95,
  calibratedSuggestedThreshold: 0.7,
  lastUpdated: new Date().toISOString(),
  ...overrides,
});

// Mock embedding generation
export const mockEmbedding = new Array(1536)
  .fill(0)
  .map(() => Math.random() - 0.5);

// Test scenarios for comprehensive coverage
export const testScenarios = {
  perfectMatch: {
    inbox: createTestInboxItem({
      displayName: "Starbucks Coffee",
      amount: 4.5,
      currency: "USD",
      date: "2024-01-15",
    }),
    transaction: createTestTransaction({
      name: "STARBUCKS STORE #1234",
      amount: 4.5,
      currency: "USD",
      date: "2024-01-15",
    }),
    expectedConfidence: 0.98,
    expectedMatchType: "auto_matched" as const,
  },

  crossCurrencyMatch: {
    inbox: createTestInboxItem({
      displayName: "Hotel Booking",
      amount: 120.0,
      currency: "USD",
      baseAmount: 100.0,
      baseCurrency: "EUR",
      date: "2024-01-10",
    }),
    transaction: createTestTransaction({
      name: "BOOKING.COM RESERVATION",
      amount: 100.0,
      currency: "EUR",
      baseAmount: 100.0,
      baseCurrency: "EUR",
      date: "2024-01-10",
    }),
    expectedConfidence: 0.96,
    expectedMatchType: "auto_matched" as const,
  },

  semanticMatch: {
    inbox: createTestInboxItem({
      displayName: "Uber Ride",
      amount: 15.75,
      currency: "USD",
      date: "2024-01-12",
    }),
    transaction: createTestTransaction({
      name: "UBER TECHNOLOGIES INC",
      amount: 15.75,
      currency: "USD",
      date: "2024-01-12",
    }),
    expectedConfidence: 0.88,
    expectedMatchType: "suggested" as const,
  },

  poorMatch: {
    inbox: createTestInboxItem({
      displayName: "Coffee Shop",
      amount: 5.0,
      currency: "USD",
      date: "2024-01-15",
    }),
    transaction: createTestTransaction({
      name: "WALMART SUPERCENTER",
      amount: 150.0,
      currency: "USD",
      date: "2024-02-15",
    }),
    expectedConfidence: 0.2,
    shouldReject: true,
  },

  edgeCases: {
    missingAmount: {
      inbox: createTestInboxItem({ amount: null }),
      transaction: createTestTransaction({ amount: 50.0 }),
      expectedConfidence: 0.5,
    },
    zeroAmount: {
      inbox: createTestInboxItem({ amount: 0 }),
      transaction: createTestTransaction({ amount: 0 }),
      expectedConfidence: 0.5,
    },
    hugeDateDifference: {
      inbox: createTestInboxItem({ date: "2024-01-01" }),
      transaction: createTestTransaction({ date: "2024-12-31" }),
      expectedConfidence: 0.3,
    },
  },
};

// Global test setup
beforeAll(() => {
  // Set up test environment
  process.env.NODE_ENV = "test";
});

afterAll(() => {
  // Cleanup
});
