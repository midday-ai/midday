import { describe, expect, test } from "bun:test";
import { parseIncomingGOBL } from "./incoming";
import type { InvopopSiloEntry } from "./types";

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createSiloEntry(
  overrides?: Partial<InvopopSiloEntry>,
): InvopopSiloEntry {
  return {
    id: "entry-001",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function createGOBLInvoiceData(overrides?: Record<string, unknown>) {
  return {
    $schema: "https://gobl.org/draft-0/bill/invoice",
    type: "standard",
    currency: "SEK",
    code: "INV-2025-042",
    issue_date: "2025-03-15",
    supplier: {
      name: "Supplier AB",
      tax_id: { country: "SE", code: "SE556111222301" },
      emails: [{ addr: "billing@supplier.se" }],
      inboxes: [{ key: "peppol", scheme: "0007", code: "5561112223" }],
    },
    customer: {
      name: "Buyer Corp",
      tax_id: { country: "SE", code: "SE559988776601" },
      inboxes: [{ key: "peppol", scheme: "0208", code: "0316597904" }],
    },
    lines: [
      { i: 1, quantity: "10", item: { name: "Consulting", price: "150" } },
      { i: 2, quantity: "5", item: { name: "Development", price: "200" } },
    ],
    totals: {
      payable: "2500.00",
      total: "2000.00",
      total_with_tax: "2500.00",
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// parseIncomingGOBL
// ---------------------------------------------------------------------------

describe("parseIncomingGOBL", () => {
  test("parses a complete GOBL invoice", () => {
    const entry = createSiloEntry({
      data: createGOBLInvoiceData(),
    });

    const result = parseIncomingGOBL(entry);

    expect(result).not.toBeNull();
    expect(result!.supplierName).toBe("Supplier AB");
    expect(result!.supplierEmail).toBe("billing@supplier.se");
    expect(result!.supplierVat).toBe("SE556111222301");
    expect(result!.supplierCountry).toBe("SE");
    expect(result!.supplierPeppolId).toBe("0007:5561112223");
    expect(result!.customerPeppolId).toBe("0208:0316597904");
    expect(result!.invoiceNumber).toBe("INV-2025-042");
    expect(result!.currency).toBe("SEK");
    expect(result!.amount).toBe(2500);
    expect(result!.date).toBe("2025-03-15");
    expect(result!.description).toBe("Consulting, Development");
  });

  test("returns null when entry has no data", () => {
    const entry = createSiloEntry({ data: undefined });
    expect(parseIncomingGOBL(entry)).toBeNull();
  });

  test("returns null when data is not a bill/invoice", () => {
    const entry = createSiloEntry({
      data: {
        $schema: "https://gobl.org/draft-0/org/party",
        name: "Some Party",
      },
    });
    expect(parseIncomingGOBL(entry)).toBeNull();
  });

  test("returns null when $schema is missing", () => {
    const entry = createSiloEntry({
      data: { currency: "EUR", code: "INV-1" },
    });
    expect(parseIncomingGOBL(entry)).toBeNull();
  });

  test("handles missing supplier gracefully", () => {
    const entry = createSiloEntry({
      data: createGOBLInvoiceData({
        supplier: undefined,
      }),
    });

    const result = parseIncomingGOBL(entry);
    expect(result).not.toBeNull();
    expect(result!.supplierName).toBe("Unknown Supplier");
    expect(result!.supplierEmail).toBeNull();
    expect(result!.supplierVat).toBeNull();
    expect(result!.supplierPeppolId).toBeNull();
  });

  test("handles missing customer gracefully", () => {
    const entry = createSiloEntry({
      data: createGOBLInvoiceData({
        customer: undefined,
      }),
    });

    const result = parseIncomingGOBL(entry);
    expect(result).not.toBeNull();
    expect(result!.customerPeppolId).toBeNull();
  });

  test("handles Peppol ID without scheme", () => {
    const entry = createSiloEntry({
      data: createGOBLInvoiceData({
        customer: {
          name: "Buyer",
          inboxes: [{ key: "peppol", code: "123456789" }],
        },
      }),
    });

    const result = parseIncomingGOBL(entry);
    expect(result!.customerPeppolId).toBe("123456789");
  });

  test("handles missing totals", () => {
    const entry = createSiloEntry({
      data: createGOBLInvoiceData({ totals: undefined }),
    });

    const result = parseIncomingGOBL(entry);
    expect(result!.amount).toBeNull();
  });

  test("falls back to total_with_tax when payable is missing", () => {
    const entry = createSiloEntry({
      data: createGOBLInvoiceData({
        totals: { total_with_tax: "1800.50" },
      }),
    });

    const result = parseIncomingGOBL(entry);
    expect(result!.amount).toBe(1800.5);
  });

  test("falls back to total when payable and total_with_tax are missing", () => {
    const entry = createSiloEntry({
      data: createGOBLInvoiceData({
        totals: { total: "1500.00" },
      }),
    });

    const result = parseIncomingGOBL(entry);
    expect(result!.amount).toBe(1500);
  });

  test("handles empty line items", () => {
    const entry = createSiloEntry({
      data: createGOBLInvoiceData({ lines: [] }),
    });

    const result = parseIncomingGOBL(entry);
    expect(result!.description).toBeNull();
  });

  test("truncates description when more than 5 line items", () => {
    const lines = Array.from({ length: 7 }, (_, i) => ({
      i: i + 1,
      quantity: "1",
      item: { name: `Item ${i + 1}`, price: "100" },
    }));

    const entry = createSiloEntry({
      data: createGOBLInvoiceData({ lines }),
    });

    const result = parseIncomingGOBL(entry);
    expect(result!.description).toBe(
      "Item 1, Item 2, Item 3, Item 4, Item 5, +2 more",
    );
  });

  test("handles non-numeric amount values", () => {
    const entry = createSiloEntry({
      data: createGOBLInvoiceData({
        totals: { payable: "not-a-number" },
      }),
    });

    const result = parseIncomingGOBL(entry);
    expect(result!.amount).toBeNull();
  });

  test("handles missing optional fields", () => {
    const entry = createSiloEntry({
      data: createGOBLInvoiceData({
        code: undefined,
        issue_date: undefined,
        supplier: { name: "Minimal Supplier" },
        customer: { name: "Minimal Customer" },
        lines: undefined,
      }),
    });

    const result = parseIncomingGOBL(entry);
    expect(result).not.toBeNull();
    expect(result!.invoiceNumber).toBeNull();
    expect(result!.date).toBeNull();
    expect(result!.supplierEmail).toBeNull();
    expect(result!.supplierVat).toBeNull();
    expect(result!.supplierPeppolId).toBeNull();
    expect(result!.customerPeppolId).toBeNull();
    expect(result!.description).toBeNull();
  });
});
