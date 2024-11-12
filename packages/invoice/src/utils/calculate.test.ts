import { describe, expect, it } from "bun:test";
import { calculateLineItemTotal, calculateTotal } from "./calculate";

describe("calculateTotal", () => {
  const sampleLineItems = [
    { price: 100, quantity: 2, vat: 10 },
    { price: 50, quantity: 1, vat: 5 },
  ];

  it("should calculate subtotal correctly", () => {
    const result = calculateTotal({ lineItems: sampleLineItems });
    expect(result.subTotal).toBe(250); // (100 * 2) + (50 * 1)
  });

  it("should calculate VAT correctly when included", () => {
    const result = calculateTotal({
      lineItems: sampleLineItems,
      includeVAT: true,
    });
    expect(result.vat).toBe(22.5); // (200 * 0.1) + (50 * 0.05)
  });

  it("should not include VAT when disabled", () => {
    const result = calculateTotal({
      lineItems: sampleLineItems,
      includeVAT: false,
    });
    expect(result.vat).toBe(0);
  });

  it("should apply discount correctly", () => {
    const result = calculateTotal({
      lineItems: sampleLineItems,
      discount: 20,
      includeVAT: true,
    });
    expect(result.total).toBe(252.5); // (250 + 22.5 - 20)
  });

  it("should calculate tax correctly when included", () => {
    const result = calculateTotal({
      lineItems: sampleLineItems,
      taxRate: 15,
      includeTax: true,
    });
    expect(result.tax).toBe(40.875); // (250 + 22.5) * 0.15
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
  it("should calculate base price correctly", () => {
    const result = calculateLineItemTotal({
      price: 100,
      quantity: 2,
      includeVAT: false,
    });
    expect(result).toBe(200);
  });

  it("should include VAT when enabled", () => {
    const result = calculateLineItemTotal({
      price: 100,
      quantity: 2,
      vat: 10,
      includeVAT: true,
    });
    expect(result).toBe(220); // 200 + (200 * 0.1)
  });

  it("should not include VAT when disabled", () => {
    const result = calculateLineItemTotal({
      price: 100,
      quantity: 2,
      vat: 10,
      includeVAT: false,
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
      vat: undefined,
    });
    expect(result).toBe(0);
  });
});
