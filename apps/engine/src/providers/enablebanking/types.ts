import type { Providers } from "../types";

export interface EnableBankingEnvs {
  ENABLEBANKING_APPLICATION_ID: string;
  ENABLE_BANKING_KEY: string;
}

export interface EnableBankingProviderParams {
  envs: EnableBankingEnvs;
}

// API Response Types
export interface EnableBankingAspsp {
  id: string;
  name: string;
  bic: string;
  country: string;
  logo_url?: string;
  transaction_total_days?: number;
  supported_features?: string[];
}

export interface GetAspspsResponse {
  aspsps: EnableBankingAspsp[];
}

export interface EnableBankingAccount {
  uid: string;
  account_id: {
    iban?: string;
    bban?: string;
    upic?: string;
    pan?: string;
    masked_pan?: string;
    msisdn?: string;
    bic?: string;
    account_number?: string;
  };
  name?: string;
  product_name?: string;
  currency: string;
  account_type?: string;
  status?: string;
  usage?: string;
}

export interface GetSessionResponse {
  session_id: string;
  accounts: EnableBankingAccount[];
}

export interface EnableBankingBalance {
  balance_amount: {
    amount: string;
    currency: string;
  };
  balance_type?: string;
  reference_date?: string;
  last_change_date_time?: string;
  credit_limit_included?: boolean;
}

export interface GetBalancesResponse {
  balances: EnableBankingBalance[];
}

export interface EnableBankingTransaction {
  entry_reference?: string;
  transaction_id?: string;
  transaction_amount: {
    amount: string;
    currency: string;
  };
  creditor_name?: string;
  debtor_name?: string;
  remittance_information_unstructured?: string;
  booking_date?: string;
  value_date?: string;
  bank_transaction_code?: string;
  status?: string;
}

export interface GetTransactionsResponse {
  transactions: EnableBankingTransaction[];
  continuation_key?: string;
}

// Transform Functions
export function transformInstitution(aspsp: EnableBankingAspsp) {
  return {
    id: `${aspsp.country}-${aspsp.name}`,
    name: aspsp.name,
    logo: aspsp.logo_url ?? null,
    provider: "enablebanking" as Providers,
  };
}

export function transformAccount(account: EnableBankingAccount) {
  return {
    id: account.uid,
    name: account.name ?? account.product_name ?? "Account",
    iban: account.account_id.iban ?? null,
    currency: account.currency,
    type: account.account_type ?? "UNKNOWN",
    provider: "enablebanking" as Providers,
  };
}

export function transformBalance(balance: EnableBankingBalance) {
  return {
    amount: Number(balance.balance_amount.amount),
    currency: balance.balance_amount.currency,
  };
}

export function transformTransaction(transaction: EnableBankingTransaction) {
  return {
    id:
      transaction.entry_reference ??
      transaction.transaction_id ??
      String(Math.random()),
    amount: Number(transaction.transaction_amount.amount),
    currency: transaction.transaction_amount.currency,
    description: transaction.remittance_information_unstructured,
    bookingDate: transaction.booking_date,
    valueDate: transaction.value_date,
    status: transaction.status ?? "posted",
    provider: "enablebanking" as Providers,
  };
}

// Error Types
export interface EnableBankingError {
  error: string;
  error_description?: string;
  status: number;
}

export function isEnableBankingError(
  error: unknown,
): error is EnableBankingError {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    "status" in error
  );
}
