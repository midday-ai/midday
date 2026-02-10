import { describe, expect, test } from "bun:test";
import {
  fromStripeAmount,
  getCurrencyMultiplier,
  isThreeDecimalCurrency,
  isZeroDecimalCurrency,
  THREE_DECIMAL_CURRENCIES,
  toStripeAmount,
  ZERO_DECIMAL_CURRENCIES,
} from "./currency";

describe("Currency Utilities", () => {
  describe("ZERO_DECIMAL_CURRENCIES", () => {
    test("should contain all 16 zero-decimal currencies", () => {
      expect(ZERO_DECIMAL_CURRENCIES.size).toBe(16);
    });

    test("should contain JPY (Japanese Yen)", () => {
      expect(ZERO_DECIMAL_CURRENCIES.has("jpy")).toBe(true);
    });

    test("should contain KRW (South Korean Won)", () => {
      expect(ZERO_DECIMAL_CURRENCIES.has("krw")).toBe(true);
    });

    test("should NOT contain USD", () => {
      expect(ZERO_DECIMAL_CURRENCIES.has("usd")).toBe(false);
    });
  });

  describe("THREE_DECIMAL_CURRENCIES", () => {
    test("should contain all 5 three-decimal currencies", () => {
      expect(THREE_DECIMAL_CURRENCIES.size).toBe(5);
    });

    test("should contain KWD (Kuwaiti Dinar)", () => {
      expect(THREE_DECIMAL_CURRENCIES.has("kwd")).toBe(true);
    });
  });

  describe("isZeroDecimalCurrency", () => {
    test("should return true for zero-decimal currencies", () => {
      expect(isZeroDecimalCurrency("jpy")).toBe(true);
      expect(isZeroDecimalCurrency("krw")).toBe(true);
      expect(isZeroDecimalCurrency("vnd")).toBe(true);
    });

    test("should return false for standard currencies", () => {
      expect(isZeroDecimalCurrency("usd")).toBe(false);
      expect(isZeroDecimalCurrency("eur")).toBe(false);
    });

    test("should be case-insensitive", () => {
      expect(isZeroDecimalCurrency("JPY")).toBe(true);
      expect(isZeroDecimalCurrency("Jpy")).toBe(true);
    });
  });

  describe("isThreeDecimalCurrency", () => {
    test("should return true for three-decimal currencies", () => {
      expect(isThreeDecimalCurrency("kwd")).toBe(true);
      expect(isThreeDecimalCurrency("bhd")).toBe(true);
    });

    test("should return false for standard currencies", () => {
      expect(isThreeDecimalCurrency("usd")).toBe(false);
    });

    test("should be case-insensitive", () => {
      expect(isThreeDecimalCurrency("KWD")).toBe(true);
    });
  });

  describe("getCurrencyMultiplier", () => {
    test("should return 1 for zero-decimal currencies", () => {
      expect(getCurrencyMultiplier("jpy")).toBe(1);
      expect(getCurrencyMultiplier("krw")).toBe(1);
    });

    test("should return 1000 for three-decimal currencies", () => {
      expect(getCurrencyMultiplier("kwd")).toBe(1000);
      expect(getCurrencyMultiplier("bhd")).toBe(1000);
    });

    test("should return 100 for standard currencies", () => {
      expect(getCurrencyMultiplier("usd")).toBe(100);
      expect(getCurrencyMultiplier("eur")).toBe(100);
    });
  });

  describe("toStripeAmount", () => {
    describe("standard currencies (2 decimal places)", () => {
      test("should multiply by 100 for USD", () => {
        expect(toStripeAmount(10.0, "usd")).toBe(1000);
        expect(toStripeAmount(10.5, "usd")).toBe(1050);
        expect(toStripeAmount(10.99, "usd")).toBe(1099);
      });

      test("should handle decimal rounding correctly", () => {
        expect(toStripeAmount(10.999, "usd")).toBe(1100);
        expect(toStripeAmount(10.991, "usd")).toBe(1099);
      });
    });

    describe("zero-decimal currencies", () => {
      test("should NOT multiply for JPY (Japanese Yen)", () => {
        expect(toStripeAmount(1000, "jpy")).toBe(1000);
        expect(toStripeAmount(500, "jpy")).toBe(500);
      });

      test("should NOT multiply for KRW (South Korean Won)", () => {
        expect(toStripeAmount(50000, "krw")).toBe(50000);
      });
    });

    describe("three-decimal currencies", () => {
      test("should multiply by 1000 for KWD (Kuwaiti Dinar)", () => {
        expect(toStripeAmount(10.0, "kwd")).toBe(10000);
        expect(toStripeAmount(10.5, "kwd")).toBe(10500);
      });
    });

    describe("real-world invoice scenarios", () => {
      test("should correctly convert a ¥10,000 JPY invoice (bug case)", () => {
        // This is the bug scenario - should NOT become 1,000,000
        expect(toStripeAmount(10000, "jpy")).toBe(10000);
      });

      test("should correctly convert a ₩50,000 KRW invoice (bug case)", () => {
        // This is the bug scenario - should NOT become 5,000,000
        expect(toStripeAmount(50000, "krw")).toBe(50000);
      });

      test("should correctly convert a $99.99 USD invoice", () => {
        expect(toStripeAmount(99.99, "usd")).toBe(9999);
      });
    });
  });

  describe("fromStripeAmount", () => {
    test("should divide by 100 for USD", () => {
      expect(fromStripeAmount(1000, "usd")).toBe(10);
      expect(fromStripeAmount(1050, "usd")).toBe(10.5);
    });

    test("should NOT divide for JPY", () => {
      expect(fromStripeAmount(1000, "jpy")).toBe(1000);
    });

    test("should divide by 1000 for KWD", () => {
      expect(fromStripeAmount(10000, "kwd")).toBe(10);
    });

    describe("round-trip conversion", () => {
      test("should round-trip correctly for standard currencies", () => {
        const amounts = [10.0, 10.5, 99.99, 1234.56];
        for (const amount of amounts) {
          const stripeAmount = toStripeAmount(amount, "usd");
          const result = fromStripeAmount(stripeAmount, "usd");
          expect(result).toBeCloseTo(amount, 2);
        }
      });

      test("should round-trip correctly for zero-decimal currencies", () => {
        const amounts = [1000, 5000, 10000, 50000];
        for (const amount of amounts) {
          const stripeAmount = toStripeAmount(amount, "jpy");
          const result = fromStripeAmount(stripeAmount, "jpy");
          expect(result).toBe(amount);
        }
      });
    });
  });
});
