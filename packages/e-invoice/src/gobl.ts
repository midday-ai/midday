/**
 * GOBL Transformer
 *
 * Converts Midday invoice data into GOBL format for submission to Invopop.
 * GOBL (Go Business Language) is the universal format used by Invopop.
 *
 * Reference: https://docs.gobl.org/draft-0/bill/invoice
 */

import type {
  GOBLAddress,
  GOBLInvoice,
  GOBLLine,
  GOBLParty,
  GOBLTaxIdentity,
} from "./types";

// ---------------------------------------------------------------------------
// Input types (from Midday data model)
// ---------------------------------------------------------------------------

export interface MiddayTeam {
  name: string | null;
  email: string | null;
  countryCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  vatNumber: string | null;
  taxId: string | null;
  peppolId: string | null;
}

export interface PeppolRegistration {
  peppolId: string;
  peppolScheme?: string | null;
}

export interface MiddayCustomer {
  name: string;
  email: string;
  countryCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  vatNumber: string | null;
  peppolId: string | null;
}

export interface MiddayLineItem {
  name: string;
  quantity: number;
  price: number;
  unit?: string | null;
  taxRate?: number | null;
  vat?: number | null;
  tax?: number | null;
}

export interface MiddayInvoiceData {
  id: string;
  invoiceNumber: string | null;
  issueDate: string | null;
  dueDate: string | null;
  currency: string | null;
  lineItems: MiddayLineItem[];
  team: MiddayTeam;
  customer: MiddayCustomer;
  /** Supplier Peppol registration (if registered) */
  supplierRegistration?: PeppolRegistration | null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  field: string;
  message: string;
}

/**
 * Check if the minimum required data is present for e-invoicing.
 * Returns an array of issues (empty = all good).
 */
