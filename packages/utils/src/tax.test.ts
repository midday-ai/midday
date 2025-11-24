import { describe, expect, test } from "bun:test";
import {
  calculateTaxAmount,
  calculateTaxAmountFromGross,
  calculateTaxRateFromGross,
  resolveTaxValues,
} from "./tax";

describe("Tax Utilities", () => {
  describe("calculateTaxAmount", () => {
    test("should calculate tax for positive amounts", () => {
      expect(calculateTaxAmount(100, 25)).toBe(25);
      expect(calculateTaxAmount(1000, 20)).toBe(200);
      expect(calculateTaxAmount(50, 10)).toBe(5);
    });

    test("should calculate tax for negative amounts (expenses)", () => {
      expect(calculateTaxAmount(-100, 25)).toBe(25);
      expect(calculateTaxAmount(-1000, 20)).toBe(200);
    });

    test("should handle decimal tax rates", () => {
      expect(calculateTaxAmount(100, 8.5)).toBe(8.5);
      expect(calculateTaxAmount(200, 12.5)).toBe(25);
      expect(calculateTaxAmount(333, 15.5)).toBe(51.62);
    });

    test("should round to 2 decimal places", () => {
      expect(calculateTaxAmount(333, 15)).toBe(49.95);
      expect(calculateTaxAmount(99.99, 19)).toBe(19);
    });

    test("should handle zero rate", () => {
      expect(calculateTaxAmount(100, 0)).toBe(0);
    });

    test("should handle zero amount", () => {
      expect(calculateTaxAmount(0, 25)).toBe(0);
    });

    test("should handle very large amounts", () => {
      expect(calculateTaxAmount(1000000, 25)).toBe(250000);
    });

    test("should handle very small amounts", () => {
      expect(calculateTaxAmount(0.01, 25)).toBe(0);
      expect(calculateTaxAmount(1, 25)).toBe(0.25);
    });
  });

  describe("calculateTaxAmountFromGross", () => {
    test("should calculate VAT from gross amount correctly", () => {
      // Example from the bug report: €33.84 gross with 23% VAT = €6.33
      expect(calculateTaxAmountFromGross(33.84, 23)).toBe(6.33);
      // Net would be: 33.84 - 6.33 = 27.51
      // Verification: 27.51 × 1.23 = 33.84 ✓
    });

    test("should calculate tax for common VAT rates", () => {
      // 100 gross with 25% VAT = 20 VAT (not 25)
      expect(calculateTaxAmountFromGross(100, 25)).toBe(20);
      // 100 gross with 20% VAT = 16.67 VAT (not 20)
      expect(calculateTaxAmountFromGross(100, 20)).toBe(16.67);
      // 100 gross with 19% VAT = 15.97 VAT (not 19)
      expect(calculateTaxAmountFromGross(100, 19)).toBe(15.97);
    });

    test("should calculate tax for negative amounts (expenses)", () => {
      expect(calculateTaxAmountFromGross(-100, 25)).toBe(20);
      expect(calculateTaxAmountFromGross(-33.84, 23)).toBe(6.33);
    });

    test("should handle decimal tax rates", () => {
      expect(calculateTaxAmountFromGross(100, 8.5)).toBe(7.83);
      expect(calculateTaxAmountFromGross(200, 12.5)).toBe(22.22);
    });

    test("should round to 2 decimal places", () => {
      expect(calculateTaxAmountFromGross(99.99, 19)).toBe(15.96);
    });

    test("should handle zero rate", () => {
      expect(calculateTaxAmountFromGross(100, 0)).toBe(0);
    });

    test("should handle zero amount", () => {
      expect(calculateTaxAmountFromGross(0, 25)).toBe(0);
    });
  });

  describe("resolveTaxValues - Priority 1: Transaction taxAmount (Fixed Mode)", () => {
    test("should use stored taxAmount when set", () => {
      const result = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: 50,
        transactionTaxRate: null,
        transactionTaxType: "vat",
        categoryTaxRate: 25,
        categoryTaxType: "gst",
      });

      expect(result.taxAmount).toBe(50);
      expect(result.taxRate).toBe(null);
      expect(result.taxType).toBe("vat");
    });

    test("should handle zero taxAmount as valid (no tax)", () => {
      const result = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: 0,
        transactionTaxRate: null,
        transactionTaxType: "vat",
        categoryTaxRate: 25, // Should NOT fall back to this
        categoryTaxType: "gst",
      });

      expect(result.taxAmount).toBe(0);
      expect(result.taxRate).toBe(null);
      expect(result.taxType).toBe("vat");
    });

    test("should preserve taxRate when both taxAmount and taxRate are set", () => {
      const result = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: 25,
        transactionTaxRate: 25, // Keep for historical reference
        transactionTaxType: "vat",
        categoryTaxRate: null,
        categoryTaxType: null,
      });

      expect(result.taxAmount).toBe(25);
      expect(result.taxRate).toBe(25);
      expect(result.taxType).toBe("vat");
    });
  });

  describe("resolveTaxValues - Priority 2: Transaction taxRate (Percentage Mode)", () => {
    test("should calculate from transaction taxRate when no taxAmount", () => {
      const result = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: null,
        transactionTaxRate: 25,
        transactionTaxType: "vat",
        categoryTaxRate: 20,
        categoryTaxType: "gst",
      });

      // Bank transactions are gross, so 100 × (25/125) = 20
      expect(result.taxAmount).toBe(20);
      expect(result.taxRate).toBe(25);
      expect(result.taxType).toBe("vat");
    });

    test("should handle zero taxRate", () => {
      const result = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: null,
        transactionTaxRate: 0,
        transactionTaxType: "vat",
        categoryTaxRate: 25,
        categoryTaxType: "gst",
      });

      expect(result.taxAmount).toBe(0);
      expect(result.taxRate).toBe(0);
      expect(result.taxType).toBe("vat");
    });

    test("should work with negative amounts", () => {
      const result = resolveTaxValues({
        transactionAmount: -100,
        transactionTaxAmount: null,
        transactionTaxRate: 25,
        transactionTaxType: "sales_tax",
        categoryTaxRate: null,
        categoryTaxType: null,
      });

      // Bank transactions are gross, so -100 × (25/125) = 20 (always positive)
      expect(result.taxAmount).toBe(20);
      expect(result.taxRate).toBe(25);
      expect(result.taxType).toBe("sales_tax");
    });
  });

  describe("resolveTaxValues - Priority 3: Category taxRate (Inherited)", () => {
    test("should calculate from category taxRate when no transaction tax values", () => {
      const result = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: null,
        transactionTaxRate: null,
        transactionTaxType: null,
        categoryTaxRate: 20,
        categoryTaxType: "gst",
      });

      // Bank transactions are gross, so 100 × (20/120) = 16.67
      expect(result.taxAmount).toBe(16.67);
      expect(result.taxRate).toBe(20);
      expect(result.taxType).toBe("gst");
    });

    test("should inherit category taxType when transaction has no taxType", () => {
      const result = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: 25,
        transactionTaxRate: null,
        transactionTaxType: null,
        categoryTaxRate: 20,
        categoryTaxType: "withholding_tax",
      });

      expect(result.taxAmount).toBe(25);
      expect(result.taxRate).toBe(null);
      expect(result.taxType).toBe("withholding_tax");
    });
  });

  describe("resolveTaxValues - Priority 4: No Tax", () => {
    test("should return null values when no tax data is available", () => {
      const result = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: null,
        transactionTaxRate: null,
        transactionTaxType: null,
        categoryTaxRate: null,
        categoryTaxType: null,
      });

      expect(result.taxAmount).toBe(null);
      expect(result.taxRate).toBe(null);
      expect(result.taxType).toBe(null);
    });
  });

  describe("resolveTaxValues - Real-world Scenarios", () => {
    test("should handle user switching from percentage to fixed", () => {
      // User had 25% tax on $100 gross = $20 VAT
      const beforeSwitch = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: null,
        transactionTaxRate: 25,
        transactionTaxType: "vat",
        categoryTaxRate: null,
        categoryTaxType: null,
      });
      // Bank transactions are gross, so 100 × (25/125) = 20
      expect(beforeSwitch.taxAmount).toBe(20);
      expect(beforeSwitch.taxRate).toBe(25);

      // User switches to fixed $30
      const afterSwitch = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: 30,
        transactionTaxRate: null,
        transactionTaxType: "vat",
        categoryTaxRate: null,
        categoryTaxType: null,
      });
      expect(afterSwitch.taxAmount).toBe(30);
      expect(afterSwitch.taxRate).toBe(null);
    });

    test("should handle user switching from fixed to percentage", () => {
      // User had fixed $50
      const beforeSwitch = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: 50,
        transactionTaxRate: null,
        transactionTaxType: "gst",
        categoryTaxRate: null,
        categoryTaxType: null,
      });
      expect(beforeSwitch.taxAmount).toBe(50);
      expect(beforeSwitch.taxRate).toBe(null);

      // User switches to 20%
      const afterSwitch = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: null,
        transactionTaxRate: 20,
        transactionTaxType: "gst",
        categoryTaxRate: null,
        categoryTaxType: null,
      });
      // Bank transactions are gross, so 100 × (20/120) = 16.67
      expect(afterSwitch.taxAmount).toBe(16.67);
      expect(afterSwitch.taxRate).toBe(20);
    });

    test("should handle category default with transaction override", () => {
      // Category has 25% VAT, but transaction overrides with 15% sales tax
      const result = resolveTaxValues({
        transactionAmount: 200,
        transactionTaxAmount: null,
        transactionTaxRate: 15,
        transactionTaxType: "sales_tax",
        categoryTaxRate: 25,
        categoryTaxType: "vat",
      });

      // Bank transactions are gross, so 200 × (15/115) = 26.09
      expect(result.taxAmount).toBe(26.09);
      expect(result.taxRate).toBe(15);
      expect(result.taxType).toBe("sales_tax");
    });

    test("should handle EU VAT scenario", () => {
      const result = resolveTaxValues({
        transactionAmount: 1000,
        transactionTaxAmount: null,
        transactionTaxRate: 19,
        transactionTaxType: "vat",
        categoryTaxRate: null,
        categoryTaxType: null,
      });

      // Bank transactions are gross, so 1000 × (19/119) = 159.66
      expect(result.taxAmount).toBe(159.66);
      expect(result.taxRate).toBe(19);
      expect(result.taxType).toBe("vat");
    });

    test("should handle US sales tax scenario with varying rates", () => {
      const result = resolveTaxValues({
        transactionAmount: 500,
        transactionTaxAmount: null,
        transactionTaxRate: 8.875, // NYC sales tax
        transactionTaxType: "sales_tax",
        categoryTaxRate: null,
        categoryTaxType: null,
      });

      // Bank transactions are gross, so 500 × (8.875/108.875) = 40.76
      expect(result.taxAmount).toBe(40.76);
      expect(result.taxRate).toBe(8.875);
      expect(result.taxType).toBe("sales_tax");
    });

    test("should handle withholding tax on invoice", () => {
      const result = resolveTaxValues({
        transactionAmount: 5000,
        transactionTaxAmount: null,
        transactionTaxRate: 10,
        transactionTaxType: "withholding_tax",
        categoryTaxRate: null,
        categoryTaxType: null,
      });

      // Bank transactions are gross, so 5000 × (10/110) = 454.55
      expect(result.taxAmount).toBe(454.55);
      expect(result.taxRate).toBe(10);
      expect(result.taxType).toBe("withholding_tax");
    });

    test("should handle custom fixed tax amount", () => {
      // Company policy: fixed $15 processing fee
      const result = resolveTaxValues({
        transactionAmount: 250,
        transactionTaxAmount: 15,
        transactionTaxRate: null,
        transactionTaxType: "custom_tax",
        categoryTaxRate: 20,
        categoryTaxType: "vat",
      });

      expect(result.taxAmount).toBe(15);
      expect(result.taxRate).toBe(null);
      expect(result.taxType).toBe("custom_tax");
    });
  });

  describe("resolveTaxValues - Edge Cases", () => {
    test("should handle undefined vs null correctly", () => {
      const resultWithUndefined = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: undefined,
        transactionTaxRate: undefined,
        transactionTaxType: undefined,
        categoryTaxRate: 25,
        categoryTaxType: "vat",
      });

      // Bank transactions are gross, so 100 × (25/125) = 20
      expect(resultWithUndefined.taxAmount).toBe(20);
      expect(resultWithUndefined.taxRate).toBe(25);
      expect(resultWithUndefined.taxType).toBe("vat");
    });

    test("should handle very small decimal tax rates", () => {
      const result = resolveTaxValues({
        transactionAmount: 10000,
        transactionTaxAmount: null,
        transactionTaxRate: 0.25,
        transactionTaxType: "vat",
        categoryTaxRate: null,
        categoryTaxType: null,
      });

      // Bank transactions are gross, so 10000 × (0.25/100.25) = 24.94
      expect(result.taxAmount).toBe(24.94);
      expect(result.taxRate).toBe(0.25);
    });

    test("should handle large tax rates (>100%)", () => {
      const result = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: null,
        transactionTaxRate: 150,
        transactionTaxType: "excise_tax",
        categoryTaxRate: null,
        categoryTaxType: null,
      });

      // Bank transactions are gross, so 100 × (150/250) = 60
      expect(result.taxAmount).toBe(60);
      expect(result.taxRate).toBe(150);
    });

    test("should handle fractional amounts", () => {
      const result = resolveTaxValues({
        transactionAmount: 99.99,
        transactionTaxAmount: null,
        transactionTaxRate: 25,
        transactionTaxType: "vat",
        categoryTaxRate: null,
        categoryTaxType: null,
      });

      // Bank transactions are gross, so 99.99 × (25/125) = 20
      expect(result.taxAmount).toBe(20);
      expect(result.taxRate).toBe(25);
    });
  });

  describe("resolveTaxValues - Gross Amount Handling", () => {
    test("should always use gross calculation (all transactions are gross)", () => {
      // All transactions are gross (tax-inclusive) amounts
      const result = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: null,
        transactionTaxRate: 25,
        transactionTaxType: "vat",
        categoryTaxRate: null,
        categoryTaxType: null,
      });

      // Gross calculation: 100 × (25/125) = 20
      expect(result.taxAmount).toBe(20);
    });
  });

  describe("calculateTaxRateFromGross", () => {
    test("should calculate rate from gross amount correctly", () => {
      // Example: Gross 100, Tax 20 → Rate should be 25% (not 20%)
      expect(calculateTaxRateFromGross(100, 20)).toBe(25);
      // Verification: 100 × (25/125) = 20 ✓
    });

    test("should calculate rate for common VAT scenarios", () => {
      // Gross 100, Tax 16.67 → Rate should be 20%
      expect(calculateTaxRateFromGross(100, 16.67)).toBeCloseTo(20, 1);
      // Gross 100, Tax 15.97 → Rate should be 19% (may have rounding differences)
      expect(calculateTaxRateFromGross(100, 15.97)).toBeCloseTo(19, 1);
      // Gross 100, Tax 20 → Rate should be 25%
      expect(calculateTaxRateFromGross(100, 20)).toBe(25);
    });

    test("should handle the bug report example", () => {
      // €33.84 gross, €6.33 tax → Rate should be 23% (may have rounding differences)
      expect(calculateTaxRateFromGross(33.84, 6.33)).toBeCloseTo(23, 1);
      // Verification: 33.84 × (23/123) = 6.33 ✓
    });

    test("should work with negative amounts (expenses)", () => {
      // Negative gross amounts should still calculate correctly
      expect(calculateTaxRateFromGross(-100, 20)).toBe(25);
      expect(calculateTaxRateFromGross(-33.84, 6.33)).toBeCloseTo(23, 1);
    });

    test("should handle decimal tax amounts", () => {
      // Gross 100, Tax 7.83 → Rate should be 8.5%
      expect(calculateTaxRateFromGross(100, 7.83)).toBe(8.5);
      // Gross 200, Tax 22.22 → Rate should be 12.5%
      expect(calculateTaxRateFromGross(200, 22.22)).toBe(12.5);
    });

    test("should round to 2 decimal places", () => {
      // Gross 100, Tax 15.96 → Rate should round to approximately 19%
      // Note: Due to rounding in tax calculation, may vary slightly
      expect(calculateTaxRateFromGross(100, 15.96)).toBeCloseTo(19, 1);
    });

    test("should handle zero tax amount", () => {
      expect(calculateTaxRateFromGross(100, 0)).toBe(0);
      expect(calculateTaxRateFromGross(-100, 0)).toBe(0);
    });

    test("should handle zero gross amount", () => {
      expect(calculateTaxRateFromGross(0, 20)).toBe(0);
    });

    test("should handle edge case where tax equals gross", () => {
      // If tax equals gross, net would be 0, so return 0
      expect(calculateTaxRateFromGross(100, 100)).toBe(0);
    });

    test("should verify round-trip calculation", () => {
      // Calculate tax from rate, then rate from tax - should match original rate
      const originalRate = 25;
      const grossAmount = 100;
      const taxAmount = calculateTaxAmountFromGross(grossAmount, originalRate);
      const calculatedRate = calculateTaxRateFromGross(grossAmount, taxAmount);
      expect(calculatedRate).toBe(originalRate);
    });

    test("should verify round-trip with different rates", () => {
      const rates = [19, 20, 23, 25, 8.5, 12.5];
      const grossAmount = 100;

      for (const rate of rates) {
        const taxAmount = calculateTaxAmountFromGross(grossAmount, rate);
        const calculatedRate = calculateTaxRateFromGross(
          grossAmount,
          taxAmount,
        );
        // Allow small rounding differences (within 0.1%)
        expect(calculatedRate).toBeCloseTo(rate, 1);
      }
    });

    test("should verify round-trip with different amounts", () => {
      const amounts = [33.84, 50, 100, 200, 500, 1000];
      const rate = 23;

      for (const amount of amounts) {
        const taxAmount = calculateTaxAmountFromGross(amount, rate);
        const calculatedRate = calculateTaxRateFromGross(amount, taxAmount);
        // Allow small rounding differences (within 0.1%)
        expect(calculatedRate).toBeCloseTo(rate, 1);
      }
    });
  });
});
