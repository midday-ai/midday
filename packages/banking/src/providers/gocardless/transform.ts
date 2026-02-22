import { capitalCase } from "change-case";
import { addDays } from "date-fns";
import type {
  Account as BaseAccount,
  Transaction as BaseTransaction,
  ConnectionStatus,
  GetAccountBalanceResponse,
} from "../../types";
import type { AccountType } from "../../utils/account";
import { isValidCurrency } from "../../utils/currency";
import { getFileExtension, getLogoURL } from "../../utils/logo";
import type {
  GetRequisitionResponse,
  Institution,
  Transaction,
  TransactionDescription,
  TransformAccount,
  TransformAccountBalance,
  TransformAccountName,
  TransformInstitution,
} from "./types";

const getAccountType = (cashAccountType?: string): AccountType => {
  switch (cashAccountType) {
    case "CARD":
      return "credit";
    case "LOAN":
      return "loan";
    default:
      return "depository";
  }
};

type MapTransactionCategory = {
  transaction: Transaction;
  accountType: AccountType;
};

export const transformTransactionCategory = ({
  transaction,
  accountType,
}: MapTransactionCategory) => {
  const amount = +transaction.transactionAmount.amount;

  if (amount > 0) {
    if (accountType === "credit") {
      const method = transaction.proprietaryBankTransactionCode;
      if (method === "Transfer" || method === "Payment") {
        return "credit-card-payment";
      }
      return null;
    }
    return "income";
  }

  return null;
};

export const transformTransactionMethod = (type?: string) => {
  switch (type) {
    case "Payment":
    case "Bankgiro payment":
    case "Incoming foreign payment":
      return "payment";
    case "Card purchase":
    case "Card foreign purchase":
      return "card_purchase";
    case "Card ATM":
      return "card_atm";
    case "Transfer":
      return "transfer";
    default:
      return "other";
  }
};

export const transformTransactionName = (transaction: Transaction) => {
  if (transaction?.creditorName) {
    return capitalCase(transaction.creditorName);
  }

  if (transaction?.debtorName) {
    return capitalCase(transaction?.debtorName);
  }

  if (transaction?.additionalInformation) {
    return capitalCase(transaction.additionalInformation);
  }

  if (transaction?.remittanceInformationStructured) {
    return capitalCase(transaction.remittanceInformationStructured);
  }

  if (transaction?.remittanceInformationUnstructured) {
    return capitalCase(transaction.remittanceInformationUnstructured);
  }

  const remittanceInformation =
    transaction?.remittanceInformationUnstructuredArray?.at(0);

  if (remittanceInformation) {
    return capitalCase(remittanceInformation);
  }

  if (transaction.proprietaryBankTransactionCode) {
    return transaction.proprietaryBankTransactionCode;
  }

  return "No information";
};

const transformDescription = ({
  transaction,
  name,
}: TransactionDescription) => {
  if (transaction?.remittanceInformationUnstructuredArray?.length) {
    const text = transaction?.remittanceInformationUnstructuredArray.join(" ");
    const description = capitalCase(text);

    if (description !== name) {
      return description;
    }
  }

  const additionalInformation =
    transaction.additionalInformation &&
    capitalCase(transaction.additionalInformation);

  if (additionalInformation !== name) {
    return additionalInformation;
  }

  return null;
};

const transformCounterpartyName = (transaction: Transaction) => {
  if (transaction?.debtorName) {
    return capitalCase(transaction.debtorName);
  }

  if (transaction?.creditorName) {
    return capitalCase(transaction.creditorName);
  }

  return null;
};

type TransformTransactionPayload = {
  transaction: Transaction;
  accountType: AccountType;
};

export const transformTransaction = ({
  transaction,
  accountType,
}: TransformTransactionPayload): BaseTransaction => {
  const method = transformTransactionMethod(
    transaction?.proprietaryBankTransactionCode,
  );

  let currencyExchange: { rate: number; currency: string } | undefined;

  if (Array.isArray(transaction.currencyExchange)) {
    const rate = +(transaction.currencyExchange.at(0)?.exchangeRate ?? "");

    if (rate) {
      const currency = transaction?.currencyExchange?.at(0)?.sourceCurrency;

      if (currency) {
        currencyExchange = {
          rate,
          currency: currency.toUpperCase(),
        };
      }
    }
  }

  const name = transformTransactionName(transaction);
  const description = transformDescription({ transaction, name }) ?? null;
  const balance = transaction?.balanceAfterTransaction?.balanceAmount?.amount
    ? +transaction.balanceAfterTransaction.balanceAmount.amount
    : null;

  return {
    id: transaction.internalTransactionId,
    date: transaction.bookingDate,
    name,
    method,
    amount: +transaction.transactionAmount.amount,
    currency: transaction.transactionAmount.currency,
    category: transformTransactionCategory({ transaction, accountType }),
    currency_rate: currencyExchange?.rate || null,
    currency_source: currencyExchange?.currency?.toUpperCase() || null,
    balance,
    counterparty_name: transformCounterpartyName(transaction),
    merchant_name: null,
    description,
    status: "posted",
  };
};

