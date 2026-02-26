import { describe, expect, test } from "bun:test";
import { toStripeAmount, fromStripeAmount } from "./currency";

describe("Currency Utilities (USD-only)", () => {
  describe("toStripeAmount", () => {
    test("should convert dollars to cents", () => {
      expect(toStripeAmount(10.0)).toBe(1000);
      expect(toStripeAmount(10.5)).toBe(1050);
      expect(toStripeAmount(10.99)).toBe(1099);
    });

    test("should handle decimal rounding correctly", () => {
      expect(toStripeAmount(10.999)).toBe(1100);
      expect(toStripeAmount(10.991)).toBe(1099);
    });

    test("should correctly convert a $99.99 deal", () => {
      expect(toStripeAmount(99.99)).toBe(9999);
    });
  });

  describe("fromStripeAmount", () => {
    test("should convert cents to dollars", () => {
      expect(fromStripeAmount(1000)).toBe(10);
      expect(fromStripeAmount(1050)).toBe(10.5);
    });

    describe("round-trip conversion", () => {
      test("should round-trip correctly", () => {
        const amounts = [10.0, 10.5, 99.99, 1234.56];
        for (const amount of amounts) {
          const stripeAmount = toStripeAmount(amount);
          const result = fromStripeAmount(stripeAmount);
          expect(result).toBeCloseTo(amount, 2);
        }
      });
    });
  });
});
