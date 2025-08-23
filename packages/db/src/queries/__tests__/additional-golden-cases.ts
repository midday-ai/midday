/**
 * Additional Golden Test Cases
 *
 * These cover critical scenarios missing from the current golden dataset
 */

import type { GoldenMatch } from "./golden-dataset";

const generateEmbedding = (seed: string): number[] => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  return Array.from({ length: 1536 }, (_, i) => random(hash + i) * 2 - 1);
};

export const additionalGoldenMatches: GoldenMatch[] = [
  // CRITICAL MISSING: Invoice payment scenarios
  {
    id: "invoice-net30-payment",
    description: "Invoice with Net 30 payment terms (30 days later)",
    inboxItem: {
      id: "inbox-invoice-1",
      teamId: "team-1",
      displayName: "Consulting Services Invoice",
      amount: 2500.0,
      currency: "USD",
      baseAmount: 2500.0,
      baseCurrency: "USD",
      date: "2024-01-15", // Invoice date
      website: "consultingfirm.com",
      type: "invoice", // KEY: Invoice type
      embedding: generateEmbedding(
        "Consulting Services Invoice consultingfirm.com",
      ),
    },
    transaction: {
      id: "txn-invoice-payment-1",
      teamId: "team-1",
      name: "CONSULTING FIRM LLC PAYMENT",
      amount: 2500.0,
      currency: "USD",
      baseAmount: 2500.0,
      baseCurrency: "USD",
      date: "2024-02-14", // 30 days later
      counterpartyName: "Consulting Firm LLC",
      description: "Professional services payment",
      embedding: generateEmbedding(
        "CONSULTING FIRM LLC PAYMENT Professional services payment",
      ),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.95, // Should score very high for Net 30
      maxConfidence: 1.0,
      expectedMatchType: "auto_matched",
    },
  },

  // CRITICAL MISSING: Multiple currency scenarios
  {
    id: "exotic-currency-mismatch",
    description: "Exotic currencies without base amount conversion",
    inboxItem: {
      id: "inbox-exotic-1",
      teamId: "team-1",
      displayName: "Japanese Supplier Payment",
      amount: 15000, // JPY
      currency: "JPY",
      baseAmount: null, // No conversion available
      baseCurrency: null,
      date: "2024-01-15",
      website: "supplier.co.jp",
      type: "expense",
      embedding: generateEmbedding("Japanese Supplier Payment supplier.co.jp"),
    },
    transaction: {
      id: "txn-exotic-1",
      teamId: "team-1",
      name: "SUPPLIER CO LTD JAPAN",
      amount: 100.5, // USD equivalent, but no base amount
      currency: "USD",
      baseAmount: null,
      baseCurrency: null,
      date: "2024-01-15",
      counterpartyName: "Supplier Co Ltd",
      description: "Manufacturing payment",
      embedding: generateEmbedding(
        "SUPPLIER CO LTD JAPAN Manufacturing payment",
      ),
    },
    expected: {
      shouldMatch: false, // Should fail due to currency mismatch without conversion
      minConfidence: 0.0,
      maxConfidence: 0.6, // 40% penalty for unresolved currency difference
      expectedMatchType: null,
    },
  },

  // CRITICAL MISSING: Team calibration scenarios
  {
    id: "borderline-confidence-team-calibrated",
    description: "Match that depends on team-specific calibrated thresholds",
    inboxItem: {
      id: "inbox-borderline-1",
      teamId: "team-high-accuracy", // Team with high historical accuracy
      displayName: "Office Supplies",
      amount: 89.99,
      currency: "USD",
      baseAmount: 89.99,
      baseCurrency: "USD",
      date: "2024-01-15",
      website: "officesupplies.com",
      type: "expense",
      embedding: generateEmbedding("Office Supplies officesupplies.com"),
    },
    transaction: {
      id: "txn-borderline-1",
      teamId: "team-high-accuracy",
      name: "OFFICE SUPPLIES INC",
      amount: 89.99,
      currency: "USD",
      baseAmount: 89.99,
      baseCurrency: "USD",
      date: "2024-01-16", // 1 day difference
      counterpartyName: "Office Supplies Inc",
      description: "Business supplies",
      embedding: generateEmbedding("OFFICE SUPPLIES INC Business supplies"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.88, // Just above suggested threshold for high-accuracy team
      maxConfidence: 0.94,
      expectedMatchType: "suggested", // Borderline case
    },
  },

  // CRITICAL MISSING: Recurring transaction intelligence
  {
    id: "recurring-pattern-boost",
    description: "Transaction that should get recurring intelligence boost",
    inboxItem: {
      id: "inbox-recurring-1",
      teamId: "team-1",
      displayName: "Monthly Software Subscription",
      amount: 49.99,
      currency: "USD",
      baseAmount: 49.99,
      baseCurrency: "USD",
      date: "2024-02-15", // Second occurrence
      website: "software.com",
      type: "expense",
      embedding: generateEmbedding(
        "Monthly Software Subscription software.com",
      ),
    },
    transaction: {
      id: "txn-recurring-1",
      teamId: "team-1",
      name: "SOFTWARE.COM MONTHLY",
      amount: 49.99,
      currency: "USD",
      baseAmount: 49.99,
      baseCurrency: "USD",
      date: "2024-02-15",
      counterpartyName: "Software Inc",
      description: "Monthly subscription",
      embedding: generateEmbedding("SOFTWARE.COM MONTHLY Monthly subscription"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.96, // Should get recurring boost
      maxConfidence: 1.0,
      expectedMatchType: "auto_matched",
    },
  },

  // CRITICAL MISSING: Semantic embedding edge cases
  {
    id: "weak-semantic-strong-financial",
    description: "Strong financial match but weak semantic similarity",
    inboxItem: {
      id: "inbox-weak-semantic-1",
      teamId: "team-1",
      displayName: "Business Lunch Receipt", // Generic description
      amount: 127.5,
      currency: "USD",
      baseAmount: 127.5,
      baseCurrency: "USD",
      date: "2024-01-15",
      website: null,
      type: "expense",
      embedding: generateEmbedding("Business Lunch Receipt"), // Generic
    },
    transaction: {
      id: "txn-weak-semantic-1",
      teamId: "team-1",
      name: "CHEZ PIERRE RESTAURANT #4521", // Specific restaurant
      amount: 127.5, // Exact match
      currency: "USD",
      baseAmount: 127.5,
      baseCurrency: "USD",
      date: "2024-01-15", // Same date
      counterpartyName: "Chez Pierre Restaurant",
      description: "Fine dining",
      embedding: generateEmbedding("CHEZ PIERRE RESTAURANT #4521 Fine dining"), // Specific
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.85, // Financial match overcomes weak semantics
      maxConfidence: 0.92,
      expectedMatchType: "suggested",
    },
  },

  // CRITICAL MISSING: Amount tolerance edge cases
  {
    id: "amount-within-tolerance",
    description: "Amount difference within acceptable tolerance",
    inboxItem: {
      id: "inbox-tolerance-1",
      teamId: "team-1",
      displayName: "Taxi Ride",
      amount: 23.45,
      currency: "USD",
      baseAmount: 23.45,
      baseCurrency: "USD",
      date: "2024-01-15",
      website: "taxicompany.com",
      type: "expense",
      embedding: generateEmbedding("Taxi Ride taxicompany.com"),
    },
    transaction: {
      id: "txn-tolerance-1",
      teamId: "team-1",
      name: "TAXI COMPANY RIDE",
      amount: 23.47, // 2 cent difference (within 0.01 tolerance)
      currency: "USD",
      baseAmount: 23.47,
      baseCurrency: "USD",
      date: "2024-01-15",
      counterpartyName: "Taxi Company",
      description: "Transportation service",
      embedding: generateEmbedding("TAXI COMPANY RIDE Transportation service"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.95, // Should be treated as exact match
      maxConfidence: 1.0,
      expectedMatchType: "auto_matched",
    },
  },

  // CRITICAL MISSING: Date scoring for different types
  {
    id: "expense-receipt-after-transaction",
    description: "Expense receipt received after transaction (normal pattern)",
    inboxItem: {
      id: "inbox-expense-after-1",
      teamId: "team-1",
      displayName: "Hardware Store Purchase",
      amount: 156.78,
      currency: "USD",
      baseAmount: 156.78,
      baseCurrency: "USD",
      date: "2024-01-18", // Receipt date (3 days after transaction)
      website: "hardwarestore.com",
      type: "expense",
      embedding: generateEmbedding("Hardware Store Purchase hardwarestore.com"),
    },
    transaction: {
      id: "txn-expense-after-1",
      teamId: "team-1",
      name: "HARDWARE STORE #123",
      amount: 156.78,
      currency: "USD",
      baseAmount: 156.78,
      baseCurrency: "USD",
      date: "2024-01-15", // Transaction date (3 days before receipt)
      counterpartyName: "Hardware Store",
      description: "Tools and supplies",
      embedding: generateEmbedding("HARDWARE STORE #123 Tools and supplies"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.92, // Good score for normal expense pattern
      maxConfidence: 0.98,
      expectedMatchType: "auto_matched",
    },
  },

  // CRITICAL MISSING: Team base currency scenarios
  {
    id: "team-base-currency-conversion",
    description:
      "Different currencies but both converted to team base currency",
    inboxItem: {
      id: "inbox-team-base-1",
      teamId: "team-eur-base", // Team with EUR base currency
      displayName: "US Conference Registration",
      amount: 500.0, // USD
      currency: "USD",
      baseAmount: 450.0, // Converted to EUR
      baseCurrency: "EUR", // Team base currency
      date: "2024-01-15",
      website: "conference.com",
      type: "expense",
      embedding: generateEmbedding("US Conference Registration conference.com"),
    },
    transaction: {
      id: "txn-team-base-1",
      teamId: "team-eur-base",
      name: "CONFERENCE.COM REGISTRATION",
      amount: 450.0, // EUR (team base currency)
      currency: "EUR",
      baseAmount: 450.0, // Same as amount
      baseCurrency: "EUR",
      date: "2024-01-15",
      counterpartyName: "Conference Inc",
      description: "Event registration",
      embedding: generateEmbedding(
        "CONFERENCE.COM REGISTRATION Event registration",
      ),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.93, // Good match via team base currency
      maxConfidence: 0.98,
      expectedMatchType: "auto_matched",
    },
  },
];

// Test scenarios that should stress the confidence boosting logic
export const confidenceBoostingScenarios: GoldenMatch[] = [
  {
    id: "confidence-boost-perfect-financial-strong-semantic",
    description:
      "Perfect financial + strong semantic match should get maximum boost",
    inboxItem: {
      id: "inbox-boost-perfect-1",
      teamId: "team-1",
      displayName: "Apple Store Purchase",
      amount: 1299.0,
      currency: "USD",
      baseAmount: 1299.0,
      baseCurrency: "USD",
      date: "2024-01-15",
      website: "apple.com",
      type: "expense",
      embedding: generateEmbedding("Apple Store Purchase apple.com"),
    },
    transaction: {
      id: "txn-boost-perfect-1",
      teamId: "team-1",
      name: "APPLE STORE #R123",
      amount: 1299.0, // Exact amount
      currency: "USD", // Same currency
      baseAmount: 1299.0,
      baseCurrency: "USD",
      date: "2024-01-15", // Same date
      counterpartyName: "Apple Inc",
      description: "Technology purchase",
      embedding: generateEmbedding("APPLE STORE #R123 Technology purchase"),
    },
    expected: {
      shouldMatch: true,
      minConfidence: 0.98, // Should get maximum confidence boost
      maxConfidence: 1.0,
      expectedMatchType: "auto_matched",
    },
  },
];

// Export all additional test cases
export const allAdditionalGoldenMatches = [
  ...additionalGoldenMatches,
  ...confidenceBoostingScenarios,
];
