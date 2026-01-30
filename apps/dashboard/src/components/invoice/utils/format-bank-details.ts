import type { BankAccountWithPaymentInfo } from "@midday/db/queries";

/**
 * Format IBAN with spaces every 4 characters for readability
 * e.g., DE89370400440532013000 → DE89 3704 0044 0532 0130 00
 */
function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Format UK sort code with dashes
 * e.g., 123456 → 12-34-56
 */
function formatSortCode(sortCode: string): string {
  // Remove any existing dashes or spaces
  const clean = sortCode.replace(/[-\s]/g, "");
  if (clean.length === 6) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}`;
  }
  return sortCode;
}

/**
 * Mask account number showing only last 4 digits
 * e.g., 12345678 → ****5678
 */
function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }
  return `****${accountNumber.slice(-4)}`;
}

/**
 * Format bank account payment details for insertion into invoice
 * Returns a formatted string based on the type of account (EU/US/UK)
 */
export function formatBankPaymentDetails(
  account: BankAccountWithPaymentInfo,
): string {
  const lines: string[] = [];

  // EU/International format (IBAN-based)
  if (account.iban) {
    lines.push(`IBAN: ${formatIban(account.iban)}`);
    if (account.bic) {
      lines.push(`BIC: ${account.bic}`);
    }
  }
  // UK format (sort code + account number)
  else if (account.sortCode && account.accountNumber) {
    lines.push(`Sort Code: ${formatSortCode(account.sortCode)}`);
    lines.push(`Account: ${account.accountNumber}`);
  }
  // US format (routing + account number)
  else if (account.routingNumber && account.accountNumber) {
    lines.push(`Account: ${account.accountNumber}`);
    lines.push(`Routing: ${account.routingNumber}`);
    // Include wire routing only if different from ACH routing
    if (
      account.wireRoutingNumber &&
      account.wireRoutingNumber !== account.routingNumber
    ) {
      lines.push(`Wire Routing: ${account.wireRoutingNumber}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format bank account for display in the slash command menu
 * Returns a shorter preview string
 */
export function formatBankPreview(account: BankAccountWithPaymentInfo): string {
  if (account.iban) {
    // Show masked IBAN (first 4 + last 4)
    const iban = account.iban;
    return `IBAN: ${iban.slice(0, 4)}...${iban.slice(-4)}`;
  }
  if (account.accountNumber) {
    return `Account: ${maskAccountNumber(account.accountNumber)}`;
  }
  return "";
}
