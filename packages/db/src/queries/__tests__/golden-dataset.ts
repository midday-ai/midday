/**
 * Golden Dataset for Regression Testing
 *
 * This file contains known good and bad matches that the algorithm should consistently
 * handle correctly. Any changes to the algorithm should be validated against this dataset.
 */

export interface GoldenMatch {
  id: string;
  description: string;
  inboxItem: {
    id: string;
    teamId: string;
    displayName: string;
    amount: number | null;
    currency: string | null;
    baseAmount: number | null;
    baseCurrency: string | null;
    date: string;
    website: string | null;
    type: "invoice" | "expense" | null;
    embedding: number[];
  };
  transaction: {
    id: string;
    teamId: string;
    name: string;
    amount: number;
    currency: string;
    baseAmount: number | null;
    baseCurrency: string | null;
    date: string;
    counterpartyName: string | null;
    description: string | null;
    embedding: number[];
  };
  expected: {
    shouldMatch: boolean;
    minConfidence: number;
    maxConfidence: number;
    expectedMatchType: "auto_matched" | "suggested" | null;
  };
}

// Generate realistic embeddings for different merchant categories
const generateEmbedding = (seed: string): number[] => {
  // Simple deterministic embedding generator based on string hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  return Array.from({ length: 1536 }, (_, i) => random(hash + i) * 2 - 1);
};

