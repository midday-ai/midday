import { describe, expect, test } from "bun:test";
import { calculateTaxAmount, resolveTaxValues } from "./tax";

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

      expect(result.taxAmount).toBe(25);
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

      expect(result.taxAmount).toBe(25);
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

      expect(result.taxAmount).toBe(20);
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
      // User had 25% tax on $100 = $25
      const beforeSwitch = resolveTaxValues({
        transactionAmount: 100,
        transactionTaxAmount: null,
        transactionTaxRate: 25,
        transactionTaxType: "vat",
        categoryTaxRate: null,
        categoryTaxType: null,
      });
      expect(beforeSwitch.taxAmount).toBe(25);
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
      expect(afterSwitch.taxAmount).toBe(20);
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

      expect(result.taxAmount).toBe(30);
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

      expect(result.taxAmount).toBe(190);
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

      expect(result.taxAmount).toBe(44.38);
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

      expect(result.taxAmount).toBe(500);
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

      expect(resultWithUndefined.taxAmount).toBe(25);
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

      expect(result.taxAmount).toBe(25);
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

      expect(result.taxAmount).toBe(150);
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

      expect(result.taxAmount).toBe(25);
      expect(result.taxRate).toBe(25);
    });
  });
});
