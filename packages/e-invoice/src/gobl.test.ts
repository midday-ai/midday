import { describe, expect, test } from "bun:test";
import {
  invoiceKey,
  type MiddayCustomer,
  type MiddayInvoiceData,
  type MiddayLineItem,
  type MiddayTeam,
  parseInvoiceKey,
  toGOBL,
  validateEInvoiceRequirements,
} from "./gobl";

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createTeam(overrides?: Partial<MiddayTeam>): MiddayTeam {
  return {
    name: "Acme Corp",
    email: "billing@acme.com",
    countryCode: "SE",
    addressLine1: "Kungsgatan 1",
    addressLine2: null,
    city: "Stockholm",
    state: null,
    zip: "111 22",
    vatNumber: "SE556123456701",
    taxId: null,
    peppolId: null,
    ...overrides,
  };
}

function createCustomer(overrides?: Partial<MiddayCustomer>): MiddayCustomer {
  return {
    name: "Customer AB",
    email: "accounts@customer.se",
    countryCode: "SE",
    addressLine1: "Drottninggatan 10",
    addressLine2: null,
    city: "Gothenburg",
    state: null,
    zip: "411 03",
    vatNumber: "SE559876543201",
    peppolId: "0208:0316597904",
    ...overrides,
  };
}

function createLineItem(overrides?: Partial<MiddayLineItem>): MiddayLineItem {
  return {
    name: "Consulting",
    quantity: 10,
    price: 150,
    taxRate: 25,
    ...overrides,
  };
}

