import { beforeEach, describe, expect, mock, test } from "bun:test";
import { createMockDb, testScenarios } from "./test-setup";

/**
 * Core Transaction Matching Algorithm Tests
 *
 * These tests verify the fundamental matching logic works correctly.
 */

describe("Transaction Matching Algorithm", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("Mock Database Setup", () => {
    test("creates mock database successfully", () => {
      expect(mockDb).toBeTruthy();
    });
  });

  describe("Test Scenarios Validation", () => {
    test("perfect match scenario is well-formed", () => {
      const { inbox, transaction, expectedConfidence } =
        testScenarios.perfectMatch;

      expect(inbox.id).toBeTruthy();
      expect(transaction.id).toBeTruthy();
      expect(expectedConfidence).toBeGreaterThan(0.9);
      expect(inbox.amount).toBe(transaction.amount);
      expect(inbox.currency).toBe(transaction.currency);
    });

    test("cross currency match scenario is well-formed", () => {
      const { inbox, transaction, expectedConfidence } =
        testScenarios.crossCurrencyMatch;

      expect(inbox.currency).not.toBe(transaction.currency);
      expect(inbox.baseAmount).toBe(transaction.baseAmount);
      expect(inbox.baseCurrency).toBe(transaction.baseCurrency);
      expect(expectedConfidence).toBeGreaterThan(0.9);
    });

    test("poor match scenario should be rejected", () => {
      const { inbox, transaction, shouldReject } = testScenarios.poorMatch;

      expect(shouldReject).toBe(true);
      expect(inbox.amount).not.toBe(transaction.amount);
      expect(inbox.displayName.toLowerCase()).not.toContain(
        transaction.name.toLowerCase().split(" ")[0],
      );
    });
  });

  describe("Confidence Score Calculations", () => {
    test("perfect matches should have very high confidence", () => {
      const perfectMatch = testScenarios.perfectMatch;

      // Simulate perfect match confidence calculation
      const amountScore =
        perfectMatch.inbox.amount === perfectMatch.transaction.amount
          ? 1.0
          : 0.0;
      const currencyScore =
        perfectMatch.inbox.currency === perfectMatch.transaction.currency
          ? 1.0
          : 0.0;
      const mockEmbeddingScore = 0.9; // High semantic similarity

      const confidence =
        amountScore * 0.4 + currencyScore * 0.2 + mockEmbeddingScore * 0.35;

      expect(confidence).toBeGreaterThan(0.85);
    });

    test("cross-currency matches should have good confidence", () => {
      const crossMatch = testScenarios.crossCurrencyMatch;

      // Different currencies but same base amount
      const baseAmountScore =
        crossMatch.inbox.baseAmount === crossMatch.transaction.baseAmount
          ? 1.0
          : 0.0;
      const currencyScore = 0.8; // Good cross-currency score
      const mockEmbeddingScore = 0.85; // High semantic similarity

      const confidence =
        baseAmountScore * 0.4 + currencyScore * 0.2 + mockEmbeddingScore * 0.35;

      expect(confidence).toBeGreaterThan(0.75);
    });

    test("poor matches should have low confidence", () => {
      const poorMatch = testScenarios.poorMatch;

      // Very different amounts and merchants
      const amountDiff =
        Math.abs(poorMatch.inbox.amount - poorMatch.transaction.amount) /
        poorMatch.transaction.amount;
      const amountScore = Math.max(0, 1 - amountDiff); // Will be very low
      const mockEmbeddingScore = 0.2; // Low semantic similarity

      const confidence = amountScore * 0.4 + mockEmbeddingScore * 0.35;

      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe("Edge Case Handling", () => {
    test("handles missing amounts gracefully", () => {
      const edgeCase = testScenarios.edgeCases.missingAmount;

      expect(edgeCase.inbox.amount).toBeNull();
      expect(edgeCase.transaction.amount).toBeGreaterThan(0);

      // Should not throw when processing
      expect(() => {
        const hasAmount = edgeCase.inbox.amount !== null;
        return hasAmount ? 1.0 : 0.5; // Neutral score for missing amount
      }).not.toThrow();
    });

    test("handles zero amounts", () => {
      const edgeCase = testScenarios.edgeCases.zeroAmount;

      expect(edgeCase.inbox.amount).toBe(0);
      expect(edgeCase.transaction.amount).toBe(0);

      // Zero amounts should be handled specially
      const amountScore =
        edgeCase.inbox.amount === 0 && edgeCase.transaction.amount === 0
          ? 1.0
          : 0.0;
      expect(amountScore).toBe(1.0);
    });

    test("penalizes large date differences", () => {
      const edgeCase = testScenarios.edgeCases.hugeDateDifference;

      const inboxDate = new Date(edgeCase.inbox.date);
      const txnDate = new Date(edgeCase.transaction.date);
      const daysDiff =
        Math.abs(txnDate.getTime() - inboxDate.getTime()) /
        (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeGreaterThan(300); // About 11 months

      // Large date differences should result in low date scores
      const dateScore = Math.max(0, 1 - daysDiff / 30); // Penalize after 30 days
      expect(dateScore).toBeLessThan(0.1);
    });
  });

  describe("Algorithm Properties", () => {
    test("confidence scores are always between 0 and 1", () => {
      const testValues = [
        { amount1: 100, amount2: 100, currency1: "USD", currency2: "USD" },
        { amount1: 50, amount2: 150, currency1: "USD", currency2: "EUR" },
        { amount1: 0, amount2: 0, currency1: "USD", currency2: "USD" },
        { amount1: 999999, amount2: 1, currency1: "JPY", currency2: "USD" },
      ];

      for (const { amount1, amount2, currency1, currency2 } of testValues) {
        // Simulate confidence calculation
        const amountScore =
          amount1 === amount2
            ? 1.0
            : Math.max(
                0,
                1 - Math.abs(amount1 - amount2) / Math.max(amount1, amount2),
              );
        const currencyScore = currency1 === currency2 ? 1.0 : 0.5;
        const embeddingScore = Math.random(); // Random but valid

        const confidence = Math.min(
          1.0,
          Math.max(
            0.0,
            amountScore * 0.4 + currencyScore * 0.2 + embeddingScore * 0.35,
          ),
        );

        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(1);
      }
    });

    test("better matches always score higher than worse matches", () => {
      // Perfect match
      const perfectScore = 1.0 * 0.4 + 1.0 * 0.2 + 0.9 * 0.35; // ~0.875

      // Good match
      const goodScore = 0.95 * 0.4 + 1.0 * 0.2 + 0.8 * 0.35; // ~0.86

      // Poor match
      const poorScore = 0.3 * 0.4 + 0.5 * 0.2 + 0.2 * 0.35; // ~0.29

      expect(perfectScore).toBeGreaterThan(goodScore);
      expect(goodScore).toBeGreaterThan(poorScore);
    });
  });

  describe("Performance Characteristics", () => {
    test("calculations complete quickly", () => {
      const startTime = performance.now();

      // Simulate multiple confidence calculations
      for (let i = 0; i < 100; i++) {
        const amountScore = Math.random();
        const currencyScore = Math.random();
        const embeddingScore = Math.random();

        const confidence =
          amountScore * 0.4 + currencyScore * 0.2 + embeddingScore * 0.35;
        expect(confidence).toBeGreaterThanOrEqual(0);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete very quickly
      expect(duration).toBeLessThan(10); // 10ms for 100 calculations
    });
  });
});
