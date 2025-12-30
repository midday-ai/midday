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
    expect(result.tax).toBe(37.5); // 250 * 0.15 (tax calculated on subtotal, not total)
    expect(result.total).toBe(312.5); // 250 + 25 + 37.5
  });

  it("should handle empty line items", () => {
    const result = calculateTotal({ lineItems: [] });
    expect(result.subTotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.vat).toBe(0);
    expect(result.tax).toBe(0);
  });
});

describe("calculateTotal with line item tax", () => {
  const lineItemsWithTax = [
    { price: 100, quantity: 2, taxRate: 10 }, // $200, tax: $20
    { price: 50, quantity: 1, taxRate: 25 }, // $50, tax: $12.50
  ];

  it("should calculate tax per line item and sum them", () => {
    const result = calculateTotal({
      lineItems: lineItemsWithTax,
      includeLineItemTax: true,
    });
    expect(result.subTotal).toBe(250);
    expect(result.tax).toBe(32.5); // $20 + $12.50
    expect(result.total).toBe(282.5); // $250 + $32.50
  });

  it("should handle mixed tax rates correctly", () => {
    const mixedItems = [
      { price: 100, quantity: 1, taxRate: 5 }, // $100, tax: $5
      { price: 200, quantity: 1, taxRate: 10 }, // $200, tax: $20
      { price: 50, quantity: 2, taxRate: 20 }, // $100, tax: $20
    ];
    const result = calculateTotal({
      lineItems: mixedItems,
      includeLineItemTax: true,
    });
    expect(result.subTotal).toBe(400);
    expect(result.tax).toBe(45); // $5 + $20 + $20
    expect(result.total).toBe(445);
  });

  it("should handle line items with zero tax rate", () => {
    const itemsWithZeroTax = [
      { price: 100, quantity: 1, taxRate: 10 }, // $100, tax: $10
      { price: 100, quantity: 1, taxRate: 0 }, // $100, tax: $0
    ];
    const result = calculateTotal({
      lineItems: itemsWithZeroTax,
      includeLineItemTax: true,
    });
    expect(result.tax).toBe(10);
    expect(result.total).toBe(210);
  });

  it("should combine line item tax with VAT", () => {
    const result = calculateTotal({
      lineItems: lineItemsWithTax,
      includeLineItemTax: true,
      includeVat: true,
      vatRate: 10,
    });
    expect(result.subTotal).toBe(250);
    expect(result.tax).toBe(32.5);
    expect(result.vat).toBe(25); // 250 * 0.10
    expect(result.total).toBe(307.5); // 250 + 32.5 + 25
  });

  it("should apply discount with line item tax", () => {
    const result = calculateTotal({
      lineItems: lineItemsWithTax,
      includeLineItemTax: true,
      discount: 50,
    });
    expect(result.subTotal).toBe(250);
    expect(result.tax).toBe(32.5);
    expect(result.total).toBe(232.5); // 250 + 32.5 - 50
  });

  it("should use invoice-level tax when includeLineItemTax is false", () => {
    const result = calculateTotal({
      lineItems: lineItemsWithTax,
      includeLineItemTax: false,
      includeTax: true,
      taxRate: 15,
    });
    // Should ignore line item taxRate and use invoice-level taxRate
    expect(result.tax).toBe(37.5); // 250 * 0.15
    expect(result.total).toBe(287.5); // 250 + 37.5
  });

  it("should handle undefined/missing taxRate on line items", () => {
    const itemsWithMissingTax = [
      { price: 100, quantity: 1, taxRate: 10 }, // $100, tax: $10
      { price: 100, quantity: 1 }, // $100, tax: $0 (no taxRate)
      { price: 100, quantity: 1, taxRate: undefined }, // $100, tax: $0
    ];
    const result = calculateTotal({
      lineItems: itemsWithMissingTax,
      includeLineItemTax: true,
    });
    expect(result.tax).toBe(10); // Only first item has tax
    expect(result.total).toBe(310);
  });

  it("should handle empty line items with includeLineItemTax", () => {
    const result = calculateTotal({
      lineItems: [],
      includeLineItemTax: true,
    });
    expect(result.subTotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });

  it("should handle decimal precision correctly", () => {
    // 33.33% of $100 = $33.33
    const items = [{ price: 100, quantity: 1, taxRate: 33.33 }];
    const result = calculateTotal({
      lineItems: items,
      includeLineItemTax: true,
    });
    expect(result.tax).toBeCloseTo(33.33, 2);
    expect(result.total).toBeCloseTo(133.33, 2);
  });

  it("should handle very small tax rates", () => {
    const items = [
      { price: 1000, quantity: 1, taxRate: 0.5 }, // $1000, tax: $5
      { price: 1000, quantity: 1, taxRate: 0.125 }, // $1000, tax: $1.25
    ];
    const result = calculateTotal({
      lineItems: items,
      includeLineItemTax: true,
    });
    expect(result.tax).toBe(6.25);
    expect(result.total).toBe(2006.25);
  });

  it("should handle zero price items with tax rate", () => {
    const items = [
      { price: 0, quantity: 5, taxRate: 10 }, // $0, tax: $0
      { price: 100, quantity: 1, taxRate: 10 }, // $100, tax: $10
    ];
    const result = calculateTotal({
      lineItems: items,
      includeLineItemTax: true,
    });
    expect(result.subTotal).toBe(100);
    expect(result.tax).toBe(10);
    expect(result.total).toBe(110);
  });

  it("should handle zero quantity items with tax rate", () => {
    const items = [
      { price: 100, quantity: 0, taxRate: 10 }, // $0, tax: $0
      { price: 100, quantity: 1, taxRate: 10 }, // $100, tax: $10
    ];
    const result = calculateTotal({
      lineItems: items,
      includeLineItemTax: true,
    });
    expect(result.subTotal).toBe(100);
    expect(result.tax).toBe(10);
    expect(result.total).toBe(110);
  });

  it("should handle large numbers correctly", () => {
    const items = [{ price: 999999.99, quantity: 100, taxRate: 25 }];
    const result = calculateTotal({
      lineItems: items,
      includeLineItemTax: true,
    });
    expect(result.subTotal).toBe(99999999);
    expect(result.tax).toBe(24999999.75); // 99999999 * 0.25
    expect(result.total).toBe(124999998.75);
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
