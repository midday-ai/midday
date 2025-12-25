/**
 * UBL XML Generation for Peppol BIS Billing 3.0
 *
 * Generates compliant UBL 2.1 XML for invoices and credit notes.
 * See: https://docs.peppol.eu/poacc/billing/3.0/
 */

import type { Invoice, LineItem } from "@midday/invoice/types";
import type {
  EInvoiceDocument,
  EInvoiceLineItem,
  EInvoiceParty,
  PeppolParticipantId,
  TaxCategoryCode,
} from "../types";

/**
 * UN/ECE Recommendation 20 unit codes
 * Common units used in invoicing
 */
const UNIT_CODES: Record<string, string> = {
  each: "EA",
  piece: "EA",
  pcs: "EA",
  hour: "HUR",
  hours: "HUR",
  hr: "HUR",
  day: "DAY",
  days: "DAY",
  week: "WEE",
  month: "MON",
  year: "ANN",
  kg: "KGM",
  kilogram: "KGM",
  gram: "GRM",
  liter: "LTR",
  meter: "MTR",
  m: "MTR",
  km: "KMT",
  "": "EA", // Default to "each" if not specified
};

/**
 * Map unit string to UN/ECE code
 */
function mapUnitCode(unit: string | undefined): string {
  if (!unit) return "EA";
  const normalized = unit.toLowerCase().trim();
  return UNIT_CODES[normalized] || "EA";
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Format number for UBL (2 decimal places)
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format date to ISO 8601 date (YYYY-MM-DD)
 */
function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0] as string;
}

/**
 * Generate a line item XML element
 */
