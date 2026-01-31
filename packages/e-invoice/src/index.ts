/**
 * @midday/e-invoice
 *
 * E-Invoice / Peppol integration via DDD Invoices API
 * https://app.dddinvoices.com/documentation
 */

// Client
export {
  createDDDClient,
  sendViaPeppol,
  PEPPOL_STEPS,
  DDDError,
  type DDDClient,
  type DDDClientConfig,
  type DDDSaveOptions,
} from "./client";

// Registration
export {
  registerTeamWithDDD,
  type TeamRegistrationData,
} from "./registration";

// Transform utilities
export {
  transformToDDDInvoice,
  validateForPeppol,
  validatePeppolId,
  canSendEInvoice,
  PEPPOL_SCHEMES,
  type PeppolIdValidation,
  type PeppolScheme,
} from "./transform";

// Types
export type {
  DDDInvoice,
  DDDInvoiceItem,
  DDDPayment,
  DDDResponse,
  DDDSaveResult,
  DDDStep,
  EInvoiceStatus,
  LegalForm,
  BuyerTypeCode,
  InvoiceTypeCode,
  MiddayInvoiceData,
  ReturnDocType,
  UnitCode,
} from "./types";
