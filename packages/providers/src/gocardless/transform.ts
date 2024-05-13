import { capitalCase } from "change-case";
import type {
  Account as BaseAccount,
  Balance as BaseAccountBalance,
  Transaction as BaseTransaction,
} from "../types";
import type {
  Transaction,
  TransactionDescription,
  TransformAccount,
  TransformAccountBalance,
  TransformAccountName,
  TransformTransaction,
} from "./types";

export const mapTransactionCategory = (transaction: Transaction) => {
  if (+transaction.transactionAmount.amount > 0) {
    return "income";
  }

  if (transaction?.proprietaryBankTransactionCode === "Transfer") {
    return "transfer";
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

  return null;
};

export const transformTransaction = ({
  transaction,
  teamId,
  bankAccountId,
}: TransformTransaction): BaseTransaction => {
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
    amount: +transaction.transactionAmount.amount,
    currency: transaction.transactionAmount.currency,
    bank_account_id: bankAccountId,
    category: mapTransactionCategory(transaction),
    team_id: teamId,
    currency_rate: currencyExchange?.rate || null,
    currency_source: currencyExchange?.currency || null,
    balance:
      transaction?.balanceAfterTransaction?.balanceAmount?.amount || null,
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
  account,
  bank,
}: TransformAccount): BaseAccount => {
  return {
    id,
    name: transformAccountName({
      name: account.name,
      bank,
      product: account.product,
    }),
    currency: account.currency,
    institution: bank && {
      id: bank?.id,
      logo: bank?.logo,
      name: bank?.name,
    },
    provider: "gocardless",
  };
};

export const transformAccountBalance = (
  account: TransformAccountBalance
): BaseAccountBalance => ({
  currency: account.currency,
  amount: +account.amount,
});
