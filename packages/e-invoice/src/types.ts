/**
 * DDD Invoices API Types
 * Based on: https://app.dddinvoices.com/documentation
 */

// Buyer (Customer) legal form
export type LegalForm = "LegalEntity" | "NaturalPerson";

// Buyer type code
export type BuyerTypeCode = "Domestic" | "Foreign";

// Invoice type
export type InvoiceTypeCode = "INVOICE" | "CREDITNOTE";

// Payment type
export type PaymentTypeCode = "NONCASH" | "CASH";

// Sale type
export type SaleTypeCode = "Wholesale" | "Retail";

// Unit of measure codes
export type UnitCode = "piece" | "kg" | "hour" | "day" | "meter" | "liter";

// Payment method codes
export type PaymentCode = "CREDITTRANSFER" | "DIRECTDEBIT" | "CARD";

/**
 * DDD Invoice Item
 */
export interface DDDInvoiceItem {
  ItemName: string;
  ItemQuantity: number;
  ItemUmcCode: UnitCode | string;
  ItemNetPrice: number;
  ItemRetailPrice?: number | null;
  ItemAllowancePercent?: number;
  ItemVatRate?: number;
  ItemVatCode?: string; // e.g., "20" for 20% VAT, "10" for 10%
  ItemExciseAmount?: number;
}

/**
 * DDD Payment instruction
 */
export interface DDDPayment {
  PayCode: PaymentCode;
  PayNumber?: string | null; // Bank account number
  PayAmount: number;
  PayPayeeAccountType?: string | null; // "BBAN" or "IBAN"
  PayNetworkProvider?: string | null; // SWIFT/BIC code
  PayCardHolderOrReference?: string | null;
  PayDocDate?: string | null;
}

/**
 * DDD Invoice object structure
 * This is the main invoice data sent to DDDI_Save
 */
export interface DDDInvoice {
  // Buyer (Customer) information
  BuyerLegalForm: LegalForm;
  BuyerTypeCode: BuyerTypeCode;
  BuyerCountryCode: string; // ISO country code (e.g., "RS", "DE", "US")
  BuyerTaxNum?: string | null; // VAT/Tax number
  BuyerName: string;
  BuyerPostCode?: string | null;
  BuyerStreet?: string | null;
  BuyerCity?: string | null;
  BuyerRegNum?: string | null; // Registration number
  BuyerId?: string | null; // Peppol participant ID
  BuyerIsBudget?: boolean;
  BuyerBudgetNum?: string | null;

  // Document information
  DocNumber?: string | null; // Invoice number (auto-generated if null)
  DocIssueDate?: string | null; // ISO date (auto-set if null)
  DocDueDate?: string | null;
  DocTotalAmount: number;
  DocTotalVatAmount?: number;
  DocStartDate?: string;
  DocEndDate?: string;
  DocDeliveryDate?: string | null;
  DocCurrencyCode: string; // ISO currency code (e.g., "EUR", "USD")
  DocExchangeRate?: number;
  DocAllowPercent?: number;
  DocSigner?: string | null;
  DocNote?: string | null;
  DocBuyerOrderRef?: string | null;
  OriginalInvNumber?: string | null;
  OriginalInvIssueDate?: string | null;
  DocTypeCode: InvoiceTypeCode;
  DocSaleTypeCode?: SaleTypeCode;
  DocPaymentTypeCode?: PaymentTypeCode;
  OperatorTAPRegistration?: string | null;
  PDFOriginal?: string | null;

  // Line items and payments
  _details: {
    Items: DDDInvoiceItem[];
    Payments?: DDDPayment[];
  };
}

/**
 * DDD API response structure
 */
export interface DDDResponse<T = unknown> {
  Status: "OK" | "Warning" | "Error";
  Reason?: string;
  Result?: {
    Status: "OK" | "Warning" | "Error";
    Step?: number;
    Reason?: string;
    Result?: T;
    ResultType?: "Custom" | "Invoice" | "Registration";
    ReturnDoc?: {
      PDFP?: string; // Primary PDF URL
      PDFO?: string; // Original PDF URL
      XMLS?: string; // Country-specific UBL URL
      XMLP?: string; // Peppol XML URL
    };
  };
  Code?: number;
}

/**
 * DDD Save result
 */
export interface DDDSaveResult {
  Id: string;
  PDFPrimary?: string;
  PDFMade?: string;
}

/**
 * Workflow steps for DDDI_Save
 */
export enum DDDStep {
  Confirm = 35, // Invoice confirmed and locked
  Fiscalize = 40, // Fiscalized
  PDFWithFiscal = 43, // PDF with fiscalization data
  GeneratePDF = 45, // Generate PDF before TAP
  SetPDFPrimary = 47, // Set PDF as primary attachment
  GenerateCountryUBL = 50, // Generate country-specific UBL
  GeneratePeppolUBL = 55, // Generate Peppol UBL
  SendToTAP = 70, // Send to tax authority
  SendToPeppol = 80, // Send to Peppol network
  ModifyPDFWithSendData = 83, // Modify PDF with sending data
  GeneratePDFWithSendData = 85, // Generate PDF with sending data
  AllDefault = 999, // All steps for specific country
}

/**
 * Return document types
 */
export type ReturnDocType = "PDFP" | "PDFO" | "XMLS" | "XMLP";

/**
 * E-Invoice status tracked on our invoices
 */
export type EInvoiceStatus =
  | "pending"
  | "retrying"
  | "sent"
  | "delivered"
  | "failed";

/**
 * Input data from Midday for transformation
 */
export interface MiddayInvoiceData {
  invoice: {
    id: string;
    invoiceNumber: string | null;
    issueDate: string | null;
    dueDate: string | null;
    amount: number | null;
    vat: number | null;
    tax: number | null;
    currency: string | null;
    note: string | null;
    lineItems: Array<{
      name: string;
      quantity?: number;
      price?: number;
      unit?: string;
      taxRate?: number;
    }>;
  };
  customer: {
    name: string;
    email: string;
    countryCode: string | null;
    vatNumber: string | null;
    peppolId: string | null;
    registrationNumber: string | null;
    legalForm: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    zip: string | null;
    country: string | null;
  };
  team: {
    name: string | null;
    countryCode: string | null;
    taxId: string | null;
    peppolId: string | null;
    registrationNumber: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    zip: string | null;
  };
}
