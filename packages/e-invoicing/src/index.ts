/**
 * E-Invoicing Package
 *
 * Provides Peppol e-invoicing support via providers like Storecove.
 *
 * @example
 * ```typescript
 * import { StorecoveProvider, invoiceToEInvoiceDocument } from "@midday/e-invoicing";
 *
 * const provider = new StorecoveProvider({ apiKey: "...", environment: "production" });
 * const document = invoiceToEInvoiceDocument(invoice, seller, buyer);
 * const result = await provider.sendInvoice(document);
 * ```
 */

// Types
export {
  type PeppolParticipantId,
  type EInvoiceStatus,
  type EInvoiceDocumentType,
  type TaxCategoryCode,
  type EInvoiceLineItem,
  type EInvoiceParty,
  type PaymentMeansCode,
  type EInvoicePayment,
  type EInvoiceDocument,
  type SendEInvoiceResult,
  type EInvoiceDeliveryStatus,
  type EInvoiceWebhookEvent,
  type EInvoiceProviderConfig,
  type EInvoiceProvider,
  type EInvoiceErrorType,
  type EInvoiceError,
  EInvoiceOperationError,
  parsePeppolId,
  formatPeppolId,
} from "./types";

// UBL generation
export { generateUBLInvoice, invoiceToEInvoiceDocument } from "./ubl";

// Providers
export { StorecoveProvider } from "./providers/storecove";