function generateLineItemXml(item: EInvoiceLineItem, currency: string): string {
  return `
    <cac:InvoiceLine>
      <cbc:ID>${escapeXml(item.id)}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${item.unitCode}">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${currency}">${formatAmount(item.lineExtensionAmount)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Description>${escapeXml(item.description)}</cbc:Description>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>${item.taxCategoryCode}</cbc:ID>
          <cbc:Percent>${item.taxPercent}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${currency}">${formatAmount(item.unitPrice)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
}

/**
 * Generate party XML element (for seller/buyer)
 */
function generatePartyXml(
  party: EInvoiceParty,
  type: "seller" | "buyer",
): string {
  const tagName =
    type === "seller"
      ? "cac:AccountingSupplierParty"
      : "cac:AccountingCustomerParty";

  return `
    <${tagName}>
      <cac:Party>
        <cbc:EndpointID schemeID="${party.peppolId.scheme}">${escapeXml(party.peppolId.identifier)}</cbc:EndpointID>
        <cac:PartyIdentification>
          <cbc:ID schemeID="${party.peppolId.scheme}">${escapeXml(party.peppolId.identifier)}</cbc:ID>
        </cac:PartyIdentification>
        <cac:PartyName>
          <cbc:Name>${escapeXml(party.name)}</cbc:Name>
        </cac:PartyName>
        <cac:PostalAddress>
          ${party.streetAddress ? `<cbc:StreetName>${escapeXml(party.streetAddress)}</cbc:StreetName>` : ""}
          ${party.city ? `<cbc:CityName>${escapeXml(party.city)}</cbc:CityName>` : ""}
          ${party.postalCode ? `<cbc:PostalZone>${escapeXml(party.postalCode)}</cbc:PostalZone>` : ""}
          <cac:Country>
            <cbc:IdentificationCode>${party.countryCode}</cbc:IdentificationCode>
          </cac:Country>
        </cac:PostalAddress>
        ${
          party.vatNumber
            ? `
        <cac:PartyTaxScheme>
          <cbc:CompanyID>${escapeXml(party.vatNumber)}</cbc:CompanyID>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:PartyTaxScheme>`
            : ""
        }
        <cac:PartyLegalEntity>
          <cbc:RegistrationName>${escapeXml(party.name)}</cbc:RegistrationName>
          ${party.companyId ? `<cbc:CompanyID>${escapeXml(party.companyId)}</cbc:CompanyID>` : ""}
        </cac:PartyLegalEntity>
        ${
          party.contactEmail || party.contactName || party.contactPhone
            ? `
        <cac:Contact>
          ${party.contactName ? `<cbc:Name>${escapeXml(party.contactName)}</cbc:Name>` : ""}
          ${party.contactPhone ? `<cbc:Telephone>${escapeXml(party.contactPhone)}</cbc:Telephone>` : ""}
          ${party.contactEmail ? `<cbc:ElectronicMail>${escapeXml(party.contactEmail)}</cbc:ElectronicMail>` : ""}
        </cac:Contact>`
            : ""
        }
      </cac:Party>
    </${tagName}>`;
}

/**
 * Generate Peppol BIS 3.0 compliant UBL XML invoice
 */
export function generateUBLInvoice(document: EInvoiceDocument): string {
  const isCredit = document.documentType === "credit_note";
  const rootElement = isCredit ? "CreditNote" : "Invoice";
  const customizationId =
    "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0";
  const profileId = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

  // Generate tax subtotals XML
  const taxSubtotalsXml = document.taxTotal.taxSubtotals
    .map(
      (subtotal) => `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${document.documentCurrencyCode}">${formatAmount(subtotal.taxableAmount)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${document.documentCurrencyCode}">${formatAmount(subtotal.taxAmount)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${subtotal.taxCategoryCode}</cbc:ID>
          <cbc:Percent>${subtotal.taxPercent}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>`,
    )
    .join("");

  // Generate line items XML
  const lineItemsXml = document.lineItems
    .map((item) => generateLineItemXml(item, document.documentCurrencyCode))
    .join("");

  // Generate payment means XML if provided
  const paymentMeansXml = document.payment
    ? `
    <cac:PaymentMeans>
      <cbc:PaymentMeansCode>${document.payment.meansCode}</cbc:PaymentMeansCode>
      ${document.payment.paymentId ? `<cbc:PaymentID>${escapeXml(document.payment.paymentId)}</cbc:PaymentID>` : ""}
      ${
        document.payment.iban
          ? `
      <cac:PayeeFinancialAccount>
        <cbc:ID>${escapeXml(document.payment.iban)}</cbc:ID>
        ${document.payment.accountName ? `<cbc:Name>${escapeXml(document.payment.accountName)}</cbc:Name>` : ""}
        ${
          document.payment.bic
            ? `
        <cac:FinancialInstitutionBranch>
          <cbc:ID>${escapeXml(document.payment.bic)}</cbc:ID>
        </cac:FinancialInstitutionBranch>`
            : ""
        }
      </cac:PayeeFinancialAccount>`
          : ""
      }
    </cac:PaymentMeans>`
    : "";

  // Generate the full UBL XML document
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<${rootElement} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${rootElement}-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>${customizationId}</cbc:CustomizationID>
  <cbc:ProfileID>${profileId}</cbc:ProfileID>
  <cbc:ID>${escapeXml(document.id)}</cbc:ID>
  <cbc:IssueDate>${formatDate(document.issueDate)}</cbc:IssueDate>
  ${document.dueDate ? `<cbc:DueDate>${formatDate(document.dueDate)}</cbc:DueDate>` : ""}
  <cbc:${isCredit ? "CreditNoteTypeCode" : "InvoiceTypeCode"}>${isCredit ? "381" : "380"}</cbc:${isCredit ? "CreditNoteTypeCode" : "InvoiceTypeCode"}>
  ${document.note ? `<cbc:Note>${escapeXml(document.note)}</cbc:Note>` : ""}
  <cbc:DocumentCurrencyCode>${document.documentCurrencyCode}</cbc:DocumentCurrencyCode>
  ${document.buyerReference ? `<cbc:BuyerReference>${escapeXml(document.buyerReference)}</cbc:BuyerReference>` : ""}
  ${
    document.orderReference
      ? `
  <cac:OrderReference>
    <cbc:ID>${escapeXml(document.orderReference)}</cbc:ID>
  </cac:OrderReference>`
      : ""
  }
  ${generatePartyXml(document.seller, "seller")}
  ${generatePartyXml(document.buyer, "buyer")}
  ${paymentMeansXml}
  ${
    document.dueDate
      ? `
  <cac:PaymentTerms>
    <cbc:Note>Due date: ${formatDate(document.dueDate)}</cbc:Note>
  </cac:PaymentTerms>`
      : ""
  }
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${document.documentCurrencyCode}">${formatAmount(document.taxTotal.taxAmount)}</cbc:TaxAmount>
    ${taxSubtotalsXml}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${document.documentCurrencyCode}">${formatAmount(document.lineExtensionAmount)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${document.documentCurrencyCode}">${formatAmount(document.taxExclusiveAmount)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${document.documentCurrencyCode}">${formatAmount(document.taxInclusiveAmount)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${document.documentCurrencyCode}">${formatAmount(document.payableAmount)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${lineItemsXml}
</${rootElement}>`;

  return xml.trim();
}

/**
 * Convert a Midday Invoice to an EInvoiceDocument
 *
 * @param invoice - The Midday invoice
 * @param seller - Seller party information
 * @param buyer - Buyer party information
 * @param taxRate - Tax rate as percentage (e.g., 25 for 25%)
 */
export function invoiceToEInvoiceDocument(
  invoice: Invoice,
  seller: EInvoiceParty,
  buyer: EInvoiceParty,
  taxRate = 0,
): EInvoiceDocument {
  // Calculate line items with tax
  const lineItems: EInvoiceLineItem[] = invoice.lineItems.map((item, index) => {
    const quantity = item.quantity ?? 1;
    const unitPrice = item.price ?? 0;
    const lineExtensionAmount = quantity * unitPrice;

    return {
      id: String(index + 1),
      description: item.name,
      quantity,
      unitCode: mapUnitCode(item.unit),
      unitPrice,
      lineExtensionAmount,
      taxCategoryCode: taxRate > 0 ? "S" : "Z",
      taxPercent: taxRate,
    };
  });

  // Calculate totals
  const lineExtensionAmount = lineItems.reduce(
    (sum, item) => sum + item.lineExtensionAmount,
    0,
  );
  const taxAmount =
    invoice.vat ?? invoice.tax ?? lineExtensionAmount * (taxRate / 100);
  const taxExclusiveAmount = lineExtensionAmount;
  const taxInclusiveAmount = taxExclusiveAmount + taxAmount;

  // Apply discount if present
  const discount = invoice.discount ?? 0;
  const payableAmount = taxInclusiveAmount - discount;

  // Determine tax category
  const taxCategoryCode: TaxCategoryCode = taxRate > 0 ? "S" : "Z";

  return {
    id: invoice.invoiceNumber ?? invoice.id,
    issueDate: invoice.issueDate ?? invoice.createdAt,
    dueDate: invoice.dueDate ?? undefined,
    documentType: "invoice",
    documentCurrencyCode: invoice.currency ?? "EUR",
    seller,
    buyer,
    lineItems,
    lineExtensionAmount,
    taxExclusiveAmount,
    taxInclusiveAmount,
    payableAmount,
    taxTotal: {
      taxAmount,
      taxSubtotals: [
        {
          taxableAmount: lineExtensionAmount,
          taxAmount,
          taxCategoryCode,
          taxPercent: taxRate,
        },
      ],
    },
    note: invoice.note ?? undefined,
  };
}

/**
 * Convert line items from Midday format to E-Invoice format
 */
export function convertLineItems(
  items: LineItem[],
  taxRate: number,
  taxCategoryCode: TaxCategoryCode = "S",
): EInvoiceLineItem[] {
  return items.map((item, index) => {
    const quantity = item.quantity ?? 1;
    const unitPrice = item.price ?? 0;
    const lineExtensionAmount = quantity * unitPrice;

    return {
      id: String(index + 1),
      description: item.name,
      quantity,
      unitCode: mapUnitCode(item.unit),
      unitPrice,
      lineExtensionAmount,
      taxCategoryCode,
      taxPercent: taxRate,
    };
  });
}
