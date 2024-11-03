import { describe, expect, it, test } from "bun:test";
import { generateInvoiceNumber } from "./number";

describe("Generate invoice number", () => {
  it("should generate correct invoice number for count less than 10", () => {
    expect(generateInvoiceNumber(0)).toBe("INV-001");
    expect(generateInvoiceNumber(5)).toBe("INV-006");
    expect(generateInvoiceNumber(9)).toBe("INV-010");
  });

  it("should generate correct invoice number for count between 10 and 99", () => {
    expect(generateInvoiceNumber(10)).toBe("INV-011");
    expect(generateInvoiceNumber(50)).toBe("INV-051");
    expect(generateInvoiceNumber(99)).toBe("INV-100");
  });

  it("should generate correct invoice number for count 100 and above", () => {
    expect(generateInvoiceNumber(100)).toBe("INV-101");
    expect(generateInvoiceNumber(500)).toBe("INV-501");
    expect(generateInvoiceNumber(999)).toBe("INV-1000");
  });

  it("should handle large numbers correctly", () => {
    expect(generateInvoiceNumber(9999)).toBe("INV-10000");
    expect(generateInvoiceNumber(99999)).toBe("INV-100000");
  });
});
