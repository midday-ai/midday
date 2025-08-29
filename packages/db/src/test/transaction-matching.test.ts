import { describe, expect, test } from "bun:test";
import {
  calculateAmountScore,
  calculateCurrencyScore,
  calculateDateScore,
  isCrossCurrencyMatch,
} from "../utils/transaction-matching";

describe("Cross-Currency Matching Algorithm", () => {
  describe("Tiered Tolerance System", () => {
    test("should use 8% tolerance for small amounts (<100)", () => {
      const smallUSD = {
        amount: 50,
        currency: "USD",
        baseAmount: 500,
        baseCurrency: "SEK",
      };
      const smallSEK = {
        amount: -520, // 4% difference - within small amount tolerance
        currency: "SEK",
        baseAmount: 520,
        baseCurrency: "SEK",
      };

      expect(isCrossCurrencyMatch(smallUSD, smallSEK)).toBe(true);

      // Should fail at 6% difference
      const tooHighSEK = {
        ...smallSEK,
        amount: -530,
        baseAmount: 530,
      };
      expect(isCrossCurrencyMatch(smallUSD, tooHighSEK)).toBe(false);
    });

    test("should use 5% tolerance for medium amounts (100-1000)", () => {
      const mediumUSD = {
        amount: 500,
        currency: "USD",
        baseAmount: 5000,
        baseCurrency: "SEK",
      };
      const mediumSEK = {
        amount: -5150, // 3% difference - within medium amount tolerance
        currency: "SEK",
        baseAmount: 5150,
        baseCurrency: "SEK",
      };

      expect(isCrossCurrencyMatch(mediumUSD, mediumSEK)).toBe(true);

      // Should fail at 4% difference
      const tooHighSEK = {
        ...mediumSEK,
        amount: -5200,
        baseAmount: 5200,
      };
      expect(isCrossCurrencyMatch(mediumUSD, tooHighSEK)).toBe(false);
    });

    test("should use 3% tolerance for large amounts (>1000)", () => {
      const largeUSD = {
        amount: 2000,
        currency: "USD",
        baseAmount: 20000,
        baseCurrency: "SEK",
      };
      const largeSEK = {
        amount: -20600, // 3% difference
        currency: "SEK",
        baseAmount: 20600,
        baseCurrency: "SEK",
      };

      expect(isCrossCurrencyMatch(largeUSD, largeSEK)).toBe(true);

      // Should fail at 4% difference
      const tooHighSEK = {
        ...largeSEK,
        amount: -20800,
        baseAmount: 20800,
      };
      expect(isCrossCurrencyMatch(largeUSD, tooHighSEK)).toBe(false);
    });
  });

  describe("Cross-Currency Edge Cases", () => {
    test("should reject same currency matches", () => {
      const usd1 = {
        amount: 100,
        currency: "USD",
        baseAmount: 1000,
        baseCurrency: "SEK",
      };
      const usd2 = {
        amount: -100,
        currency: "USD", // Same currency!
        baseAmount: 1000,
        baseCurrency: "SEK",
      };

      expect(isCrossCurrencyMatch(usd1, usd2)).toBe(false);
    });

    test("should reject different base currencies", () => {
      const usdToSek = {
        amount: 100,
        currency: "USD",
        baseAmount: 1000,
        baseCurrency: "SEK",
      };
      const eurToDkk = {
        amount: -90,
        currency: "EUR",
        baseAmount: 900,
        baseCurrency: "DKK", // Different base currency!
      };

      expect(isCrossCurrencyMatch(usdToSek, eurToDkk)).toBe(false);
    });

    test("should handle missing base amounts", () => {
      const withoutBase = {
        amount: 100,
        currency: "USD",
        baseAmount: null,
        baseCurrency: "SEK",
      };
      const withBase = {
        amount: -1000,
        currency: "SEK",
        baseAmount: 1000,
        baseCurrency: "SEK",
      };

      expect(isCrossCurrencyMatch(withoutBase, withBase)).toBe(false);
    });
  });

  describe("Regression Tests - 15% to 5% Tolerance Change", () => {
    test("should reject matches that would have passed with old 15% tolerance", () => {
      // This should have matched with old 15% tolerance but fail with new system
      const usd = {
        amount: 100,
        currency: "USD",
        baseAmount: 1000,
        baseCurrency: "SEK",
      };
      const sek = {
        amount: -850, // 15% difference
        currency: "SEK",
        baseAmount: 850,
        baseCurrency: "SEK",
      };

      // Should fail with new conservative tolerance
      expect(isCrossCurrencyMatch(usd, sek)).toBe(false);
    });

    test("should still match legitimate exchange rate fluctuations", () => {
      // This should pass with both old and new system
      const usd = {
        amount: 100,
        currency: "USD",
        baseAmount: 1000,
        baseCurrency: "SEK",
      };
      const sek = {
        amount: -1020, // 2% difference - normal exchange rate fluctuation
        currency: "SEK",
        baseAmount: 1020,
        baseCurrency: "SEK",
      };

      expect(isCrossCurrencyMatch(usd, sek)).toBe(true);
    });
  });
});

