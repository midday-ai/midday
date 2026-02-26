/**
 * NACHA ACH file format types.
 * Spec: https://www.nacha.org/system/files/2023-01/2023_ACH_Rules.pdf
 */

/** Standard Entry Class (SEC) codes */
export type SecCode = "PPD" | "CCD" | "WEB" | "TEL";

/** Transaction codes */
export const TRANSACTION_CODES = {
  /** Checking account debit */
  CHECKING_DEBIT: "27",
  /** Checking account credit */
  CHECKING_CREDIT: "22",
  /** Savings account debit */
  SAVINGS_DEBIT: "37",
  /** Savings account credit */
  SAVINGS_CREDIT: "32",
  /** Checking account prenote debit */
  CHECKING_PRENOTE_DEBIT: "28",
  /** Checking account prenote credit */
  CHECKING_PRENOTE_CREDIT: "23",
} as const;

export type TransactionCode =
  (typeof TRANSACTION_CODES)[keyof typeof TRANSACTION_CODES];

export type FileHeaderRecord = {
  /** Always "1" */
  recordType: "1";
  /** "01" for priority code */
  priorityCode: "01";
  /** Space + 9-digit routing (with leading space) */
  immediateDestination: string;
  /** 10-digit company ID (1+EIN or 1+DUNS) */
  immediateOrigin: string;
  /** YYMMDD */
  fileCreationDate: string;
  /** HHMM */
  fileCreationTime: string;
  /** A-Z, 0-9 — uniqueness modifier */
  fileIdModifier: string;
  /** Always "094" — record size */
  recordSize: "094";
  /** Always "10" — blocking factor */
  blockingFactor: "10";
  /** Always "1" */
  formatCode: "1";
  /** Destination bank name (23 chars) */
  immediateDestinationName: string;
  /** Originator company name (23 chars) */
  immediateOriginName: string;
  /** 8-char reference code */
  referenceCode: string;
};

export type BatchHeaderRecord = {
  recordType: "5";
  serviceClassCode: "200" | "220" | "225";
  companyName: string;
  companyDiscretionaryData: string;
  companyIdentification: string;
  standardEntryClassCode: SecCode;
  companyEntryDescription: string;
  companyDescriptiveDate: string;
  effectiveEntryDate: string;
  settlementDate: string;
  originatorStatusCode: "1";
  originatingDfiIdentification: string;
  batchNumber: number;
};

export type EntryDetailRecord = {
  recordType: "6";
  transactionCode: TransactionCode;
  receivingDfiIdentification: string;
  checkDigit: string;
  dfiAccountNumber: string;
  amount: number;
  individualIdentificationNumber: string;
  individualName: string;
  discretionaryData: string;
  addendaRecordIndicator: "0" | "1";
  traceNumber: string;
};

export type AddendaRecord = {
  recordType: "7";
  addendaTypeCode: "05";
  paymentRelatedInformation: string;
  addendaSequenceNumber: number;
  entryDetailSequenceNumber: string;
};

export type BatchControlRecord = {
  recordType: "8";
  serviceClassCode: "200" | "220" | "225";
  entryAddendaCount: number;
  entryHash: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  companyIdentification: string;
  messageAuthenticationCode: string;
  reserved: string;
  originatingDfiIdentification: string;
  batchNumber: number;
};

export type FileControlRecord = {
  recordType: "9";
  batchCount: number;
  blockCount: number;
  entryAddendaCount: number;
  entryHash: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  reserved: string;
};

/** Input for building a NACHA file */
export type NachaFileInput = {
  /** Originator's company name */
  originatorName: string;
  /** Originator's routing number (9 digits) */
  originatorRouting: string;
  /** Originator's account number */
  originatorAccount: string;
  /** Originator's company ID (EIN or DUNS) */
  companyId: string;
  /** Destination bank name */
  destinationBankName: string;
  /** Destination routing number (9 digits) */
  destinationRouting: string;
  /** Effective date (YYYY-MM-DD) */
  effectiveDate: string;
  /** Batch description (max 10 chars, e.g., "PAYMENT") */
  batchDescription: string;
  /** SEC code (default: CCD for business-to-business) */
  secCode?: SecCode;
  /** Individual entries */
  entries: NachaEntryInput[];
};

export type NachaEntryInput = {
  /** Receiver's name (max 22 chars) */
  receiverName: string;
  /** Receiver's routing number (9 digits) */
  receiverRouting: string;
  /** Receiver's account number */
  receiverAccount: string;
  /** Amount in dollars (positive number) */
  amount: number;
  /** Transaction code (default: 27 = checking debit) */
  transactionCode?: TransactionCode;
  /** Individual ID (e.g., deal code, max 15 chars) */
  individualId: string;
  /** Optional addenda text */
  addenda?: string;
};

export type NachaValidationError = {
  field: string;
  message: string;
  severity: "error" | "warning";
};
