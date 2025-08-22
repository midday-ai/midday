import { Providers } from "@engine/common/schema";
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
  TransformTransaction,
} from "./types";
import { getAccessValidForDays } from "./utils";

export const mapTransactionCategory = (transaction: Transaction) => {
  if (+transaction.transactionAmount.amount > 0) {
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

export const transformTransaction = (
  transaction: TransformTransaction,
): BaseTransaction => {
  const method = mapTransactionMethod(
    transaction?.proprietaryBankTransactionCode,
  );

  let currencyExchange: { rate: number; currency: string } | undefined;

  if (Array.isArray(transaction.currencyExchange)) {
    const rate = Number.parseFloat(
      transaction.currencyExchange.at(0)?.exchangeRate ?? "",
    );

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
    category: mapTransactionCategory(transaction),
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
  return {
    id,
    type: "depository",
    name: transformAccountName({
      name: account.name,
      product: account.product,
      institution: institution,
      currency: account.currency.toUpperCase(),
    }),
    currency: account.currency.toUpperCase(),
    enrollment_id: null,
    balance: transformAccountBalance(balance),
    institution: transformInstitution(institution),
    resource_id: account.resourceId,
    expires_at: addDays(
      new Date(),
      getAccessValidForDays({ institutionId: institution.id }),
    ).toISOString(),
  };
};

export const transformAccountBalance = (
  account?: TransformAccountBalance,
): BaseAccountBalance => ({
  currency: account?.currency.toUpperCase() || "EUR",
  amount: +(account?.amount ?? 0),
});

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