describe("Amount Scoring Algorithm", () => {
  describe("Perfect Matches", () => {
    test("should give perfect score for exact amount matches", () => {
      const item1 = { amount: 100, currency: "USD" };
      const item2 = { amount: 100, currency: "USD" };

      const score = calculateAmountScore(item1, item2);
      expect(score).toBeGreaterThan(0.99); // Should be ~1.1 with bonus
    });

    test("should handle opposite signs correctly (invoice vs payment)", () => {
      const invoice = { amount: 599, currency: "SEK" };
      const payment = { amount: -599, currency: "SEK" };

      const score = calculateAmountScore(invoice, payment);
      expect(score).toBeGreaterThan(0.99); // Should be perfect match
    });
  });

  describe("Percentage-Based Tolerance", () => {
    test("should score 1% difference highly", () => {
      const item1 = { amount: 100, currency: "USD" };
      const item2 = { amount: 101, currency: "USD" }; // 1% difference

      const score = calculateAmountScore(item1, item2);
      expect(score).toBeGreaterThan(0.9); // Should be high score
    });

    test("should penalize 10% difference significantly", () => {
      const item1 = { amount: 100, currency: "USD" };
      const item2 = { amount: 110, currency: "USD" }; // 10% difference

      const score = calculateAmountScore(item1, item2);
      expect(score).toBeLessThan(0.7); // Should be lower score
      expect(score).toBeGreaterThan(0.5); // But not zero
    });

    test("should give zero score for >20% difference", () => {
      const item1 = { amount: 100, currency: "USD" };
      const item2 = { amount: 200, currency: "USD" }; // 100% difference

      const score = calculateAmountScore(item1, item2);
      expect(score).toBe(0);
    });
  });

  describe("Cross-Currency Amount Scoring", () => {
    test("should use base amounts for different currencies", () => {
      const usdItem = {
        amount: 100,
        currency: "USD",
        baseAmount: 1000,
        baseCurrency: "SEK",
      };
      const sekItem = {
        amount: -1020, // 2% difference in base currency
        currency: "SEK",
        baseAmount: 1020,
        baseCurrency: "SEK",
      };

      const score = calculateAmountScore(usdItem, sekItem);
      expect(score).toBeGreaterThan(0.85); // Should be good score for 2% diff
    });

    test("should handle missing base amounts gracefully", () => {
      const usdItem = { amount: 100, currency: "USD" };
      const sekItem = { amount: -1000, currency: "SEK" };

      const score = calculateAmountScore(usdItem, sekItem);
      expect(score).toBe(0.1); // Low score for suspicious cross-currency without base amounts
    });
  });
});

