import { capitalCase } from "change-case";
import {
  Account as BaseAccount,
  Transaction as BaseTransaction,
} from "../types";
import { TransformAccount, TransformTransaction } from "./types";

export const mapTransactionMethod = (type?: string) => {
  switch (type) {
    case "payment":
    case "bill_payment":
    case "digital_payment":
      return "payment";
    case "card_payment":
      return "card_purchase";
    case "atm":
      return "card_atm";
    case "transfer":
      return "transfer";
    case "ach":
      return "ach";
    case "interest":
      return "interest";
    case "deposit":
      return "deposit";
    case "wire":
      return "wire";
    case "fee":
      return "fee";
    default:
      return "other";
  }
};

export const mapTransactionCategory = (transaction: TransformTransaction) => {
  if (+transaction?.amount > 0) {
    return "income";
  }

  if (transaction.type === "transfer") {
    return "transfer";
  }

  if (transaction.type === "fee") {
    return "fees";
  }

  switch (transaction?.details.category) {
    case "bar":
    case "dining":
    case "groceries":
      return "meals";
    case "transport":
    case "transportation":
      return "travel";
    case "tax":
      return "taxes";
    case "office":
      return "office_supplies";
    case "phone":
      return "internet_and_telephone";
    case "software":
      return "software";
    case "entertainment":
    case "sport":
      return "activity";
    case "utilities":
    case "electronics":
      return "equipment";
    default:
      return "uncategorized";
  }
};

export const transformTransaction = ({
  transaction,
  teamId,
  bankAccountId,
}: TransformTransaction): BaseTransaction => {
  // const method = mapTransactionMethod(transaction.type);

  return {
    date: transaction.date,
    // name: transaction.description && capitalCase(transaction.description),
    // method,
    internal_id: `${teamId}_${transaction.transaction_id}`,
    amount: +transaction.amount,
    currency:
      transaction.iso_currency_code ||
      transaction.unofficial_currency_code ||
      "USD",
    bank_account_id: bankAccountId,
    // category: mapTransactionCategory(transaction),
    team_id: teamId,
    balance: null,
    status: transaction.pending ? "pending" : "posted",
  };
};

export const transformAccount = ({
  account_id,
  name,
  institution,
  balances,
}: TransformAccount): BaseAccount => {
  return {
    id: account_id,
    name,
    currency:
      balances.iso_currency_code || balances.unofficial_currency_code || "USD",
    institution,
    provider: "plaid",
  };
};
