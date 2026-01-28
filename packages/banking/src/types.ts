import type { AccountType } from "./utils/account";

export type Providers = "teller" | "plaid" | "gocardless" | "enablebanking";

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: "posted" | "pending";
  balance: number | null;
  category: string | null;
  counterparty_name: string | null;
  merchant_name: string | null;
  method: string;
  name: string;
  description: string | null;
  currency_rate: number | null;
  currency_source: string | null;
};

export type Institution = {
  id: string;
  name: string;
  logo: string | null;
  provider: Providers;
};

export type Account = {
  id: string;
  name: string;
  currency: string;
  type: AccountType;
  institution: Institution;
  balance: Balance;
  enrollment_id: string | null; // Teller
  resource_id: string | null; // GoCardLess, EnableBanking, Teller (last_four), Plaid (persistent_account_id || mask)
  expires_at: string | null; // EnableBanking & GoCardLess
  // Additional account data for reconnect matching and user display
  iban: string | null; // GoCardless, EnableBanking (EU/UK accounts)
  subtype: string | null; // Teller, Plaid, EnableBanking (checking, savings, credit_card, etc.)
  bic: string | null; // GoCardless, EnableBanking (Bank Identifier Code / SWIFT)
  // US bank account details (Teller, Plaid)
  routing_number: string | null; // ACH routing number
  wire_routing_number: string | null; // Wire routing number (can differ from ACH)
  account_number: string | null; // Full account number (sensitive - should be encrypted when stored)
  sort_code: string | null; // UK BACS sort code
  // Credit account balances
  available_balance: number | null; // Available credit (cards) or available funds (depository)
  credit_limit: number | null; // Credit limit (credit cards only)
};

export type ConnectionStatus = {
  status: "connected" | "disconnected";
};

export type Balance = {
  amount: number;
  currency: string;
};

export type GetTransactionsRequest = {
  accountId: string;
  latest?: boolean;
  accessToken?: string; // Teller & Plaid
  accountType: AccountType;
};

export type GetAccountsRequest = {
  id?: string; // GoCardLess & EnableBanking
  accessToken?: string; // Teller & Plaid
  institutionId?: string; // Plaid
};

export type GetAccountBalanceRequest = {
  accountId: string;
  accessToken?: string; // Teller & Plaid
  accountType?: string; // For correct balance handling (credit cards use current, depository uses available)
};

export type GetAccountBalanceResponse = {
  currency: string;
  amount: number;
  available_balance: number | null;
  credit_limit: number | null;
};

export type DeleteAccountsRequest = {
  accountId?: string; // GoCardLess
  accessToken?: string; // Teller & Plaid
};

export type GetConnectionStatusRequest = {
  id?: string;
  accessToken?: string; // Teller & Plaid
};

export type GetTransactionsResponse = Transaction[];

export type GetAccountsResponse = Account[];

export type GetInstitutionsResponse = {
  id: string;
  name: string;
  logo: string | null;
  provider: Providers;
}[];

export type GetInstitutionsRequest = {
  countryCode?: string;
};

export type HealthCheckResponse = {
  healthy: boolean;
};

export type GetHealthCheckResponse = {
  teller: HealthCheckResponse;
  gocardless: HealthCheckResponse;
  plaid: HealthCheckResponse;
  enablebanking: HealthCheckResponse;
};

export type GetConnectionStatusResponse = ConnectionStatus;

export type DeleteConnectionRequest = {
  id: string; // GoCardLess & EnableBanking
  accessToken?: string; // Teller & Plaid
};
