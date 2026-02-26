import type { NachaEntryInput, NachaFileInput, NachaValidationError } from "./types";

/**
 * Validate an ABA routing number using the checksum algorithm.
 * Routing number must be exactly 9 digits.
 * Checksum: 3*d1 + 7*d2 + 1*d3 + 3*d4 + 7*d5 + 1*d6 + 3*d7 + 7*d8 + 1*d9 ≡ 0 (mod 10)
 */
export function validateRoutingNumber(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false;

  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(routing[i]) * weights[i]!;
  }
  return sum % 10 === 0;
}

/**
 * Validate an entire NACHA file input and return all errors/warnings.
 */
export function validateNachaFile(
  input: NachaFileInput,
): NachaValidationError[] {
  const errors: NachaValidationError[] = [];

  // File-level validation
  if (!input.originatorName || input.originatorName.length === 0) {
    errors.push({
      field: "originatorName",
      message: "Originator name is required",
      severity: "error",
    });
  }
  if (input.originatorName && input.originatorName.length > 23) {
    errors.push({
      field: "originatorName",
      message: "Originator name must be 23 characters or less",
      severity: "error",
    });
  }

  if (!validateRoutingNumber(input.originatorRouting)) {
    errors.push({
      field: "originatorRouting",
      message: "Invalid originator routing number (failed ABA checksum)",
      severity: "error",
    });
  }

  if (!validateRoutingNumber(input.destinationRouting)) {
    errors.push({
      field: "destinationRouting",
      message: "Invalid destination routing number (failed ABA checksum)",
      severity: "error",
    });
  }

  if (!input.companyId || input.companyId.length === 0) {
    errors.push({
      field: "companyId",
      message: "Company ID (EIN/DUNS) is required",
      severity: "error",
    });
  }

  if (input.batchDescription && input.batchDescription.length > 10) {
    errors.push({
      field: "batchDescription",
      message: "Batch description must be 10 characters or less",
      severity: "error",
    });
  }

  // Date validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate)) {
    errors.push({
      field: "effectiveDate",
      message: "Effective date must be in YYYY-MM-DD format",
      severity: "error",
    });
  }

  if (input.entries.length === 0) {
    errors.push({
      field: "entries",
      message: "At least one entry is required",
      severity: "error",
    });
  }

  // Entry-level validation
  for (let i = 0; i < input.entries.length; i++) {
    const entry = input.entries[i]!;
    const prefix = `entries[${i}]`;

    validateEntry(entry, prefix, errors);
  }

  // Total amount warnings
  const totalAmount = input.entries.reduce((sum, e) => sum + e.amount, 0);
  if (totalAmount > 1_000_000) {
    errors.push({
      field: "totalAmount",
      message: `Total batch amount is $${totalAmount.toLocaleString()} — verify this is correct`,
      severity: "warning",
    });
  }

  return errors;
}

function validateEntry(
  entry: NachaEntryInput,
  prefix: string,
  errors: NachaValidationError[],
): void {
  if (!entry.receiverName || entry.receiverName.length === 0) {
    errors.push({
      field: `${prefix}.receiverName`,
      message: "Receiver name is required",
      severity: "error",
    });
  }
  if (entry.receiverName && entry.receiverName.length > 22) {
    errors.push({
      field: `${prefix}.receiverName`,
      message: "Receiver name must be 22 characters or less",
      severity: "error",
    });
  }

  if (!validateRoutingNumber(entry.receiverRouting)) {
    errors.push({
      field: `${prefix}.receiverRouting`,
      message: `Invalid routing number for ${entry.receiverName || "entry"}`,
      severity: "error",
    });
  }

  if (!entry.receiverAccount || entry.receiverAccount.length === 0) {
    errors.push({
      field: `${prefix}.receiverAccount`,
      message: "Receiver account number is required",
      severity: "error",
    });
  }
  if (entry.receiverAccount && entry.receiverAccount.length > 17) {
    errors.push({
      field: `${prefix}.receiverAccount`,
      message: "Account number must be 17 characters or less",
      severity: "error",
    });
  }

  if (entry.amount <= 0) {
    errors.push({
      field: `${prefix}.amount`,
      message: "Amount must be greater than zero",
      severity: "error",
    });
  }
  if (entry.amount > 99_999_999.99) {
    errors.push({
      field: `${prefix}.amount`,
      message: "Amount exceeds maximum ($99,999,999.99)",
      severity: "error",
    });
  }

  if (entry.individualId && entry.individualId.length > 15) {
    errors.push({
      field: `${prefix}.individualId`,
      message: "Individual ID must be 15 characters or less",
      severity: "error",
    });
  }

  if (entry.addenda && entry.addenda.length > 80) {
    errors.push({
      field: `${prefix}.addenda`,
      message: "Addenda text must be 80 characters or less",
      severity: "error",
    });
  }
}
