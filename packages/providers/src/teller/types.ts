// Thank you: https://github.com/maybe-finance/maybe-archive/blob/04bf3d135bdbb1fdaa2dd669dca4738c797cc382/libs/teller-api/src/types/accounts.ts

import type { AccountType } from "@midday/engine/src/utils/account";

export type DetailCategory =
  | "accommodation"
  | "advertising"
  | "bar"
  | "charity"
  | "clothing"
  | "dining"
  | "education"
  | "electronics"
  | "entertainment"
  | "fuel"
  | "general"
  | "groceries"
  | "health"
  | "home"
  | "income"
  | "insurance"
  | "investment"
  | "loan"
  | "office"
  | "phone"
  | "service"
  | "shopping"
  | "software"
  | "sport"
  | "tax"
  | "transport"
  | "transportation"
  | "utilities";

type DetailProcessingStatus = "pending" | "complete";

export type Transaction = {
  details: {
    category?: DetailCategory;
    processing_status: DetailProcessingStatus;
    counterparty?: {
      name?: string;
      type?: "organization" | "person";
    };
  };
  running_balance: string | null;
  description: string;
  id: string;
  date: string;
  account_id: string;
  links: {
    self: string;
    account: string;
  };
  amount: string;
  status: "posted" | "pending";
  type: string;
};

export type GetTransactionsResponse = Transaction[];
export type GetTransactionResponse = Transaction;

export interface GetTransactionsRequest extends AuthenticatedRequest {
  accountId: string;
  latest?: boolean;
  count?: number;
}

export type AuthenticationResponse = {
  token: string;
};

export type AuthenticatedRequest = {
  accessToken: string;
};

type Institution = {
  name: string;
  id: string;
};

interface BaseAccount {
  enrollment_id: string;
  links: {
    balances: string;
    self: string;
    transactions: string;
  };
  institution: Institution;
  name: string;
  currency: string;
  id: string;
  last_four: string;
  status: AccountStatus;
}

export type CreditSubtype = "credit_card";

export type AccountStatus = "open" | "closed";

export type DepositorySubtypes =
  | "checking"
  | "savings"
  | "money_market"
  | "certificate_of_deposit"
  | "treasury"
  | "sweep";

interface DepositoryAccount extends BaseAccount {
  type: "depository";
  subtype: DepositorySubtypes;
}

interface CreditAccount extends BaseAccount {
  type: "credit";
  subtype: CreditSubtype;
}

export type Account = DepositoryAccount | CreditAccount;

export type GetAccountsResponse = Account[];

export type TransformTransaction = {
  transaction: Transaction;
  teamId: string;
  bankAccountId: string;
  accountType: AccountType;
};

export type TransformAccount = Account;

export interface GetAccountBalanceRequest extends AuthenticatedRequest {
  accountId: string;
}

export type GetAccountBalanceResponse = {
  currency: string;
  amount: number;
};

export type TransformAccountBalance = GetAccountBalanceResponse;