export const goldenMatches: GoldenMatch[] = [
  {
    id: "perfect-starbucks-match",
    description:
      "Perfect match - same merchant, exact amount, same currency, same date",
    inboxItem: {
      id: "inbox-starbucks-1",
      teamId: "team-1",
      displayName: "Starbucks Coffee",
      amount: 4.5,
      currency: "USD",
      baseAmount: 4.5,
      baseCurrency: "USD",
      date: "2024-01-15",
      website: "starbucks.com",
      type: "expense",
      embedding: generateEmbedding("Starbucks Coffee starbucks.com"),
    },
    transaction: {
      id: "txn-starbucks-1",
      teamId: "team-1",
      name: "STARBUCKS STORE #1234",
      amount: 4.5,
      currency: "USD",
      baseAmount: 4.5,
      baseCurrency: "USD",
      date: "2024-01-15",
      counterpartyName: "Starbucks Corporation",
      description: "Coffee purchase",
      embedding: generateEmbedding("STARBUCKS STORE #1234 Coffee purchase"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.95,
      maxConfidence: 1.0,
      expectedMatchType: "auto_matched",
    },
  },

  {
    id: "cross-currency-hotel-match",
    description:
      "Cross-currency match - different currencies but exact base amounts",
    inboxItem: {
      id: "inbox-hotel-1",
      teamId: "team-1",
      displayName: "Hotel Reservation",
      amount: 120.0,
      currency: "USD",
      baseAmount: 100.0,
      baseCurrency: "EUR",
      date: "2024-01-10",
      website: "booking.com",
      type: "expense",
      embedding: generateEmbedding("Hotel Booking Confirmation booking.com"),
    },
    transaction: {
      id: "txn-hotel-1",
      teamId: "team-1",
      name: "BOOKING.COM RESERVATION",
      amount: 100.0,
      currency: "EUR",
      baseAmount: 100.0,
      baseCurrency: "EUR",
      date: "2024-01-10",
      counterpartyName: "Booking.com B.V.",
      description: "Hotel booking",
      embedding: generateEmbedding("BOOKING.COM RESERVATION Hotel booking"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.9,
      maxConfidence: 0.98,
      expectedMatchType: "auto_matched",
    },
  },

  {
    id: "semantic-uber-match",
    description:
      "Semantic match - different names but same company, exact amount",
    inboxItem: {
      id: "inbox-uber-1",
      teamId: "team-1",
      displayName: "Uber Ride",
      amount: 15.75,
      currency: "USD",
      baseAmount: 15.75,
      baseCurrency: "USD",
      date: "2024-01-12",
      website: "uber.com",
      type: "expense",
      embedding: generateEmbedding("Uber Ride uber.com"),
    },
    transaction: {
      id: "txn-uber-1",
      teamId: "team-1",
      name: "UBER TECHNOLOGIES INC",
      amount: 15.75,
      currency: "USD",
      baseAmount: 15.75,
      baseCurrency: "USD",
      date: "2024-01-12",
      counterpartyName: "Uber Technologies Inc",
      description: "Ride service",
      embedding: generateEmbedding("UBER TECHNOLOGIES INC Ride service"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.8,
      maxConfidence: 0.95,
      expectedMatchType: "suggested",
    },
  },

  {
    id: "date-tolerance-amazon-match",
    description: "Good match with slight date difference (3 days)",
    inboxItem: {
      id: "inbox-amazon-1",
      teamId: "team-1",
      displayName: "Amazon Purchase",
      amount: 99.99,
      currency: "USD",
      baseAmount: 99.99,
      baseCurrency: "USD",
      date: "2024-01-15",
      website: "amazon.com",
      type: "expense",
      embedding: generateEmbedding("Amazon Purchase amazon.com"),
    },
    transaction: {
      id: "txn-amazon-1",
      teamId: "team-1",
      name: "AMAZON.COM PURCHASE",
      amount: 99.99,
      currency: "USD",
      baseAmount: 99.99,
      baseCurrency: "USD",
      date: "2024-01-18", // 3 days later
      counterpartyName: "Amazon.com Inc",
      description: "Online purchase",
      embedding: generateEmbedding("AMAZON.COM PURCHASE Online purchase"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.85,
      maxConfidence: 0.95,
      expectedMatchType: "suggested",
    },
  },

  {
    id: "poor-match-different-merchants",
    description:
      "Poor match - completely different merchants, different amounts",
    inboxItem: {
      id: "inbox-coffee-1",
      teamId: "team-1",
      displayName: "Local Coffee Shop",
      amount: 5.0,
      currency: "USD",
      baseAmount: 5.0,
      baseCurrency: "USD",
      date: "2024-01-15",
      website: null,
      type: "expense",
      embedding: generateEmbedding("Local Coffee Shop"),
    },
    transaction: {
      id: "txn-walmart-1",
      teamId: "team-1",
      name: "WALMART SUPERCENTER #1234",
      amount: 150.0,
      currency: "USD",
      baseAmount: 150.0,
      baseCurrency: "USD",
      date: "2024-02-15", // 1 month later
      counterpartyName: "Walmart Inc",
      description: "Grocery shopping",
      embedding: generateEmbedding(
        "WALMART SUPERCENTER #1234 Grocery shopping",
      ),
    },
    expected: {
      shouldMatch: false,
      minConfidence: 0.0,
      maxConfidence: 0.5,
      expectedMatchType: null,
    },
  },

  {
    id: "edge-case-missing-amount",
    description: "Edge case - missing amount in inbox item",
    inboxItem: {
      id: "inbox-missing-amount",
      teamId: "team-1",
      displayName: "Receipt - Amount Not Detected",
      amount: null,
      currency: "USD",
      baseAmount: null,
      baseCurrency: "USD",
      date: "2024-01-15",
      website: null,
      type: "expense",
      embedding: generateEmbedding("Receipt - Amount Not Detected"),
    },
    transaction: {
      id: "txn-office-supply",
      teamId: "team-1",
      name: "OFFICE DEPOT #5678",
      amount: 45.99,
      currency: "USD",
      baseAmount: 45.99,
      baseCurrency: "USD",
      date: "2024-01-15",
      counterpartyName: "Office Depot Inc",
      description: "Office supplies",
      embedding: generateEmbedding("OFFICE DEPOT #5678 Office supplies"),
    },
    expected: {
      shouldMatch: false, // Can't reliably match without amount
      minConfidence: 0.0,
      maxConfidence: 0.6,
      expectedMatchType: null,
    },
  },

  {
    id: "subscription-recurring-match",
    description: "Recurring subscription - Netflix monthly",
    inboxItem: {
      id: "inbox-netflix-1",
      teamId: "team-1",
      displayName: "Netflix Subscription",
      amount: 15.99,
      currency: "USD",
      baseAmount: 15.99,
      baseCurrency: "USD",
      date: "2024-01-15",
      website: "netflix.com",
      type: "expense",
      embedding: generateEmbedding("Netflix Subscription netflix.com"),
    },
    transaction: {
      id: "txn-netflix-1",
      teamId: "team-1",
      name: "NETFLIX.COM MEMBERSHIP",
      amount: 15.99,
      currency: "USD",
      baseAmount: 15.99,
      baseCurrency: "USD",
      date: "2024-01-15",
      counterpartyName: "Netflix Inc",
      description: "Streaming service",
      embedding: generateEmbedding("NETFLIX.COM MEMBERSHIP Streaming service"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.92,
      maxConfidence: 1.0,
      expectedMatchType: "auto_matched",
    },
  },

  {
    id: "near-miss-amount-difference",
    description:
      "Near miss - same merchant but slightly different amounts (rounding?)",
    inboxItem: {
      id: "inbox-gas-station-1",
      teamId: "team-1",
      displayName: "Shell Gas Station",
      amount: 45.67,
      currency: "USD",
      baseAmount: 45.67,
      baseCurrency: "USD",
      date: "2024-01-15",
      website: "shell.com",
      type: "expense",
      embedding: generateEmbedding("Shell Gas Station shell.com"),
    },
    transaction: {
      id: "txn-shell-1",
      teamId: "team-1",
      name: "SHELL #9876 FUEL",
      amount: 45.7, // 3 cents difference
      currency: "USD",
      baseAmount: 45.7,
      baseCurrency: "USD",
      date: "2024-01-15",
      counterpartyName: "Shell Oil Company",
      description: "Fuel purchase",
      embedding: generateEmbedding("SHELL #9876 FUEL Fuel purchase"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.75,
      maxConfidence: 0.9,
      expectedMatchType: "suggested", // Small amount difference prevents auto-match
    },
  },
];

// Helper function to get matches by category
export const getGoldenMatchesByType = (
  type: "should_match" | "should_not_match" | "edge_cases",
) => {
  switch (type) {
    case "should_match":
      return goldenMatches.filter((m) => m.expected.shouldMatch);
    case "should_not_match":
      return goldenMatches.filter((m) => !m.expected.shouldMatch);
    case "edge_cases":
      return goldenMatches.filter(
        (m) => m.id.includes("edge-case") || m.id.includes("near-miss"),
      );
    default:
      return goldenMatches;
  }
};

// Performance benchmarks - these should complete within time limits
export const performanceBenchmarks = {
  singleMatch: {
    maxTimeMs: 100, // Single match should complete in < 100ms
    description: "Time to find best match for single inbox item",
  },
  batchMatching: {
    maxTimeMs: 1000, // Batch of 10 should complete in < 1s
    batchSize: 10,
    description: "Time to process batch of inbox items",
  },
  calibrationUpdate: {
    maxTimeMs: 200, // Calibration update should be fast
    description: "Time to recalculate team calibration",
  },
};
