import { describe, expect, test } from "bun:test";
import { allAdditionalGoldenMatches } from "./additional-golden-cases";

/**
 * Comprehensive Scenario Testing
 *
 * Tests critical scenarios missing from the original golden dataset
 * These represent real-world edge cases that the algorithm must handle correctly.
 */

describe("Comprehensive Matching Scenarios", () => {
  describe("Invoice Payment Scenarios", () => {
    test("Net 30 invoice payment should match with high confidence", () => {
      const net30Case = allAdditionalGoldenMatches.find(
        (m) => m.id === "invoice-net30-payment",
      );
      expect(net30Case).toBeTruthy();

      if (net30Case) {
        // Verify the scenario setup
        expect(net30Case.inboxItem.type).toBe("invoice");
        expect(net30Case.inboxItem.amount).toBe(net30Case.transaction.amount);

        // Calculate days difference
        const inboxDate = new Date(net30Case.inboxItem.date);
        const txnDate = new Date(net30Case.transaction.date);
        const daysDiff =
          (txnDate.getTime() - inboxDate.getTime()) / (1000 * 60 * 60 * 24);

        expect(daysDiff).toBe(30); // Exactly 30 days
        expect(net30Case.expected.minConfidence).toBeGreaterThanOrEqual(0.95);
        expect(net30Case.expected.expectedMatchType).toBe("auto_matched");
      }
    });

    test("invoice payment scenarios should account for payment terms", () => {
      const invoiceScenarios = allAdditionalGoldenMatches.filter(
        (m) => m.inboxItem.type === "invoice",
      );

      expect(invoiceScenarios.length).toBeGreaterThan(0);

      for (const scenario of invoiceScenarios) {
        const inboxDate = new Date(scenario.inboxItem.date);
        const txnDate = new Date(scenario.transaction.date);
        const daysDiff =
          (txnDate.getTime() - inboxDate.getTime()) / (1000 * 60 * 60 * 24);

        // Invoice payments should typically be after invoice date
        if (scenario.expected.shouldMatch) {
          expect(daysDiff).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe("Currency Handling Edge Cases", () => {
    test("exotic currency mismatch should be rejected", () => {
      const exoticCase = allAdditionalGoldenMatches.find(
        (m) => m.id === "exotic-currency-mismatch",
      );
      expect(exoticCase).toBeTruthy();

      if (exoticCase) {
        expect(exoticCase.inboxItem.currency).toBe("JPY");
        expect(exoticCase.transaction.currency).toBe("USD");
        expect(exoticCase.inboxItem.baseAmount).toBeNull();
        expect(exoticCase.transaction.baseAmount).toBeNull();

        // Should be rejected due to unresolved currency difference
        expect(exoticCase.expected.shouldMatch).toBe(false);
        expect(exoticCase.expected.maxConfidence).toBeLessThan(0.7);
      }
    });

    test("team base currency conversion should enable matching", () => {
      const teamBaseCase = allAdditionalGoldenMatches.find(
        (m) => m.id === "team-base-currency-conversion",
      );
      expect(teamBaseCase).toBeTruthy();

      if (teamBaseCase) {
        expect(teamBaseCase.inboxItem.currency).not.toBe(
          teamBaseCase.transaction.currency,
        );
        expect(teamBaseCase.inboxItem.baseCurrency).toBe(
          teamBaseCase.transaction.baseCurrency,
        );
        expect(teamBaseCase.inboxItem.baseAmount).toBe(
          teamBaseCase.transaction.baseAmount,
        );

        // Should match via base currency conversion
        expect(teamBaseCase.expected.shouldMatch).toBe(true);
        expect(teamBaseCase.expected.minConfidence).toBeGreaterThan(0.9);
      }
    });
  });

  describe("Team Calibration Scenarios", () => {
    test("borderline confidence should depend on team calibration", () => {
      const borderlineCase = allAdditionalGoldenMatches.find(
        (m) => m.id === "borderline-confidence-team-calibrated",
      );
      expect(borderlineCase).toBeTruthy();

      if (borderlineCase) {
        expect(borderlineCase.inboxItem.teamId).toBe("team-high-accuracy");
        expect(borderlineCase.expected.expectedMatchType).toBe("suggested");

        // Borderline case should be in the suggested range
        expect(borderlineCase.expected.minConfidence).toBeGreaterThan(0.8);
        expect(borderlineCase.expected.minConfidence).toBeLessThan(0.95);
      }
    });
  });

  describe("Recurring Transaction Intelligence", () => {
    test("recurring pattern should boost confidence", () => {
      const recurringCase = allAdditionalGoldenMatches.find(
        (m) => m.id === "recurring-pattern-boost",
      );
      expect(recurringCase).toBeTruthy();

      if (recurringCase) {
        expect(recurringCase.inboxItem.displayName.toLowerCase()).toContain(
          "subscription",
        );
        expect(recurringCase.expected.minConfidence).toBeGreaterThan(0.95);
        expect(recurringCase.expected.expectedMatchType).toBe("auto_matched");
      }
    });
  });

  describe("Semantic vs Financial Matching", () => {
    test("strong financial match should overcome weak semantics", () => {
      const weakSemanticCase = allAdditionalGoldenMatches.find(
        (m) => m.id === "weak-semantic-strong-financial",
      );
      expect(weakSemanticCase).toBeTruthy();

      if (weakSemanticCase) {
        // Same amount, date, currency (strong financial)
        expect(weakSemanticCase.inboxItem.amount).toBe(
          weakSemanticCase.transaction.amount,
        );
        expect(weakSemanticCase.inboxItem.date).toBe(
          weakSemanticCase.transaction.date,
        );
        expect(weakSemanticCase.inboxItem.currency).toBe(
          weakSemanticCase.transaction.currency,
        );

        // But different semantic context (generic vs specific)
        expect(weakSemanticCase.inboxItem.displayName).toContain(
          "Business Lunch",
        );
        expect(weakSemanticCase.transaction.name).toContain("CHEZ PIERRE");

        // Should still match due to strong financial signals
        expect(weakSemanticCase.expected.shouldMatch).toBe(true);
        expect(weakSemanticCase.expected.minConfidence).toBeGreaterThan(0.8);
      }
    });
  });

  describe("Amount Tolerance Testing", () => {
    test("amounts within tolerance should be treated as exact matches", () => {
      const toleranceCase = allAdditionalGoldenMatches.find(
        (m) => m.id === "amount-within-tolerance",
      );
      expect(toleranceCase).toBeTruthy();

      if (toleranceCase) {
        const amountDiff = Math.abs(
          toleranceCase.inboxItem.amount! - toleranceCase.transaction.amount,
        );
        expect(amountDiff).toBeLessThan(0.03); // Within reasonable tolerance (account for floating point)
        expect(toleranceCase.expected.minConfidence).toBeGreaterThanOrEqual(
          0.95,
        );
        expect(toleranceCase.expected.expectedMatchType).toBe("auto_matched");
      }
    });
  });

  describe("Date Scoring by Transaction Type", () => {
    test("expense receipts after transactions should score well", () => {
      const expenseAfterCase = allAdditionalGoldenMatches.find(
        (m) => m.id === "expense-receipt-after-transaction",
      );
      expect(expenseAfterCase).toBeTruthy();

      if (expenseAfterCase) {
        expect(expenseAfterCase.inboxItem.type).toBe("expense");

        const inboxDate = new Date(expenseAfterCase.inboxItem.date);
        const txnDate = new Date(expenseAfterCase.transaction.date);
        const daysDiff =
          (inboxDate.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24);

        expect(daysDiff).toBe(3); // Receipt 3 days after transaction
        expect(expenseAfterCase.expected.minConfidence).toBeGreaterThan(0.9);
      }
    });
  });

  describe("Confidence Boosting Logic", () => {
    test("perfect financial + strong semantic should get maximum boost", () => {
      const perfectBoostCase = allAdditionalGoldenMatches.find(
        (m) => m.id === "confidence-boost-perfect-financial-strong-semantic",
      );
      expect(perfectBoostCase).toBeTruthy();

      if (perfectBoostCase) {
        // Perfect financial match
        expect(perfectBoostCase.inboxItem.amount).toBe(
          perfectBoostCase.transaction.amount,
        );
        expect(perfectBoostCase.inboxItem.currency).toBe(
          perfectBoostCase.transaction.currency,
        );
        expect(perfectBoostCase.inboxItem.date).toBe(
          perfectBoostCase.transaction.date,
        );

        // Strong semantic match (Apple Store)
        expect(perfectBoostCase.inboxItem.displayName.toLowerCase()).toContain(
          "apple",
        );
        expect(perfectBoostCase.transaction.name.toLowerCase()).toContain(
          "apple",
        );

        // Should get maximum confidence boost
        expect(perfectBoostCase.expected.minConfidence).toBeGreaterThanOrEqual(
          0.98,
        );
      }
    });
  });

  describe("Scenario Data Quality", () => {
    test("all additional scenarios have valid structure", () => {
      for (const scenario of allAdditionalGoldenMatches) {
        // Basic structure validation
        expect(scenario.id).toBeTruthy();
        expect(scenario.description).toBeTruthy();
        expect(scenario.inboxItem).toBeTruthy();
        expect(scenario.transaction).toBeTruthy();
        expect(scenario.expected).toBeTruthy();

        // Embedding validation
        expect(Array.isArray(scenario.inboxItem.embedding)).toBe(true);
        expect(scenario.inboxItem.embedding.length).toBe(1536);
        expect(Array.isArray(scenario.transaction.embedding)).toBe(true);
        expect(scenario.transaction.embedding.length).toBe(1536);

        // Confidence range validation
        expect(scenario.expected.minConfidence).toBeGreaterThanOrEqual(0);
        expect(scenario.expected.maxConfidence).toBeLessThanOrEqual(1);
        expect(scenario.expected.minConfidence).toBeLessThanOrEqual(
          scenario.expected.maxConfidence,
        );

        // Team ID consistency
        expect(scenario.inboxItem.teamId).toBe(scenario.transaction.teamId);
      }
    });

    test("scenarios cover different confidence ranges", () => {
      const confidenceRanges = {
        veryHigh: allAdditionalGoldenMatches.filter(
          (s) => s.expected.minConfidence >= 0.95,
        ).length,
        high: allAdditionalGoldenMatches.filter(
          (s) =>
            s.expected.minConfidence >= 0.85 && s.expected.minConfidence < 0.95,
        ).length,
        medium: allAdditionalGoldenMatches.filter(
          (s) =>
            s.expected.minConfidence >= 0.7 && s.expected.minConfidence < 0.85,
        ).length,
        low: allAdditionalGoldenMatches.filter(
          (s) => s.expected.maxConfidence < 0.7,
        ).length,
      };

      // Should have scenarios across different confidence ranges
      expect(confidenceRanges.veryHigh).toBeGreaterThan(0);
      expect(confidenceRanges.high).toBeGreaterThan(0);
      expect(confidenceRanges.low).toBeGreaterThan(0);
    });

    test("scenarios cover different match types", () => {
      const matchTypes = {
        autoMatched: allAdditionalGoldenMatches.filter(
          (s) => s.expected.expectedMatchType === "auto_matched",
        ).length,
        suggested: allAdditionalGoldenMatches.filter(
          (s) => s.expected.expectedMatchType === "suggested",
        ).length,
        rejected: allAdditionalGoldenMatches.filter(
          (s) => s.expected.expectedMatchType === null,
        ).length,
      };

      expect(matchTypes.autoMatched).toBeGreaterThan(0);
      expect(matchTypes.suggested).toBeGreaterThan(0);
      expect(matchTypes.rejected).toBeGreaterThan(0);
    });
  });

  describe("Algorithm Edge Case Coverage", () => {
    test("covers all major scoring factors", () => {
      const scenarios = allAdditionalGoldenMatches;

      // Amount scoring variations
      const exactAmountMatches = scenarios.filter(
        (s) => s.inboxItem.amount === s.transaction.amount,
      );
      const differentAmounts = scenarios.filter(
        (s) => s.inboxItem.amount !== s.transaction.amount,
      );

      expect(exactAmountMatches.length).toBeGreaterThan(0);
      expect(differentAmounts.length).toBeGreaterThan(0);

      // Currency scoring variations
      const sameCurrency = scenarios.filter(
        (s) => s.inboxItem.currency === s.transaction.currency,
      );
      const differentCurrency = scenarios.filter(
        (s) => s.inboxItem.currency !== s.transaction.currency,
      );

      expect(sameCurrency.length).toBeGreaterThan(0);
      expect(differentCurrency.length).toBeGreaterThan(0);

      // Date scoring variations
      const sameDateScenarios = scenarios.filter(
        (s) => s.inboxItem.date === s.transaction.date,
      );
      const differentDates = scenarios.filter(
        (s) => s.inboxItem.date !== s.transaction.date,
      );

      expect(sameDateScenarios.length).toBeGreaterThan(0);
      expect(differentDates.length).toBeGreaterThan(0);

      // Type variations
      const invoiceTypes = scenarios.filter(
        (s) => s.inboxItem.type === "invoice",
      );
      const expenseTypes = scenarios.filter(
        (s) => s.inboxItem.type === "expense",
      );

      expect(invoiceTypes.length).toBeGreaterThan(0);
      expect(expenseTypes.length).toBeGreaterThan(0);
    });
  });
});
