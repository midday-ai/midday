import { format } from "date-fns";
import type { NachaEntryInput, NachaFileInput, TransactionCode } from "./types";
import { TRANSACTION_CODES } from "./types";

/**
 * Build a NACHA-format ACH file string.
 * Each record is exactly 94 characters. File is padded to a multiple of 10 records (blocking factor).
 */
export function buildNachaFile(input: NachaFileInput): string {
  const lines: string[] = [];
  const now = new Date();
  const secCode = input.secCode ?? "CCD";

  // 1. File Header Record (Record Type 1)
  lines.push(buildFileHeader(input, now));

  // 2. Batch Header Record (Record Type 5)
  const batchNumber = 1;
  lines.push(buildBatchHeader(input, batchNumber, secCode));

  // 3. Entry Detail Records (Record Type 6) + optional Addenda (Record Type 7)
  let entryHash = 0;
  let totalDebit = 0;
  let totalCredit = 0;
  let entryAddendaCount = 0;
  const originatorRoutingPrefix = input.originatorRouting.slice(0, 8);

  for (let i = 0; i < input.entries.length; i++) {
    const entry = input.entries[i]!;
    const txCode = entry.transactionCode ?? TRANSACTION_CODES.CHECKING_DEBIT;
    const traceNumber = `${originatorRoutingPrefix}${padLeft(String(i + 1), 7, "0")}`;
    const hasAddenda = !!entry.addenda;

    lines.push(
      buildEntryDetail(entry, txCode, traceNumber, hasAddenda),
    );
    entryAddendaCount++;

    // Accumulate hash from first 8 digits of receiving routing
    const rdfi = entry.receiverRouting.slice(0, 8);
    entryHash += Number(rdfi);

    // Accumulate amounts
    const amountCents = Math.round(entry.amount * 100);
    if (isDebit(txCode)) {
      totalDebit += amountCents;
    } else {
      totalCredit += amountCents;
    }

    // Addenda record
    if (hasAddenda) {
      lines.push(
        buildAddenda(entry.addenda!, i + 1, traceNumber.slice(-7)),
      );
      entryAddendaCount++;
    }
  }

  // Truncate hash to 10 digits
  entryHash = entryHash % 10_000_000_000;

  // 4. Batch Control Record (Record Type 8)
  lines.push(
    buildBatchControl(
      input,
      batchNumber,
      entryAddendaCount,
      entryHash,
      totalDebit,
      totalCredit,
    ),
  );

  // 5. File Control Record (Record Type 9)
  const totalEntryAddenda = entryAddendaCount;
  const batchCount = 1;
  lines.push(
    buildFileControl(
      batchCount,
      totalEntryAddenda,
      entryHash,
      totalDebit,
      totalCredit,
    ),
  );

  // 6. Pad to multiple of 10 lines (blocking factor)
  while (lines.length % 10 !== 0) {
    lines.push("9".repeat(94));
  }

  return lines.join("\n");
}

function buildFileHeader(input: NachaFileInput, now: Date): string {
  return [
    "1", // Record Type
    "01", // Priority Code
    padRight(` ${input.destinationRouting}`, 10), // Immediate Destination (leading space)
    padRight(input.companyId, 10), // Immediate Origin
    format(now, "yyMMdd"), // File Creation Date
    format(now, "HHmm"), // File Creation Time
    "A", // File ID Modifier
    "094", // Record Size
    "10", // Blocking Factor
    "1", // Format Code
    padRight(input.destinationBankName, 23), // Immediate Destination Name
    padRight(input.originatorName, 23), // Immediate Origin Name
    padRight("", 8), // Reference Code
  ].join("");
}

