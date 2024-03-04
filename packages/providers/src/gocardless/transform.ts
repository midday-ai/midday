import { capitalCase } from "change-case";
import {
  Account as BaseAccount,
  Transaction as BaseTransaction,
} from "../types";
import {
  Transaction,
  TransactionDescriptionParams,
  TransformAccountName,
  TransformAccountParams,
  TransformTransactionParams,
} from "./types";

export const mapTransactionMethod = (method?: string) => {
  switch (method) {
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
  if (transaction?.additionalInformation) {
    return capitalCase(transaction.additionalInformation);
  }

  if (transaction?.remittanceInformationStructured) {
    return capitalCase(transaction.remittanceInformationStructured);
  }

  if (transaction?.remittanceInformationUnstructured) {
    return capitalCase(transaction.remittanceInformationUnstructured);
  }

  if (transaction?.creditorName) {
    return capitalCase(transaction.creditorName);
  }

  if (transaction?.debtorName) {
    return capitalCase(transaction?.debtorName);
  }

  const remittanceInformation =
    transaction?.remittanceInformationUnstructuredArray?.at(0);

  if (remittanceInformation) {
    return capitalCase(remittanceInformation);
  }

  console.log("No transaction name", transaction);

  return "No information";
};

const transformDescription = ({
  transaction,
  name,
}: TransactionDescriptionParams) => {
  if (transaction?.remittanceInformationUnstructuredArray?.length) {
    const text = transaction?.remittanceInformationUnstructuredArray.join(" ");
    const description = capitalCase(text);

    // NOTE: Sometimes the description is the same as name
    // Let's skip that and just save if they are not the same
    if (description !== name) {
      return description;
    }
  }
};

export const transformTransaction = ({
  transaction,
  teamId,
  accountId,
}: TransformTransactionParams): BaseTransaction => {
  const method = mapTransactionMethod(
    transaction?.proprietaryBankTransactionCode
  );

  let currencyExchange: { rate: number; currency: string } | undefined;

  if (Array.isArray(transaction.currencyExchange)) {
    const rate = Number.parseFloat(
      transaction.currencyExchange.at(0)?.exchangeRate ?? ""
    );

    if (rate) {
      const currency = transaction?.currencyExchange?.at(0)?.sourceCurrency;

      if (currency) {
        currencyExchange = {
          rate,
          currency,
        };
      }
    }
  }

  const name = transformTransactionName(transaction);

  return {
    date: transaction.bookingDate,
    name,
    method,
    internal_id: `${teamId}_${transaction.internalTransactionId}`,
    amount: transaction.transactionAmount.amount,
    currency: transaction.transactionAmount.currency,
    bank_account_id: accountId,
    category: +transaction.transactionAmount.amount > 0 ? "income" : null,
    team_id: teamId,
    currency_rate: currencyExchange?.rate,
    currency_source: currencyExchange?.currency,
    balance: transaction?.balanceAfterTransaction?.balanceAmount?.amount,
    description: transformDescription({ transaction, name }),
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

  if (account?.bank?.name) {
    return account.bank.name;
  }

  return "No name";
};

export const transformAccount = ({
  id,
  name,
  currency,
  bank,
  product,
}: TransformAccountParams): BaseAccount => {
  return {
    id,
    name: transformAccountName({ name, bank, product }),
    currency,
    institution: bank && {
      id: bank?.id,
      logo: bank?.logo,
      name: bank?.name,
    },
    provider: "gocardless",
  };
};
