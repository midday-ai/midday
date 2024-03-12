import { capitalCase } from "change-case";
import {
  Account as BaseAccount,
  Transaction as BaseTransaction,
} from "../types";
import { Transaction, TransformAccount, TransformTransaction } from "./types";

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

export const mapTransactionCategory = (transaction: Transaction) => {
  if (transaction.type === "transfer") {
    return "transfer";
  }

  if (transaction.type === "fee") {
    return "fees";
  }

  // Positive values when money moves out of the account; negative values when money moves in.
  // For example, debit card purchases are positive; credit card payments, direct deposits, and refunds are negative.
  if (+transaction?.amount < 0) {
    return "income";
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
      return null;
  }
};

const transformToSignedAmount = (amount: number) => {
  // Positive values when money moves out of the account; negative values when money moves in.
  // For example, debit card purchases are positive; credit card payments, direct deposits, and refunds are negative.
  if (amount > 0) {
    return -amount;
  }

  return amount * -1;
};

export const transformTransaction = ({
  transaction,
  teamId,
  bankAccountId,
}: TransformTransaction): BaseTransaction => {
  const method = mapTransactionMethod(transaction.type);

  return {
    date: transaction.date,
    name: transaction.description && capitalCase(transaction.description),
    description: null,
    method,
    internal_id: `${teamId}_${transaction.id}`,
    amount: transformToSignedAmount(+transaction.amount),
    currency: "USD",
    bank_account_id: bankAccountId,
    category: mapTransactionCategory(transaction),
    team_id: teamId,
    balance: transaction.running_balance,
    status: transaction?.status === "posted" ? "posted" : "pending",
  };
};

export const transformAccount = ({
  id,
  name,
  currency,
  institution,
  enrollment_id,
}: TransformAccount): BaseAccount => {
  return {
    id,
    name,
    currency,
    institution: {
      ...institution,
      logo: `https://teller.io/images/banks/${institution.id}.jpg`,
    },
    enrollment_id: enrollment_id,
    provider: "teller",
  };
};