export function validateEInvoiceRequirements(
  data: MiddayInvoiceData,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Supplier (team) checks
  if (!data.team.name) {
    issues.push({ field: "company.name", message: "Company name is required" });
  }
  if (!data.team.countryCode) {
    issues.push({
      field: "company.countryCode",
      message: "Company country is required",
    });
  }
  if (!data.team.addressLine1) {
    issues.push({
      field: "company.address",
      message: "Company address is required",
    });
  }
  if (!data.team.city) {
    issues.push({ field: "company.city", message: "Company city is required" });
  }
  if (!data.team.zip) {
    issues.push({
      field: "company.zip",
      message: "Company postal code is required",
    });
  }
  if (!data.team.vatNumber) {
    issues.push({
      field: "company.vatNumber",
      message: "Company VAT number is required",
    });
  }
  if (!data.team.email) {
    issues.push({
      field: "company.email",
      message: "Company email is required",
    });
  }

  // Customer checks
  if (!data.customer.name) {
    issues.push({
      field: "customer.name",
      message: "Customer name is required",
    });
  }
  if (!data.customer.countryCode) {
    issues.push({
      field: "customer.countryCode",
      message: "Customer country is required",
    });
  }
  if (!data.customer.addressLine1) {
    issues.push({
      field: "customer.address",
      message: "Customer address is required",
    });
  }
  if (!data.customer.vatNumber) {
    issues.push({
      field: "customer.vatNumber",
      message: "Customer VAT number is required for Peppol",
    });
  }

  // Line items
  if (!data.lineItems || data.lineItems.length === 0) {
    issues.push({
      field: "lineItems",
      message: "At least one line item is required",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Transformer
// ---------------------------------------------------------------------------

function buildAddress(data: {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  countryCode: string | null;
}): GOBLAddress | null {
  if (!data.addressLine1 && !data.city) return null;

  const address: GOBLAddress = {};
  if (data.addressLine1) address.street = data.addressLine1;
  if (data.addressLine2) address.street_extra = data.addressLine2;
  if (data.city) address.locality = data.city;
  if (data.state) address.region = data.state;
  if (data.zip) address.code = data.zip;
  if (data.countryCode) address.country = data.countryCode;

  return address;
}

function buildTaxId(
  countryCode: string | null,
  vatNumber: string | null,
): GOBLTaxIdentity | undefined {
  if (!countryCode) return undefined;
  const taxId: GOBLTaxIdentity = { country: countryCode };
  if (vatNumber) taxId.code = vatNumber;
  return taxId;
}

function buildSupplier(
  team: MiddayTeam,
  registration?: PeppolRegistration | null,
): GOBLParty {
  const party: GOBLParty = {
    name: team.name || "",
  };

  const taxId = buildTaxId(team.countryCode, team.vatNumber);
  if (taxId) party.tax_id = taxId;

  const address = buildAddress(team);
  if (address) party.addresses = [address];

  if (team.email) {
    party.emails = [{ addr: team.email }];
  }

  // Add Peppol inbox from registration (or team's peppolId)
  const peppolId = registration?.peppolId ?? team.peppolId;
  if (peppolId) {
    party.inboxes = [
      {
        key: "peppol",
        ...(registration?.peppolScheme && {
          scheme: registration.peppolScheme,
        }),
        code: peppolId,
      },
    ];
  }

  return party;
}

function buildCustomer(customer: MiddayCustomer): GOBLParty {
  const party: GOBLParty = {
    name: customer.name,
  };

  const taxId = buildTaxId(customer.countryCode, customer.vatNumber);
  if (taxId) party.tax_id = taxId;

  const address = buildAddress(customer);
  if (address) party.addresses = [address];

  if (customer.email) {
    party.emails = [{ addr: customer.email }];
  }

  // Peppol inbox
  if (customer.peppolId) {
    party.inboxes = [{ key: "peppol", code: customer.peppolId }];
  }

  return party;
}

function buildLines(lineItems: MiddayLineItem[]): GOBLLine[] {
  return lineItems.map((item, index) => {
    const line: GOBLLine = {
      i: index + 1,
      quantity: String(item.quantity),
      item: {
        name: item.name,
        price: String(item.price),
        ...(item.unit && { unit: item.unit }),
      },
    };

    // Add tax information if available
    const taxRate = item.taxRate ?? item.vat ?? item.tax;
    if (taxRate != null && taxRate > 0) {
      line.taxes = [
        {
          cat: "VAT",
          percent: `${taxRate}%`,
        },
      ];
    }

    return line;
  });
}

/**
 * Transform a Midday invoice into a GOBL invoice document.
 * The resulting object can be sent directly to the Invopop Silo API.
 */
export function toGOBL(data: MiddayInvoiceData): GOBLInvoice {
  const invoice: GOBLInvoice = {
    $schema: "https://gobl.org/draft-0/bill/invoice",
    type: "standard",
    currency: data.currency || "USD",
    supplier: buildSupplier(data.team, data.supplierRegistration),
    lines: buildLines(data.lineItems),
  };

  // Set tax regime from supplier country
  if (data.team.countryCode) {
    invoice.$regime = data.team.countryCode;
  }

  // Set dates
  if (data.issueDate) {
    // GOBL expects YYYY-MM-DD format
    invoice.issue_date = data.issueDate.slice(0, 10);
  }

  // Set invoice number as code
  if (data.invoiceNumber) {
    invoice.code = data.invoiceNumber;
  }

  // Add customer
  const customer = buildCustomer(data.customer);
  invoice.customer = customer;

  // Add EN 16931 addon when Peppol is involved (supplier or customer has Peppol ID)
  const hasPeppol =
    data.supplierRegistration?.peppolId ||
    data.team.peppolId ||
    data.customer.peppolId;
  if (hasPeppol) {
    invoice.$addons = ["eu-en16931-v2017"];
  }

  return invoice;
}

/**
 * Generate the idempotency key for an invoice.
 */
export function invoiceKey(invoiceId: string): string {
  return `midday-invoice-${invoiceId}`;
}

/**
 * Extract invoice ID from a webhook key.
 */
export function parseInvoiceKey(key: string): string | null {
  const prefix = "midday-invoice-";
  if (!key.startsWith(prefix)) return null;
  return key.slice(prefix.length);
}
