/**
 * Incoming Peppol E-Invoice Parser
 *
 * Parses GOBL bill/invoice documents received via the Peppol network
 * through Invopop. Extracts structured data for creating inbox items.
 *
 * Flow:
 * 1. Invopop receives a Peppol document (UBL/CII)
 * 2. The receive workflow converts it to GOBL and fires a webhook
 * 3. We fetch the silo entry containing the GOBL document
 * 4. This module parses the GOBL data into inbox-compatible fields
 */

import type { GOBLInvoice, GOBLParty, InvopopSiloEntry } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedIncomingInvoice {
  /** Supplier/sender company name */
  supplierName: string;
  /** Supplier email address */
  supplierEmail: string | null;
  /** Supplier VAT / tax ID code */
  supplierVat: string | null;
  /** Supplier country code */
  supplierCountry: string | null;
  /** Supplier Peppol participant ID (scheme:code or just code) */
  supplierPeppolId: string | null;
  /** Customer (receiver) Peppol participant ID — used to look up the team */
  customerPeppolId: string | null;
  /** Invoice number / code */
  invoiceNumber: string | null;
  /** Invoice currency */
  currency: string | null;
  /** Total payable amount */
  amount: number | null;
  /** Issue date (YYYY-MM-DD) */
  date: string | null;
  /** Summary description from line items */
  description: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the first Peppol participant ID from a GOBL party's inboxes. */
function extractPartyPeppolId(party: GOBLParty | undefined): string | null {
  if (!party?.inboxes) return null;

  const peppolInbox = party.inboxes.find((inbox) => inbox.key === "peppol");
  if (!peppolInbox?.code) return null;

  return peppolInbox.scheme
    ? `${peppolInbox.scheme}:${peppolInbox.code}`
    : peppolInbox.code;
}

/** Safely parse a numeric string to a number. */
function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const str = String(value);
  const num = Number.parseFloat(str);
  return Number.isFinite(num) ? num : null;
}

/** Extract the payable total from GOBL totals. */
function extractPayableAmount(
  totals: Record<string, unknown> | undefined,
): number | null {
  if (!totals) return null;

  // GOBL totals structure: totals.payable is the final amount
  if ("payable" in totals) return parseAmount(totals.payable);

  // Fallback: try total_with_tax or total
  if ("total_with_tax" in totals) return parseAmount(totals.total_with_tax);
  if ("total" in totals) return parseAmount(totals.total);

  return null;
}

/** Build a description summary from GOBL line items. */
function summarizeLineItems(
  lines: GOBLInvoice["lines"] | undefined,
): string | null {
  if (!lines || lines.length === 0) return null;

  const names = lines
    .map((line) => line.item?.name)
    .filter(Boolean)
    .slice(0, 5);

  if (names.length === 0) return null;

  const summary = names.join(", ");
  return lines.length > 5 ? `${summary}, +${lines.length - 5} more` : summary;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a GOBL bill/invoice from an Invopop silo entry into structured
 * inbox-compatible fields.
 *
 * Returns null if the entry does not contain a valid bill/invoice document.
 */
export function parseIncomingGOBL(
  entry: InvopopSiloEntry,
): ParsedIncomingInvoice | null {
  const data = entry.data;
  if (!data) return null;

  // Verify this is a bill/invoice document
  const schema = data.$schema as string | undefined;
  if (!schema || !schema.includes("bill/invoice")) return null;

  const invoice = data as unknown as GOBLInvoice;

  const supplier = invoice.supplier;
  const customer = invoice.customer;

  return {
    supplierName: supplier?.name ?? "Unknown Supplier",
    supplierEmail: supplier?.emails?.[0]?.addr ?? null,
    supplierVat: supplier?.tax_id?.code ?? null,
    supplierCountry: supplier?.tax_id?.country ?? null,
    supplierPeppolId: extractPartyPeppolId(supplier),
    customerPeppolId: extractPartyPeppolId(customer),
    invoiceNumber: invoice.code ?? null,
    currency: invoice.currency ?? null,
    amount: extractPayableAmount(invoice.totals),
    date: invoice.issue_date ?? null,
    description: summarizeLineItems(invoice.lines),
  };
}
