import { describe, expect, it } from "bun:test";
import {
  PEPPOL_SCHEMES,
  canSendEInvoice,
  transformToDDDInvoice,
  validateForPeppol,
  validatePeppolId,
} from "./transform";
import type { MiddayInvoiceData } from "./types";

describe("validatePeppolId", () => {
  describe("valid Peppol IDs", () => {
    it("should validate Norwegian organization number (0192)", () => {
      const result = validatePeppolId("0192:123456789");
      expect(result.valid).toBe(true);
      expect(result.scheme).toBe("0192");
      expect(result.identifier).toBe("123456789");
    });

    it("should validate Swedish organization number (0007)", () => {
      const result = validatePeppolId("0007:1234567890");
      expect(result.valid).toBe(true);
      expect(result.scheme).toBe("0007");
      expect(result.identifier).toBe("1234567890");
    });

    it("should validate GLN (0088)", () => {
      const result = validatePeppolId("0088:1234567890123");
      expect(result.valid).toBe(true);
      expect(result.scheme).toBe("0088");
      expect(result.identifier).toBe("1234567890123");
    });

    it("should validate DUNS number (0060)", () => {
      const result = validatePeppolId("0060:123456789");
      expect(result.valid).toBe(true);
      expect(result.scheme).toBe("0060");
      expect(result.identifier).toBe("123456789");
    });

    it("should validate German VAT number (9930)", () => {
      const result = validatePeppolId("9930:DE123456789");
      expect(result.valid).toBe(true);
      expect(result.scheme).toBe("9930");
      expect(result.identifier).toBe("DE123456789");
    });

    it("should validate Australian Business Number (0151)", () => {
      const result = validatePeppolId("0151:12345678901");
      expect(result.valid).toBe(true);
      expect(result.scheme).toBe("0151");
      expect(result.identifier).toBe("12345678901");
    });

    it("should accept unknown but valid format scheme with warning", () => {
      const result = validatePeppolId("9999:123456789");
      expect(result.valid).toBe(true);
      expect(result.scheme).toBe("9999");
      expect(result.error).toContain("Warning");
    });
  });

  describe("invalid Peppol IDs", () => {
    it("should reject empty string", () => {
      const result = validatePeppolId("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("required");
    });

    it("should reject missing colon separator", () => {
      const result = validatePeppolId("0192123456789");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must be {scheme}:{identifier}");
    });

    it("should reject non-4-digit scheme", () => {
      const result = validatePeppolId("192:123456789");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("4-digit code");
    });

    it("should reject scheme with letters", () => {
      const result = validatePeppolId("019A:123456789");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("4-digit code");
    });

    it("should reject empty identifier", () => {
      const result = validatePeppolId("0192:");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("cannot be empty");
    });

    it("should reject special characters in identifier", () => {
      const result = validatePeppolId("0192:123-456-789");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("alphanumeric");
    });

    it("should reject GLN with wrong length", () => {
      const result = validatePeppolId("0088:12345");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("13 digits");
    });

    it("should reject DUNS with wrong length", () => {
      const result = validatePeppolId("0060:12345");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("9 digits");
    });

    it("should reject Norwegian org number with wrong length", () => {
      const result = validatePeppolId("0192:12345");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("9 digits");
    });

    it("should reject Swedish org number with wrong length", () => {
      const result = validatePeppolId("0007:12345");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("10 digits");
    });

    it("should reject ABN with wrong length", () => {
      const result = validatePeppolId("0151:12345");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("11 digits");
    });

    it("should reject VAT number that is too short", () => {
      const result = validatePeppolId("9930:DE12");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 5 characters");
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace around Peppol ID", () => {
      const result = validatePeppolId("  0192:123456789  ");
      expect(result.valid).toBe(true);
    });

    it("should handle null value", () => {
      // @ts-expect-error - Testing null handling
      const result = validatePeppolId(null);
      expect(result.valid).toBe(false);
    });

    it("should handle undefined value", () => {
      // @ts-expect-error - Testing undefined handling
      const result = validatePeppolId(undefined);
      expect(result.valid).toBe(false);
    });
  });
});

describe("PEPPOL_SCHEMES", () => {
  it("should contain common European schemes", () => {
    expect(PEPPOL_SCHEMES).toContain("0007"); // Sweden
    expect(PEPPOL_SCHEMES).toContain("0088"); // GLN
    expect(PEPPOL_SCHEMES).toContain("0192"); // Norway
    expect(PEPPOL_SCHEMES).toContain("9930"); // Germany VAT
  });

  it("should have at least 50 schemes", () => {
    expect(PEPPOL_SCHEMES.length).toBeGreaterThan(50);
  });
});

describe("validateForPeppol", () => {
  const validData: MiddayInvoiceData = {
    invoice: {
      id: "inv-123",
      invoiceNumber: "INV-001",
      issueDate: "2024-01-15",
      dueDate: "2024-02-15",
      amount: 1000,
      vat: 250,
      tax: null,
      currency: "EUR",
      note: null,
      lineItems: [{ name: "Service", quantity: 10, price: 100, unit: "hour" }],
    },
    customer: {
      name: "Acme Corp",
      email: "billing@acme.com",
      countryCode: "NO",
      vatNumber: "NO123456789MVA",
      peppolId: "0192:123456789",
      registrationNumber: "123456789",
      legalForm: "LegalEntity",
      addressLine1: "Main Street 1",
      addressLine2: null,
      city: "Oslo",
      zip: "0150",
      country: "Norway",
    },
    team: {
      name: "My Company",
      countryCode: "SE",
      taxId: "SE556123456701",
      peppolId: "0007:5561234567",
      registrationNumber: "5561234567",
      addressLine1: "Business Road 10",
      addressLine2: null,
      city: "Stockholm",
      zip: "11122",
    },
  };

  it("should validate complete data as valid", () => {
    const result = validateForPeppol(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail when customer Peppol ID is missing", () => {
    const data = {
      ...validData,
      customer: { ...validData.customer, peppolId: null },
    };
    const result = validateForPeppol(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Customer Peppol ID is required");
  });

  it("should fail when customer Peppol ID format is invalid", () => {
    const data = {
      ...validData,
      customer: { ...validData.customer, peppolId: "invalid-id" },
    };
    const result = validateForPeppol(data);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes("Invalid customer Peppol ID")),
    ).toBe(true);
  });

  it("should fail when customer country code is missing", () => {
    const data = {
      ...validData,
      customer: { ...validData.customer, countryCode: null },
    };
    const result = validateForPeppol(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Customer country code is required");
  });

  it("should fail when invoice has no amount and no line items", () => {
    const data = {
      ...validData,
      invoice: { ...validData.invoice, amount: null, lineItems: [] },
    };
    const result = validateForPeppol(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Invoice must have amount or line items");
  });

  it("should pass when invoice has line items but no amount", () => {
    const data = {
      ...validData,
      invoice: { ...validData.invoice, amount: null },
    };
    const result = validateForPeppol(data);
    expect(result.valid).toBe(true);
  });

  it("should fail when invoice currency is missing", () => {
    const data = {
      ...validData,
      invoice: { ...validData.invoice, currency: null },
    };
    const result = validateForPeppol(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Invoice currency is required");
  });

  it("should add warning for seller's invalid Peppol ID", () => {
    const data = {
      ...validData,
      team: { ...validData.team, peppolId: "invalid" },
    };
    const result = validateForPeppol(data);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes("Invalid seller Peppol ID")),
    ).toBe(true);
  });

  it("should collect multiple errors", () => {
    const data = {
      ...validData,
      customer: {
        ...validData.customer,
        peppolId: null,
        countryCode: null,
      },
      invoice: {
        ...validData.invoice,
        currency: null,
      },
    };
    const result = validateForPeppol(data);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("transformToDDDInvoice", () => {
  const sampleData: MiddayInvoiceData = {
    invoice: {
      id: "inv-123",
      invoiceNumber: "INV-2024-001",
      issueDate: "2024-01-15T00:00:00Z",
      dueDate: "2024-02-15T00:00:00Z",
      amount: 1250,
      vat: 250,
      tax: null,
      currency: "EUR",
      note: "Thank you for your business",
      lineItems: [
        {
          name: "Consulting",
          quantity: 10,
          price: 100,
          unit: "hour",
          taxRate: 25,
        },
        {
          name: "Software License",
          quantity: 1,
          price: 250,
          unit: "piece",
          taxRate: 25,
        },
      ],
    },
    customer: {
      name: "Customer AB",
      email: "billing@customer.se",
      countryCode: "SE",
      vatNumber: "SE556789012301",
      peppolId: "0007:5567890123",
      registrationNumber: "5567890123",
      legalForm: "LegalEntity",
      addressLine1: "Customer Street 5",
      addressLine2: "Floor 3",
      city: "Gothenburg",
      zip: "41101",
      country: "Sweden",
    },
    team: {
      name: "Seller Company",
      countryCode: "NO",
      taxId: "NO987654321MVA",
      peppolId: "0192:987654321",
      registrationNumber: "987654321",
      addressLine1: "Seller Road 10",
      addressLine2: null,
      city: "Bergen",
      zip: "5020",
    },
  };

  it("should transform basic invoice data", () => {
    const result = transformToDDDInvoice(sampleData);

    expect(result.BuyerName).toBe("Customer AB");
    expect(result.BuyerId).toBe("0007:5567890123");
    expect(result.BuyerCountryCode).toBe("SE");
    expect(result.BuyerTaxNum).toBe("SE556789012301");
    expect(result.DocNumber).toBe("INV-2024-001");
    expect(result.DocTotalAmount).toBe(1250);
    expect(result.DocCurrencyCode).toBe("EUR");
  });

  it("should transform line items", () => {
    const result = transformToDDDInvoice(sampleData);
    const items = result._details.Items;

    expect(items).toHaveLength(2);
    expect(items[0]?.ItemName).toBe("Consulting");
    expect(items[0]?.ItemQuantity).toBe(10);
    expect(items[0]?.ItemNetPrice).toBe(100);
    expect(items[0]?.ItemUmcCode).toBe("hour");
    expect(items[0]?.ItemVatRate).toBe(25);
  });

  it("should set buyer type based on country comparison", () => {
    // Seller is NO, Buyer is SE - should be Foreign
    const result = transformToDDDInvoice(sampleData);
    expect(result.BuyerTypeCode).toBe("Foreign");

    // Same country - should be Domestic
    const domesticData = {
      ...sampleData,
      customer: { ...sampleData.customer, countryCode: "NO" },
    };
    const domesticResult = transformToDDDInvoice(domesticData);
    expect(domesticResult.BuyerTypeCode).toBe("Domestic");
  });

  it("should handle missing optional fields", () => {
    const minimalData: MiddayInvoiceData = {
      invoice: {
        id: "inv-456",
        invoiceNumber: null,
        issueDate: null,
        dueDate: null,
        amount: 500,
        vat: null,
        tax: null,
        currency: "USD",
        note: null,
        lineItems: [],
      },
      customer: {
        name: "Minimal Customer",
        email: "test@example.com",
        countryCode: "US",
        vatNumber: null,
        peppolId: "9959:123456789",
        registrationNumber: null,
        legalForm: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        zip: null,
        country: null,
      },
      team: {
        name: "Minimal Seller",
        countryCode: "US",
        taxId: null,
        peppolId: null,
        registrationNumber: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        zip: null,
      },
    };

    const result = transformToDDDInvoice(minimalData);

    expect(result.BuyerName).toBe("Minimal Customer");
    expect(result.DocNumber).toBeNull();
    expect(result.DocTotalAmount).toBe(500);
    expect(result.BuyerTypeCode).toBe("Domestic");
  });

  it("should map unit codes correctly", () => {
    const dataWithUnits: MiddayInvoiceData = {
      ...sampleData,
      invoice: {
        ...sampleData.invoice,
        lineItems: [
          { name: "Hours work", quantity: 8, price: 100, unit: "hours" },
          { name: "Daily rate", quantity: 5, price: 500, unit: "day" },
          { name: "Material", quantity: 10, price: 25, unit: "kg" },
          { name: "Distance", quantity: 100, price: 0.5, unit: "meter" },
          { name: "Liquid", quantity: 50, price: 2, unit: "liter" },
          { name: "Items", quantity: 3, price: 75, unit: "units" },
        ],
      },
    };

    const result = transformToDDDInvoice(dataWithUnits);
    const items = result._details.Items;

    expect(items[0]?.ItemUmcCode).toBe("hour");
    expect(items[1]?.ItemUmcCode).toBe("day");
    expect(items[2]?.ItemUmcCode).toBe("kg");
    expect(items[3]?.ItemUmcCode).toBe("meter");
    expect(items[4]?.ItemUmcCode).toBe("liter");
    expect(items[5]?.ItemUmcCode).toBe("piece"); // default
  });

  it("should include payment information", () => {
    const result = transformToDDDInvoice(sampleData);
    const payments = result._details.Payments;

    expect(payments).toHaveLength(1);
    expect(payments?.[0]?.PayCode).toBe("CREDITTRANSFER");
    expect(payments?.[0]?.PayAmount).toBe(1250);
  });
});

describe("canSendEInvoice", () => {
  const validData: MiddayInvoiceData = {
    invoice: {
      id: "inv-123",
      invoiceNumber: "INV-001",
      issueDate: "2024-01-15",
      dueDate: "2024-02-15",
      amount: 1000,
      vat: 250,
      tax: null,
      currency: "EUR",
      note: null,
      lineItems: [],
    },
    customer: {
      name: "Customer",
      email: "test@example.com",
      countryCode: "SE",
      vatNumber: null,
      peppolId: "0007:1234567890",
      registrationNumber: null,
      legalForm: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      zip: null,
      country: null,
    },
    team: {
      name: "Seller",
      countryCode: "SE",
      taxId: null,
      peppolId: null,
      registrationNumber: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      zip: null,
    },
  };

  it("should return true for valid e-invoice data", () => {
    expect(canSendEInvoice(validData)).toBe(true);
  });

  it("should return false when customer has no Peppol ID", () => {
    const data = {
      ...validData,
      customer: { ...validData.customer, peppolId: null },
    };
    expect(canSendEInvoice(data)).toBe(false);
  });

  it("should return false when validation fails", () => {
    const data = {
      ...validData,
      invoice: { ...validData.invoice, currency: null },
    };
    expect(canSendEInvoice(data)).toBe(false);
  });
});
