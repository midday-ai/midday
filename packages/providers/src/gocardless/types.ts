export type Transaction = {
  transactionAmount: { amount: string; currency: string };
  currencyExchange?: {
    exchangeRate: string;
    targetCurrency: string;
    sourceCurrency: string;
  }[];
  remittanceInformationStructured?: string;
  remittanceInformationStructuredArray?: string[];
  remittanceInformationUnstructured?: string;
  remittanceInformationUnstructuredArray?: string[];
  proprietaryBankTransactionCode?: string;
  entryReference?: string;
  transactionId?: string;
  internalTransactionId: string;
  bookingDate: string;
  valueDate?: string;
  additionalInformation?: string;
  creditorName?: string;
  creditorAccount?: { iban?: string };
  debtorName?: string;
  debtorAccount?: { iban?: string };
  balanceAfterTransaction?: {
    balanceAmount?: {
      amount: string;
    };
  };
};

export type Bank = {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  logo: string;
  countries: string[];
};

export type GetRefreshTokenResponse = {
  access: string;
  access_expires: number;
  refresh: string;
  refresh_expires: number;
};

export type GetAccessTokenResponse = {
  access: string;
  access_expires: number;
  refresh: string;
  refresh_expires: number;
};

export type GetBanksResponse = Bank[];

export type PostRequisitionsRequest = {
  institutionId: string;
  agreement: string;
  redirect: string;
};

export type PostRequisitionsResponse = {
  id: string;
  created: string;
  redirect: string;
  status: string;
  institution_id: string;
  agreement: string;
  reference: string;
  accounts: string[];
  link: string;
  ssn: string | null;
  account_selection: boolean;
  redirect_immediate: boolean;
};

export type PostCreateAgreementResponse = {
  id: string;
  created: string;
  institution_id: string;
  max_historical_days: number;
  access_valid_for_days: number;
  access_scope: string[];
  accepted: boolean;
};

export type GetAccountResponse = {
  id: string;
  created: string;
  last_accessed: string;
  iban?: string;
  institution_id: string;
  status: string;
  owner_name?: string;
};

export type Account = {
  resourceId: string;
  iban: string;
  currency: string;
  ownerName: string;
  name: string;
  product: string;
  cashAccountType: string;
};

export type AccountDetails = {
  account: Account;
};

export type GetAccountDetailsResponse = GetAccountResponse & AccountDetails;

export type GetAccountsRequest = {
  id: string;
  countryCode: string;
};

export type Requestion = {
  id: string;
  created: string;
  redirect: string;
  status: string;
  institution_id: string;
  agreement: string;
  reference: string;
  accounts: string[];
  user_language: string;
  link: string;
  ssn: string;
  account_selection: boolean;
  redirect_immediate: boolean;
};

export type GetRequisitionResponse = Requestion;

export type GetRequisitionsResponse = {
  count: number;
  next: string;
  previous: string;
  result: Requestion[];
};

export type DeleteRequistionResponse = {
  summary: string;
  detail: string;
  status_code: number;
};

export type GetAccountsResponse = {
  id: string;
  created: string;
  last_accessed: string;
  iban?: string;
  institution_id: string;
  status: string;
  owner_name?: string;
  account: Account;
  bank?: Bank;
}[];

export type GetTransactionsRequest = {
  accountId: string;
  latest?: boolean;
};

export type GetTransactionsResponse = {
  transactions: {
    booked: Transaction[];
    posted: Transaction[];
  };
};

export type TransactionDescription = {
  transaction: Transaction;
  name?: string;
};

export type TransformTransaction = {
  transaction: Transaction;
  teamId: string;
  bankAccountId: string;
};

export type TransformAccount = GetAccountsResponse[0];

export type TransformAccountName = {
  name: string;
  bank?: Bank;
  product: string;
};