function buildBatchHeader(
  input: NachaFileInput,
  batchNumber: number,
  secCode: string,
): string {
  const effectiveDateFormatted = input.effectiveDate.replace(/-/g, "").slice(2); // YYMMDD

  return [
    "5", // Record Type
    "200", // Service Class Code (mixed debits/credits)
    padRight(input.originatorName, 16), // Company Name
    padRight("", 20), // Company Discretionary Data
    padRight(input.companyId, 10), // Company Identification
    padRight(secCode, 3), // SEC Code
    padRight(input.batchDescription, 10), // Company Entry Description
    padRight("", 6), // Company Descriptive Date
    effectiveDateFormatted, // Effective Entry Date
    padRight("", 3), // Settlement Date (ACH operator)
    "1", // Originator Status Code
    padRight(input.originatorRouting.slice(0, 8), 8), // Originating DFI ID
    padLeft(String(batchNumber), 7, "0"), // Batch Number
  ].join("");
}

function buildEntryDetail(
  entry: NachaEntryInput,
  txCode: TransactionCode,
  traceNumber: string,
  hasAddenda: boolean,
): string {
  const amountCents = Math.round(entry.amount * 100);
  const checkDigit = entry.receiverRouting[8] ?? "0";

  return [
    "6", // Record Type
    txCode, // Transaction Code
    entry.receiverRouting.slice(0, 8), // Receiving DFI Identification
    checkDigit, // Check Digit
    padRight(entry.receiverAccount, 17), // DFI Account Number
    padLeft(String(amountCents), 10, "0"), // Amount (in cents)
    padRight(entry.individualId, 15), // Individual Identification Number
    padRight(entry.receiverName, 22), // Individual Name
    padRight("", 2), // Discretionary Data
    hasAddenda ? "1" : "0", // Addenda Record Indicator
    traceNumber, // Trace Number
  ].join("");
}

function buildAddenda(
  text: string,
  sequenceNumber: number,
  entryDetailSeq: string,
): string {
  return [
    "7", // Record Type
    "05", // Addenda Type Code
    padRight(text, 80), // Payment Related Information
    padLeft(String(sequenceNumber), 4, "0"), // Addenda Sequence Number
    padLeft(entryDetailSeq, 7, "0"), // Entry Detail Sequence Number
    " ", // pad to 94
  ].join("");
}

function buildBatchControl(
  input: NachaFileInput,
  batchNumber: number,
  entryAddendaCount: number,
  entryHash: number,
  totalDebit: number,
  totalCredit: number,
): string {
  return [
    "8", // Record Type
    "200", // Service Class Code
    padLeft(String(entryAddendaCount), 6, "0"), // Entry/Addenda Count
    padLeft(String(entryHash), 10, "0"), // Entry Hash
    padLeft(String(totalDebit), 12, "0"), // Total Debit
    padLeft(String(totalCredit), 12, "0"), // Total Credit
    padRight(input.companyId, 10), // Company Identification
    padRight("", 19), // Message Auth Code + Reserved
    padRight(input.originatorRouting.slice(0, 8), 8), // Originating DFI
    padLeft(String(batchNumber), 7, "0"), // Batch Number
  ].join("");
}

function buildFileControl(
  batchCount: number,
  entryAddendaCount: number,
  entryHash: number,
  totalDebit: number,
  totalCredit: number,
): string {
  const blockCount = Math.ceil((entryAddendaCount + 4) / 10); // rough estimate, adjusted by padding

  return [
    "9", // Record Type
    padLeft(String(batchCount), 6, "0"), // Batch Count
    padLeft(String(blockCount), 6, "0"), // Block Count
    padLeft(String(entryAddendaCount), 8, "0"), // Entry/Addenda Count
    padLeft(String(entryHash), 10, "0"), // Entry Hash
    padLeft(String(totalDebit), 12, "0"), // Total Debit
    padLeft(String(totalCredit), 12, "0"), // Total Credit
    padRight("", 39), // Reserved
  ].join("");
}

// Helpers
function padRight(str: string, len: number, fill = " "): string {
  return str.slice(0, len).padEnd(len, fill);
}

function padLeft(str: string, len: number, fill = " "): string {
  return str.slice(0, len).padStart(len, fill);
}

function isDebit(code: TransactionCode): boolean {
  return code === "27" || code === "37" || code === "28";
}
