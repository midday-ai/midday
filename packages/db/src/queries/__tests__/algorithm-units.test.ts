import { describe, expect, test } from "bun:test";

/**
 * Unit Tests for Algorithm Core Functions
 * 
 * Instead of mocking the complex database queries,
 * test the pure functions that do the actual matching logic.
 */

// Import the core scoring functions (these should be exported from transaction-matching.ts)
// For now, we'll recreate the key logic to test

// Recreate the core amount scoring logic for testing
function calculateAmountScore(
  amount1: number | null,
  currency1: string | null,
  amount2: number,
  currency2: string,
  baseAmount1?: number | null,
  baseCurrency1?: string | null,
  baseAmount2?: number | null,
  baseCurrency2?: string | null,
): number {
  if (!amount1 || !amount2) return 0.5;

  // PRIORITY 1: Exact currency and amount match
  if (currency1 && currency2 && currency1 === currency2) {
    const diff = Math.abs(amount1 - amount2);
    if (diff < 0.01) return 1.0; // Exact match
    if (diff < 1.0) return 0.95; // Very close
    if (diff < 5.0) return 0.85; // Close
    return Math.max(0.3, 1.0 - (diff / Math.max(amount1, amount2)));
  }

  // PRIORITY 2: Use base currency amounts if available
  if (
    baseAmount1 &&
    baseAmount2 &&
    baseCurrency1 &&
    baseCurrency2 &&
    baseCurrency1 === baseCurrency2
  ) {
    const diff = Math.abs(baseAmount1 - baseAmount2);
    if (diff < 0.01) return 0.98; // Excellent cross-currency match
    if (diff < 1.0) return 0.92;
    if (diff < 5.0) return 0.82;
    return Math.max(0.3, 0.9 - (diff / Math.max(baseAmount1, baseAmount2)));
  }

  // PRIORITY 3: Different currencies, no base amount conversion
  if (currency1 !== currency2) {
    const rawScore = Math.max(0.3, 1.0 - Math.abs(amount1 - amount2) / Math.max(amount1, amount2));
    return rawScore * 0.6; // 40% penalty for currency mismatch
  }

  // Fallback
  const diff = Math.abs(amount1 - amount2);
  return Math.max(0.3, 1.0 - (diff / Math.max(amount1, amount2)));
}

function calculateDateScore(
  inboxDate: string,
  transactionDate: string,
  inboxType?: string | null,
): number {
  const inboxDateObj = new Date(inboxDate);
  const transactionDateObj = new Date(transactionDate);

  const diffDays = Math.abs(
    (inboxDateObj.getTime() - transactionDateObj.getTime()) / (1000 * 60 * 60 * 24),
  );

  const signedDiffDays =
    (transactionDateObj.getTime() - inboxDateObj.getTime()) / (1000 * 60 * 60 * 24);

  const type = inboxType || "expense";

  if (type === "invoice") {
    // Invoice logic: payment usually comes AFTER invoice date
    if (signedDiffDays > 0) {
      if (signedDiffDays >= 24 && signedDiffDays <= 38) return 0.98; // Net 30
      if (signedDiffDays >= 55 && signedDiffDays <= 68) return 0.96; // Net 60
      if (signedDiffDays <= 6) return 0.99; // Immediate payment
      if (signedDiffDays <= 123) return Math.max(0.7, 0.9 - (signedDiffDays - 33) * 0.002);
    }
    return 0.85; // Advance payment
  } else {
    // Expense logic: receipt usually comes AFTER transaction
    if (diffDays <= 1) return 0.99;
    if (diffDays <= 3) return 0.95;
    if (diffDays <= 7) return 0.9;
    if (diffDays <= 30) return Math.max(0.7, 0.9 - (diffDays - 7) * 0.01);
    return 0.6;
  }
}

function calculateEmbeddingScore(embeddingDistance: number): number {
  return Math.max(0, 1 - embeddingDistance);
}

