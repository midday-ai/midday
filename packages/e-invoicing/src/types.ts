/**
 * E-Invoicing Types
 *
 * Types for Peppol e-invoicing integration via providers like Storecove.
 */

/**
 * Peppol Participant Identifier
 * Format: scheme:identifier (e.g., "0007:5567890123" for Swedish org number)
 *
 * Common schemes:
 * - 0007: Swedish organization number (Organisationsnummer)
 * - 0088: EAN Location Code (GLN)
 * - 0184: Danish CVR number
 * - 0192: Norwegian organization number
 * - 9930: Dutch KvK number
 */
export interface PeppolParticipantId {
  scheme: string;
  identifier: string;
}

/**
 * Parse a Peppol ID string (e.g., "0007:5567890123") into its components
 */
export function parsePeppolId(peppolId: string): PeppolParticipantId | null {
  const parts = peppolId.split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return {
    scheme: parts[0],
    identifier: parts[1],
  };
}

/**
 * Format a Peppol ID to string
 */
export function formatPeppolId(id: PeppolParticipantId): string {
  return `${id.scheme}:${id.identifier}`;
}

/**
 * E-Invoice delivery status
 */
export type EInvoiceStatus =
  | "pending" // Queued for sending
  | "sent" // Sent to provider
  | "delivered" // Confirmed delivered to recipient
  | "read" // Recipient has opened/read the invoice (if supported)
  | "failed"; // Delivery failed

/**
 * E-Invoice document types supported by Peppol BIS 3.0
 */
export type EInvoiceDocumentType =
  | "invoice" // Standard invoice
  | "credit_note"; // Credit note / refund

/**
 * Tax category codes (UNCL5305)
 */
export type TaxCategoryCode =
  | "S" // Standard rate
  | "Z" // Zero rated
  | "E" // Exempt from tax
  | "AE" // Reverse charge
  | "K" // Intra-community supply
  | "G" // Free export item, tax not charged
  | "O" // Services outside scope of tax
  | "L" // Canary Islands general indirect tax
  | "M"; // Tax for production, services and importation in Ceuta and Melilla

/**
 * Invoice line item for UBL generation
 */
export interface EInvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitCode: string; // UN/ECE Recommendation 20 (e.g., "EA" for each, "HUR" for hour)
  unitPrice: number;
  lineExtensionAmount: number; // quantity * unitPrice
  taxCategoryCode: TaxCategoryCode;
  taxPercent: number;
}

/**
 * Party information for sender/recipient
 */
export interface EInvoiceParty {
  peppolId: PeppolParticipantId;
  name: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  countryCode: string; // ISO 3166-1 alpha-2 (e.g., "SE", "NO", "DK")
  vatNumber?: string; // VAT registration number
  companyId?: string; // Company registration number
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * Payment means codes (UNCL4461)
 */
export type PaymentMeansCode =
  | "1" // Instrument not defined
  | "10" // In cash
  | "20" // Cheque
  | "30" // Credit transfer
  | "31" // Debit transfer
  | "42" // Payment to bank account
  | "48" // Bank card
  | "49" // Direct debit
  | "57" // Standing agreement
  | "58"; // SEPA credit transfer

/**
 * Payment information
 */
export interface EInvoicePayment {
  meansCode: PaymentMeansCode;
  dueDate?: string; // ISO 8601 date
  paymentId?: string; // Payment reference (e.g., OCR number)
  iban?: string;
  bic?: string;
  accountName?: string;
}

/**
 * Complete e-invoice document for UBL generation
 */
export interface EInvoiceDocument {
  // Document identification
  id: string; // Invoice number
  issueDate: string; // ISO 8601 date
  dueDate?: string; // ISO 8601 date
  documentType: EInvoiceDocumentType;
  documentCurrencyCode: string; // ISO 4217 (e.g., "SEK", "EUR")

  // Parties
  seller: EInvoiceParty;
  buyer: EInvoiceParty;

  // Line items
  lineItems: EInvoiceLineItem[];

  // Totals
  lineExtensionAmount: number; // Sum of line amounts (excluding tax)
  taxExclusiveAmount: number; // Total excluding tax
  taxInclusiveAmount: number; // Total including tax
  payableAmount: number; // Amount to be paid

  // Tax breakdown
  taxTotal: {
    taxAmount: number;
    taxSubtotals: Array<{
      taxableAmount: number;
      taxAmount: number;
      taxCategoryCode: TaxCategoryCode;
      taxPercent: number;
    }>;
  };

  // Payment
  payment?: EInvoicePayment;

  // Optional fields
  note?: string;
  buyerReference?: string; // Customer's reference/PO number
  orderReference?: string; // Original order reference
}

/**
 * Result of sending an e-invoice
 */
export interface SendEInvoiceResult {
  success: boolean;
  documentId?: string; // Provider's document ID for tracking
  error?: string;
  errorCode?: string;
}

/**
 * Delivery status from provider
 */
export interface EInvoiceDeliveryStatus {
  documentId: string;
  status: EInvoiceStatus;
  timestamp: string;
  error?: string;
  rawStatus?: string; // Provider's original status string
}

/**
 * Webhook event for incoming status updates
 */
export interface EInvoiceWebhookEvent {
  type: "delivery_status" | "incoming_invoice";
  documentId: string;
  status?: EInvoiceStatus;
  timestamp: string;
  rawPayload: unknown;
}

/**
 * Provider configuration
 */
export interface EInvoiceProviderConfig {
  apiKey: string;
  environment: "production" | "sandbox";
  // Provider-specific options
  options?: Record<string, unknown>;
}

/**
 * E-Invoice provider interface
 * Implemented by each provider (Storecove, Pagero, etc.)
 */
export interface EInvoiceProvider {
  readonly name: string;

  /**
   * Check if the provider connection is valid
   */
  checkConnection(): Promise<{ connected: boolean; error?: string }>;

  /**
   * Send an e-invoice to a recipient
   */
  sendInvoice(document: EInvoiceDocument): Promise<SendEInvoiceResult>;

  /**
   * Get the delivery status of a sent invoice
   */
  getDeliveryStatus(documentId: string): Promise<EInvoiceDeliveryStatus>;

  /**
   * Validate a Peppol ID exists in the network
   */
  validatePeppolId?(peppolId: PeppolParticipantId): Promise<{
    valid: boolean;
    name?: string;
    error?: string;
  }>;
}

/**
 * Error types for e-invoicing operations
 */
export type EInvoiceErrorType =
  | "auth_failed" // API authentication failed
  | "validation" // Document validation failed
  | "recipient_not_found" // Peppol ID not registered
  | "network_error" // Network/connection issue
  | "provider_error" // Provider returned an error
  | "rate_limit" // Rate limited
  | "unknown"; // Unknown error

/**
 * Structured error for e-invoicing operations
 */
export interface EInvoiceError {
  type: EInvoiceErrorType;
  message: string;
  code?: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

/**
 * E-invoice operation error class
 */
export class EInvoiceOperationError extends Error {
  readonly type: EInvoiceErrorType;
  readonly code?: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(error: EInvoiceError) {
    super(error.message);
    this.name = "EInvoiceOperationError";
    this.type = error.type;
    this.code = error.code;
    this.retryable = error.retryable;
    this.details = error.details;
  }
}

