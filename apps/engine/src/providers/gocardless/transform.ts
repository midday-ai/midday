import { Providers } from "@engine/common/schema";
import type { AccountType } from "@engine/utils/account";
import { getFileExtension, getLogoURL } from "@engine/utils/logo";
import { capitalCase } from "change-case";
import { addDays } from "date-fns";
import type {
  Account as BaseAccount,
  Balance as BaseAccountBalance,
  Transaction as BaseTransaction,
  ConnectionStatus,
} from "../types";
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
import { getAccessValidForDays } from "./utils";

/**
 * Maps GoCardless cashAccountType (ISO 20022) to Midday AccountType
 * - CACC: Current account → depository
 * - CARD: Card account → credit
 * - SVGS: Savings account → depository
 * - TRAN: Transaction account → depository
 * - LOAN: Loan account → loan
 */
const getAccountType = (cashAccountType?: string): AccountType => {
  switch (cashAccountType) {
    case "CARD":
      return "credit";
    case "LOAN":
      return "loan";
    default:
      // CACC, SVGS, TRAN, CASH, and others default to depository
      return "depository";
  }
};

type MapTransactionCategory = {
  transaction: Transaction;
  accountType: AccountType;
};

export const mapTransactionCategory = ({
  transaction,
  accountType,
}: MapTransactionCategory) => {
  const amount = +transaction.transactionAmount.amount;

  if (amount > 0) {
    // For credit accounts, positive amount means money came IN (payment, refund, cashback)
    if (accountType === "credit") {
      // Check if it's a transfer/payment type
      const method = transaction.proprietaryBankTransactionCode;
      if (method === "Transfer" || method === "Payment") {
        return "credit-card-payment";
      }
      // Otherwise it's likely a refund - don't auto-categorize
      return null;
    }
    return "income";
  }

  return null;
};

export const mapTransactionMethod = (type?: string) => {
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

  console.log("No transaction name", transaction);

  // When there is no name, we use the proprietary bank transaction code (Service Fee)
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

    // NOTE: Sometimes the description is the same as name
    // Let's skip that and just save if they are not the same
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
  const method = mapTransactionMethod(
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
    category: mapTransactionCategory({ transaction, accountType }),
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
  // First try to use the name from the account
  if (account?.name) {
    return capitalCase(account.name);
  }

  // Then try to use the product
  if (account?.product) {
    return account.product;
  }

  // Then try to use the institution name
  if (account?.institution?.name) {
    return `${account.institution.name} (${account.currency.toUpperCase()})`;
  }

  // Last use a default name
  return "No name";
};

export const transformAccount = ({
  id,
  account,
  balance,
  institution,
}: TransformAccount): BaseAccount => {
  const accountType = getAccountType(account.cashAccountType);

  return {
    id,
    type: accountType,
    name: transformAccountName({
      name: account.name,
      product: account.product,
      institution: institution,
      currency: account.currency.toUpperCase(),
    }),
    currency: account.currency.toUpperCase(),
    enrollment_id: null,
    balance: transformAccountBalance({ balance, accountType }),
    institution: transformInstitution(institution),
    resource_id: account.resourceId,
    expires_at: addDays(
      new Date(),
      getAccessValidForDays({ institutionId: institution.id }),
    ).toISOString(),
    iban: account.iban || null,
    subtype: null, // GoCardless uses cashAccountType for type, no additional subtype
    bic: institution.bic || null,
  };
};

type TransformAccountBalanceParams = {
  balance?: TransformAccountBalance;
  accountType?: string;
};

/**
 * Transform GoCardless balance to internal format.
 *
 * GoCardless stores credit card balances as NEGATIVE values (e.g., -1000 means $1000 owed).
 * We normalize to POSITIVE values for consistency with other providers (Plaid, Teller, Enable Banking).
 *
 * @param balance - The raw balance from GoCardless
 * @param accountType - The account type (credit accounts get normalized)
 */
export const transformAccountBalance = ({
  balance,
  accountType,
}: TransformAccountBalanceParams): BaseAccountBalance => {
  const rawAmount = +(balance?.amount ?? 0);

  // GoCardless stores credit card debt as negative values (e.g., -1000 = $1000 owed)
  // Normalize to positive for consistency with other providers
  const amount =
    accountType === "credit" && rawAmount < 0 ? Math.abs(rawAmount) : rawAmount;

  return {
    currency: balance?.currency.toUpperCase() || "EUR",
    amount,
  };
};

export const transformInstitution = (
  institution: Institution,
): TransformInstitution => ({
  id: institution.id,
  name: institution.name,
  logo: getLogoURL(institution.id, getFileExtension(institution.logo)),
  provider: Providers.enum.gocardless,
});

export const transformConnectionStatus = (
  requisition?: GetRequisitionResponse,
): ConnectionStatus => {
  // Expired or Rejected
  if (requisition?.status === "EX" || requisition?.status === "RJ") {
    return {
      status: "disconnected",
    };
  }

  return {
    status: "connected",
  };
};