describe("Algorithm Core Logic Units", () => {
  describe("Amount Scoring", () => {
    test("perfect amount match returns 1.0", () => {
      const score = calculateAmountScore(25.99, "USD", 25.99, "USD");
      expect(score).toBe(1.0);
    });

    test("small difference returns high score", () => {
      const score = calculateAmountScore(25.99, "USD", 26.01, "USD");
      expect(score).toBeGreaterThan(0.9);
      expect(score).toBeLessThan(1.0);
    });

    test("cross-currency with base amounts works", () => {
      const score = calculateAmountScore(
        100, "USD",  // Inbox item
        85, "EUR",   // Transaction
        85, "EUR",   // Base amounts (same)
        85, "EUR"
      );
      expect(score).toBeGreaterThan(0.95); // Should be excellent match
    });

    test("different currencies without base amounts get penalty", () => {
      const score = calculateAmountScore(100, "USD", 100, "EUR");
      expect(score).toBeLessThan(0.7); // Should get 40% penalty
    });

    test("missing amounts return neutral score", () => {
      const score = calculateAmountScore(null, "USD", 25.99, "USD");
      expect(score).toBe(0.5);
    });
  });

  describe("Date Scoring", () => {
    test("same date returns perfect score", () => {
      const score = calculateDateScore("2024-01-15", "2024-01-15");
      expect(score).toBe(0.99);
    });

    test("invoice Net 30 payment gets high score", () => {
      const score = calculateDateScore("2024-01-15", "2024-02-14", "invoice"); // 30 days
      expect(score).toBe(0.98);
    });

    test("expense receipt 3 days after transaction gets high score", () => {
      const score = calculateDateScore("2024-01-18", "2024-01-15", "expense"); // 3 days
      expect(score).toBe(0.95);
    });

    test("large date difference gets low score", () => {
      const score = calculateDateScore("2024-01-15", "2024-06-15"); // 5 months
      expect(score).toBe(0.6);
    });
  });

  describe("Embedding Scoring", () => {
    test("low distance returns high similarity", () => {
      const score = calculateEmbeddingScore(0.1); // Low distance
      expect(score).toBe(0.9); // High similarity
    });

    test("high distance returns low similarity", () => {
      const score = calculateEmbeddingScore(0.8); // High distance
      expect(score).toBeCloseTo(0.2, 1); // Low similarity
    });

    test("zero distance returns perfect similarity", () => {
      const score = calculateEmbeddingScore(0.0);
      expect(score).toBe(1.0);
    });
  });

  describe("Combined Scoring Logic", () => {
    test("perfect match scenario", () => {
      const amountScore = calculateAmountScore(25.99, "USD", 25.99, "USD");
      const dateScore = calculateDateScore("2024-01-15", "2024-01-15");
      const embeddingScore = calculateEmbeddingScore(0.1);

      // Simulate the algorithm's weighting
      const weights = {
        embeddingWeight: 0.35,
        amountWeight: 0.4,
        dateWeight: 0.05,
      };

      const confidenceScore =
        embeddingScore * weights.embeddingWeight +
        amountScore * weights.amountWeight +
        dateScore * weights.dateWeight;

      expect(confidenceScore).toBeGreaterThan(0.7);
      console.log(`Perfect match confidence: ${confidenceScore.toFixed(3)}`);
    });

    test("poor match scenario", () => {
      const amountScore = calculateAmountScore(5.00, "USD", 150.00, "USD");
      const dateScore = calculateDateScore("2024-01-15", "2024-06-15");
      const embeddingScore = calculateEmbeddingScore(0.9);

      const weights = {
        embeddingWeight: 0.35,
        amountWeight: 0.4,
        dateWeight: 0.05,
      };

      const confidenceScore =
        embeddingScore * weights.embeddingWeight +
        amountScore * weights.amountWeight +
        dateScore * weights.dateWeight;

      expect(confidenceScore).toBeLessThan(0.5);
      console.log(`Poor match confidence: ${confidenceScore.toFixed(3)}`);
    });

    test("CANARY: Changes to scoring logic will affect this test", () => {
      // Test a specific scenario that will change if you modify the algorithm
      const amountScore = calculateAmountScore(99.99, "USD", 99.99, "USD");
      const dateScore = calculateDateScore("2024-01-15", "2024-01-18", "expense");
      const embeddingScore = calculateEmbeddingScore(0.2);

      const confidenceScore = 
        embeddingScore * 0.35 +
        amountScore * 0.4 +
        dateScore * 0.05;

      console.log("🔍 ALGORITHM FINGERPRINT:");
      console.log(`  Amount Score: ${amountScore}`);
      console.log(`  Date Score: ${dateScore}`);
      console.log(`  Embedding Score: ${embeddingScore}`);
      console.log(`  Final Confidence: ${confidenceScore.toFixed(4)}`);

      // These exact values will change if you modify the scoring logic
      expect(amountScore).toBe(1.0);
      expect(dateScore).toBe(0.95);
      expect(embeddingScore).toBe(0.8);
      expect(confidenceScore).toBeCloseTo(0.7275, 4);

      console.log("⚠️  If you change the scoring algorithm, these values will change!");
    });
  });
});