function createInvoiceData(
  overrides?: Partial<MiddayInvoiceData>,
): MiddayInvoiceData {
  return {
    id: "inv-001",
    invoiceNumber: "INV-2025-001",
    issueDate: "2025-03-15T00:00:00.000Z",
    dueDate: "2025-04-15T00:00:00.000Z",
    currency: "SEK",
    lineItems: [createLineItem()],
    team: createTeam(),
    customer: createCustomer(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateEInvoiceRequirements
// ---------------------------------------------------------------------------

describe("validateEInvoiceRequirements", () => {
  test("returns empty array when all required fields are present", () => {
    const issues = validateEInvoiceRequirements(createInvoiceData());
    expect(issues).toEqual([]);
  });

  test("returns issue for missing company name", () => {
    const data = createInvoiceData({ team: createTeam({ name: null }) });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "company.name")).toBe(true);
  });

  test("returns issue for missing company country", () => {
    const data = createInvoiceData({
      team: createTeam({ countryCode: null }),
    });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "company.countryCode")).toBe(true);
  });

  test("returns issue for missing company address", () => {
    const data = createInvoiceData({
      team: createTeam({ addressLine1: null }),
    });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "company.address")).toBe(true);
  });

  test("returns issue for missing company city", () => {
    const data = createInvoiceData({ team: createTeam({ city: null }) });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "company.city")).toBe(true);
  });

  test("returns issue for missing company zip", () => {
    const data = createInvoiceData({ team: createTeam({ zip: null }) });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "company.zip")).toBe(true);
  });

  test("returns issue for missing company VAT number", () => {
    const data = createInvoiceData({
      team: createTeam({ vatNumber: null }),
    });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "company.vatNumber")).toBe(true);
  });

  test("returns issue for missing company email", () => {
    const data = createInvoiceData({ team: createTeam({ email: null }) });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "company.email")).toBe(true);
  });

  test("returns issue for missing customer name", () => {
    const data = createInvoiceData({
      customer: createCustomer({ name: "" as unknown as string }),
    });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "customer.name")).toBe(true);
  });

  test("returns issue for missing customer email", () => {
    const data = createInvoiceData({
      customer: createCustomer({ email: "" as unknown as string }),
    });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "customer.email")).toBe(true);
  });

  test("returns issue for missing customer address", () => {
    const data = createInvoiceData({
      customer: createCustomer({ addressLine1: null }),
    });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "customer.address")).toBe(true);
  });

  test("returns issue for missing customer country", () => {
    const data = createInvoiceData({
      customer: createCustomer({ countryCode: null }),
    });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "customer.countryCode")).toBe(true);
  });

  test("returns issue for missing customer Peppol ID", () => {
    const data = createInvoiceData({
      customer: createCustomer({ peppolId: null }),
    });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "customer.peppolId")).toBe(true);
  });

  test("returns no peppolId issue when customer has a Peppol ID", () => {
    const data = createInvoiceData({
      customer: createCustomer({ peppolId: "0208:0316597904" }),
    });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "customer.peppolId")).toBe(false);
  });

  test("returns issue for empty line items", () => {
    const data = createInvoiceData({ lineItems: [] });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.some((i) => i.field === "lineItems")).toBe(true);
  });

  test("accumulates multiple issues", () => {
    const data = createInvoiceData({
      team: createTeam({ name: null, vatNumber: null }),
      lineItems: [],
    });
    const issues = validateEInvoiceRequirements(data);
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// toGOBL
// ---------------------------------------------------------------------------

describe("toGOBL", () => {
  test("sets $schema, type, and currency", () => {
    const result = toGOBL(createInvoiceData());
    expect(result.$schema).toBe("https://gobl.org/draft-0/bill/invoice");
    expect(result.type).toBe("standard");
    expect(result.currency).toBe("SEK");
  });

  test("defaults currency to USD when null", () => {
    const result = toGOBL(createInvoiceData({ currency: null }));
    expect(result.currency).toBe("USD");
  });

  test("sets $regime from supplier country code", () => {
    const result = toGOBL(createInvoiceData());
    expect(result.$regime).toBe("SE");
  });

  test("adds eu-en16931-v2017 addon when supplierRegistration is present", () => {
    const data = createInvoiceData({
      supplierRegistration: {
        peppolId: "0007:5567321234",
        peppolScheme: "0007",
      },
    });
    const result = toGOBL(data);
    expect(result.$addons).toEqual(["eu-en16931-v2017"]);
  });

  test("does NOT add addon when supplierRegistration is absent", () => {
    const result = toGOBL(createInvoiceData());
    expect(result.$addons).toBeUndefined();
  });

  test("builds supplier party with tax_id, address, email", () => {
    const result = toGOBL(createInvoiceData());
    expect(result.supplier.name).toBe("Acme Corp");
    expect(result.supplier.tax_id).toEqual({
      country: "SE",
      code: "SE556123456701",
    });
    expect(result.supplier.addresses?.[0]?.street).toBe("Kungsgatan 1");
    expect(result.supplier.emails?.[0]?.addr).toBe("billing@acme.com");
  });

  test("builds supplier Peppol inbox from registration", () => {
    const data = createInvoiceData({
      supplierRegistration: {
        peppolId: "0007:5567321234",
        peppolScheme: "0007",
      },
    });
    const result = toGOBL(data);
    expect(result.supplier.inboxes).toEqual([
      { key: "peppol", scheme: "0007", code: "0007:5567321234" },
    ]);
  });

  test("builds customer party", () => {
    const result = toGOBL(createInvoiceData());
    expect(result.customer?.name).toBe("Customer AB");
    expect(result.customer?.tax_id?.country).toBe("SE");
  });

  test("maps line items with quantity, price, and tax", () => {
    const result = toGOBL(createInvoiceData());
    expect(result.lines).toHaveLength(1);

    const line = result.lines[0]!;
    expect(line.i).toBe(1);
    expect(line.quantity).toBe("10");
    expect(line.item.name).toBe("Consulting");
    expect(line.item.price).toBe("150");
    expect(line.taxes?.[0]).toEqual({
      cat: "VAT",
      percent: "25%",
    });
  });

  test("sets issue_date in YYYY-MM-DD format", () => {
    const result = toGOBL(createInvoiceData());
    expect(result.issue_date).toBe("2025-03-15");
  });

  test("sets payment terms with due date", () => {
    const result = toGOBL(createInvoiceData());
    expect(result.payment?.terms?.key).toBe("due-date");
    expect(result.payment?.terms?.due_dates).toEqual([
      { date: "2025-04-15", percent: "100%" },
    ]);
  });

  test("sets code from invoice number", () => {
    const result = toGOBL(createInvoiceData());
    expect(result.code).toBe("INV-2025-001");
  });

  test("omits code when invoiceNumber is null", () => {
    const result = toGOBL(createInvoiceData({ invoiceNumber: null }));
    expect(result.code).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// invoiceKey / parseInvoiceKey
// ---------------------------------------------------------------------------

describe("invoiceKey", () => {
  test("generates correct key format", () => {
    expect(invoiceKey("abc-123")).toBe("midday-invoice-abc-123");
  });
});

describe("parseInvoiceKey", () => {
  test("parses valid key back to invoice ID", () => {
    expect(parseInvoiceKey("midday-invoice-abc-123")).toBe("abc-123");
  });

  test("returns null for non-matching key", () => {
    expect(parseInvoiceKey("midday-party-abc-123")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parseInvoiceKey("")).toBeNull();
  });
});