const transformAccountName = (account: TransformAccountName) => {
  if (account?.name) {
    return capitalCase(account.name);
  }

  if (account?.product) {
    return account.product;
  }

  if (account?.institution?.name) {
    return `${account.institution.name} (${account.currency.toUpperCase()})`;
  }

  return "No name";
};

const resolveCurrency = (...candidates: (string | undefined)[]): string =>
  candidates.find((c) => c && isValidCurrency(c))?.toUpperCase() || "XXX";

const getAvailableBalance = (
  balances?: TransformAccount["balances"],
  preferredCurrency?: string,
): number | null => {
  if (!balances?.length) return null;

  const matchesCurrency = (b: { balanceAmount: { currency: string } }) =>
    !preferredCurrency ||
    b.balanceAmount.currency.toUpperCase() === preferredCurrency.toUpperCase();

  const interimAvailable =
    balances.find(
      (b) => b.balanceType === "interimAvailable" && matchesCurrency(b),
    ) ?? balances.find((b) => b.balanceType === "interimAvailable");
  if (interimAvailable) {
    return +interimAvailable.balanceAmount.amount;
  }

  const expected =
    balances.find((b) => b.balanceType === "expected" && matchesCurrency(b)) ??
    balances.find((b) => b.balanceType === "expected");
  if (expected) {
    return +expected.balanceAmount.amount;
  }

  return null;
};

export const transformAccount = ({
  id,
  account,
  balance,
  balances,
  institution,
  accessValidForDays,
}: TransformAccount): BaseAccount => {
  const accountType = getAccountType(account.cashAccountType);
  const balanceCurrencies = balances?.map((b) => b.balanceAmount.currency);
  const currency = resolveCurrency(
    account.currency,
    balance?.currency,
    ...(balanceCurrencies ?? []),
  );

  return {
    id,
    type: accountType,
    name: transformAccountName({
      name: account.name,
      product: account.product,
      institution: institution,
      currency,
    }),
    currency,
    enrollment_id: null,
    balance: transformAccountBalance({ balance, balances, accountType }),
    institution: transformInstitution(institution),
    resource_id: account.resourceId,
    expires_at: addDays(new Date(), accessValidForDays ?? 180).toISOString(),
    iban: account.iban || null,
    subtype: null,
    bic: institution.bic || null,
    routing_number: null,
    wire_routing_number: null,
    account_number: null,
    sort_code: null,
    available_balance: getAvailableBalance(balances, currency),
    credit_limit: null,
  };
};

type TransformAccountBalanceParams = {
  balance?: TransformAccountBalance;
  balances?: TransformAccount["balances"];
  accountType?: string;
};

export const transformAccountBalance = ({
  balance,
  balances,
  accountType,
}: TransformAccountBalanceParams): GetAccountBalanceResponse => {
  const rawAmount = +(balance?.amount ?? 0);

  const amount =
    accountType === "credit" && rawAmount < 0 ? Math.abs(rawAmount) : rawAmount;

  const balanceCurrencies = balances?.map((b) => b.balanceAmount.currency);
  const currency = resolveCurrency(
    balance?.currency,
    ...(balanceCurrencies ?? []),
  );

  return {
    currency,
    amount,
    available_balance: getAvailableBalance(balances, currency),
    credit_limit: null,
  };
};

export const transformInstitution = (
  institution: Institution,
): TransformInstitution => ({
  id: institution.id,
  name: institution.name,
  logo: getLogoURL(institution.id, getFileExtension(institution.logo)),
  provider: "gocardless" as const,
});

export const transformConnectionStatus = (
  requisition?: GetRequisitionResponse,
): ConnectionStatus => {
  if (requisition?.status === "EX" || requisition?.status === "RJ") {
    return {
      status: "disconnected",
    };
  }

  return {
    status: "connected",
  };
};
