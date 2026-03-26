import { describe, expect, test } from "bun:test";
import { calculateLineItemTotal, calculateTotal } from "./calculate";

describe("calculateTotal", () => {
  test("computes subtotal from line items", () => {
    const result = calculateTotal({
      lineItems: [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 3 },
      ],
    });
    expect(result.subTotal).toBe(350);
  });

  test("returns zero for empty line items", () => {
    const result = calculateTotal({ lineItems: [] });
    expect(result.subTotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.vat).toBe(0);
    expect(result.tax).toBe(0);
  });

  test("handles null-ish lineItems array", () => {
    const result = calculateTotal({
      lineItems: null as unknown as Array<{
        price?: number;
        quantity?: number;
      }>,
    });
    expect(result.subTotal).toBe(0);
    expect(result.total).toBe(0);
  });

  test("treats missing price/quantity as zero", () => {
    const result = calculateTotal({
      lineItems: [{ price: undefined, quantity: 5 }, { price: 100 }, {}],
    });
    expect(result.subTotal).toBe(0);
  });

  test("applies VAT when includeVat is true", () => {
    const result = calculateTotal({
      lineItems: [{ price: 1000, quantity: 1 }],
      vatRate: 25,
      includeVat: true,
    });
    expect(result.vat).toBe(250);
    expect(result.total).toBe(1250);
  });

  test("excludes VAT when includeVat is false", () => {
    const result = calculateTotal({
      lineItems: [{ price: 1000, quantity: 1 }],
      vatRate: 25,
      includeVat: false,
    });
    expect(result.vat).toBe(0);
    expect(result.total).toBe(1000);
  });

  test("applies global tax when includeTax is true", () => {
    const result = calculateTotal({
      lineItems: [{ price: 1000, quantity: 1 }],
      taxRate: 10,
      includeTax: true,
      includeVat: false,
    });
    expect(result.tax).toBe(100);
    expect(result.total).toBe(1100);
  });

  test("excludes global tax when includeTax is false", () => {
    const result = calculateTotal({
      lineItems: [{ price: 1000, quantity: 1 }],
      taxRate: 10,
      includeTax: false,
      includeVat: false,
    });
    expect(result.tax).toBe(0);
    expect(result.total).toBe(1000);
  });

  test("uses per-line-item tax when includeLineItemTax is true", () => {
    const result = calculateTotal({
      lineItems: [
        { price: 1000, quantity: 1, taxRate: 10 },
        { price: 500, quantity: 2, taxRate: 20 },
      ],
      taxRate: 99,
      includeLineItemTax: true,
      includeVat: false,
    });
    // 1000*10% = 100, 1000*20% = 200
    expect(result.tax).toBe(300);
    expect(result.subTotal).toBe(2000);
    expect(result.total).toBe(2300);
  });

  test("line-item tax takes precedence over global tax", () => {
    const result = calculateTotal({
      lineItems: [{ price: 100, quantity: 1, taxRate: 5 }],
      taxRate: 50,
      includeTax: true,
      includeLineItemTax: true,
      includeVat: false,
    });
    expect(result.tax).toBe(5);
  });

  test("applies discount", () => {
    const result = calculateTotal({
      lineItems: [{ price: 1000, quantity: 1 }],
      discount: 200,
      includeVat: false,
    });
    expect(result.total).toBe(800);
  });

  test("combines VAT, tax, and discount", () => {
    const result = calculateTotal({
      lineItems: [{ price: 1000, quantity: 1 }],
      vatRate: 25,
      taxRate: 10,
      discount: 50,
      includeVat: true,
      includeTax: true,
    });
    // subTotal=1000, vat=250, tax=100, discount=50
    expect(result.subTotal).toBe(1000);
    expect(result.vat).toBe(250);
    expect(result.tax).toBe(100);
    expect(result.total).toBe(1300);
  });
});

describe("calculateLineItemTotal", () => {
  test("multiplies price by quantity", () => {
    expect(calculateLineItemTotal({ price: 100, quantity: 3 })).toBe(300);
  });

  test("defaults missing price to zero", () => {
    expect(calculateLineItemTotal({ quantity: 5 })).toBe(0);
  });

  test("defaults missing quantity to zero", () => {
    expect(calculateLineItemTotal({ price: 100 })).toBe(0);
  });

  test("defaults both to zero", () => {
    expect(calculateLineItemTotal({})).toBe(0);
  });
});