describe("Currency Scoring Algorithm", () => {
  test("should give perfect score for exact currency match", () => {
    const score = calculateCurrencyScore("USD", "USD");
    expect(score).toBe(1.0);
  });

  test("should be conservative with different currencies", () => {
    const score = calculateCurrencyScore("USD", "SEK");
    expect(score).toBe(0.3); // Conservative score for cross-currency
  });

  test("should handle missing currencies", () => {
    const score1 = calculateCurrencyScore(undefined, "USD");
    const score2 = calculateCurrencyScore("USD", undefined);
    const score3 = calculateCurrencyScore(undefined, undefined);

    expect(score1).toBe(0.5);
    expect(score2).toBe(0.5);
    expect(score3).toBe(0.5);
  });
});

describe("Date Scoring Algorithm", () => {
  test("should give high score for same date", () => {
    const date = "2024-08-25";
    const score = calculateDateScore(date, date);
    expect(score).toBe(0.85); // Expense logic with banking delay consideration
  });

  test("should give high score for 1 day difference", () => {
    const score = calculateDateScore("2024-08-25", "2024-08-26");
    expect(score).toBe(0.85); // Expense logic with banking delay consideration
  });

  test("should give good score for 1 week difference", () => {
    const score = calculateDateScore("2024-08-25", "2024-09-01");
    expect(score).toBeGreaterThan(0.7);
    expect(score).toBeLessThan(0.9);
  });

  test("should give low score for 1 month difference", () => {
    const score = calculateDateScore("2024-08-25", "2024-09-25");
    expect(score).toBeLessThan(0.3);
  });
});

describe("Real-World Scenarios", () => {
  describe("Bruce Invoice Match (Your Example)", () => {
    test("should score Bruce match highly", () => {
      const invoice = {
        amount: 599,
        currency: "SEK",
        date: "2024-08-23",
      };
      const payment = {
        amount: -599,
        currency: "SEK",
        date: "2024-08-25",
      };

      const amountScore = calculateAmountScore(invoice, payment);
      const currencyScore = calculateCurrencyScore(
        invoice.currency,
        payment.currency,
      );
      const dateScore = calculateDateScore(invoice.date, payment.date);

      expect(amountScore).toBeGreaterThan(0.99); // Perfect amount match
      expect(currencyScore).toBe(1.0); // Perfect currency match
      expect(dateScore).toBe(0.85); // 2-day difference with expense logic
    });
  });

  describe("Cross-Currency Vercel Match", () => {
    test("should handle Vercel USD to SEK match conservatively", () => {
      const invoice = {
        amount: 260.18,
        currency: "USD",
        baseAmount: 2570.78,
        baseCurrency: "SEK",
      };
      const payment = {
        amount: -2570.78,
        currency: "SEK",
        baseAmount: 2570.78,
        baseCurrency: "SEK",
      };

      const amountScore = calculateAmountScore(invoice, payment);
      const currencyScore = calculateCurrencyScore(
        invoice.currency,
        payment.currency,
      );

      expect(amountScore).toBeGreaterThan(0.99); // Perfect base amount match
      expect(currencyScore).toBe(0.3); // Conservative cross-currency score
    });
  });

  describe("False Positive Prevention", () => {
    test("should prevent clearly wrong cross-currency matches", () => {
      const usdTransaction = {
        amount: 260.18,
        currency: "USD",
        baseAmount: 2570.78,
        baseCurrency: "SEK",
      };
      const wrongSekTransaction = {
        amount: -500, // Way off - 80% difference
        currency: "SEK",
        baseAmount: 500,
        baseCurrency: "SEK",
      };

      // Cross-currency check should fail
      expect(isCrossCurrencyMatch(usdTransaction, wrongSekTransaction)).toBe(
        false,
      );

      // Amount score should be very low
      const amountScore = calculateAmountScore(
        usdTransaction,
        wrongSekTransaction,
      );
      expect(amountScore).toBe(0); // Should be 0 for >20% difference
    });
  });
});
