export type AccountType =
  | "depository"
  | "credit"
  | "other_asset"
  | "loan"
  | "other_liability";

/**
 * Account types that represent liquid cash or cash-equivalents.
 * Used for: Runway, Net Position (cash side), Balance Sheet (assets)
 */
export const CASH_ACCOUNT_TYPES = ["depository", "other_asset"] as const;

/**
 * Account types that represent debt/liabilities.
 * Used for: Net Position (debt side), Balance Sheet (liabilities)
 */
export const DEBT_ACCOUNT_TYPES = ["credit", "loan"] as const;

/**
 * Credit card account type.
 * Balances may be positive (Plaid, Teller) or negative (GoCardless, EnableBanking).
 * Always use Math.abs() when calculating debt totals.
 */
export const CREDIT_ACCOUNT_TYPE = "credit" as const;

/**
 * Loan account type (business loans, lines of credit).
 */
export const LOAN_ACCOUNT_TYPE = "loan" as const;

export function getType(type: string): AccountType {
  switch (type) {
    case "depository":
      return "depository";
    case "credit":
      return "credit";
    case "loan":
      return "loan";
    default:
      return "other_asset";
  }
}
