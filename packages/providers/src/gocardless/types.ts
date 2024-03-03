export type GoCardLessBuildLinkOptions = {
  institutionId: string;
  agreement: string;
  redirect: string;
};

export type GoCardLessGetAccountsOptions = {
  accountId: string;
  countryCode?: string;
};

export type GoCardLessGetTransactionsParams = {
  accountId: string;
  dateFrom?: string;
  dateTo?: string;
};

export type GoCardLessTransaction = {
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

export type GoCardLessRequisition = {
  id: string;
  redirect: string;
  link: string;
};

export type GoCardLessAccount = {
  id: string;
  ownerName?: string;
  ownerAddressUnstructured?: string;
  name?: string;
  displayName?: string;
  details?: string;
  status?: string;
  usage?: string;
  iban?: string;
};

export type GoCardLessBank = {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  logo: string;
  countries: string[];
};

export type GoCardLessTranformTransactionDescriptionParams = {
  transaction: GoCardLessTransaction;
  name?: string;
};

export type GoCardLessTransformTransactionParams = {
  transaction: GoCardLessTransaction;
  accountId: string;
  teamId: string;
};
