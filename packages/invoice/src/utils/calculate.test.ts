import { describe, expect, it } from "bun:test";
import { calculateLineItemTotal, calculateTotal } from "./calculate";

describe("calculateTotal", () => {
  const sampleLineItems = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ];

  it("should calculate subtotal correctly", () => {
    const result = calculateTotal({ lineItems: sampleLineItems });
    expect(result.subTotal).toBe(250); // (100 * 2) + (50 * 1)
  });

  it("should calculate VAT correctly when included", () => {
    const result = calculateTotal({
      lineItems: sampleLineItems,
      includeVat: true,
      vatRate: 10,
    });
    expect(result.vat).toBe(25); // 250 * 0.1
  });

  it("should not include VAT when disabled", () => {
    const result = calculateTotal({
      lineItems: sampleLineItems,
      includeVat: false,
      vatRate: 10,
    });
    expect(result.vat).toBe(0);
  });

  it("should apply discount correctly", () => {
    const result = calculateTotal({
      lineItems: sampleLineItems,
      discount: 20,
      includeVat: true,
      vatRate: 10,
    });
    expect(result.total).toBe(255); // (250 + 25 - 20)
  });

  it("should calculate tax correctly when included", () => {
    const result = calculateTotal({
      lineItems: sampleLineItems,
      taxRate: 15,
      includeTax: true,
      includeVat: true,
      vatRate: 10,
    });
    expect(result.tax).toBe(41.25); // (250 + 25) * 0.15
  });

  it("should handle empty line items", () => {
    const result = calculateTotal({ lineItems: [] });
    expect(result.subTotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.vat).toBe(0);
    expect(result.tax).toBe(0);
  });
});

describe("calculateLineItemTotal", () => {
  it("should calculate total price correctly", () => {
    const result = calculateLineItemTotal({
      price: 100,
      quantity: 2,
    });
    expect(result).toBe(200);
  });

  it("should handle zero values", () => {
    const result = calculateLineItemTotal({});
    expect(result).toBe(0);
  });

  it("should handle undefined values", () => {
    const result = calculateLineItemTotal({
      price: undefined,
      quantity: undefined,
    });
    expect(result).toBe(0);
  });
});
