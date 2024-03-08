import { capitalCase } from "change-case";
import { Transaction, TransactionCode } from "plaid";
import {
  Account as BaseAccount,
  Transaction as BaseTransaction,
} from "../types";
import { TransformAccount, TransformTransaction } from "./types";

export const mapTransactionMethod = (type?: TransactionCode | null) => {
  switch (type) {
    case "bill payment":
      return "payment";
    case "purchase":
      return "card_purchase";
    case "atm":
      return "card_atm";
    case "transfer":
      return "transfer";
    case "interest":
      return "interest";
    case "bank charge":
      return "fee";
    default:
      return "other";
  }
};

export const mapTransactionCategory = (transaction: Transaction) => {
  // Positive values when money moves out of the account; negative values when money moves in.
  // For example, debit card purchases are positive; credit card payments, direct deposits, and refunds are negative.
  if (transaction?.amount < 0) {
    return "income";
  }

  if (transaction.personal_finance_category?.primary === "INCOME") {
    return "income";
  }

  if (
    transaction.transaction_code === "bank charge" ||
    transaction.personal_finance_category?.primary === "BANK_FEES"
  ) {
    return "fees";
  }

  if (
    transaction.transaction_code === "transfer" ||
    transaction.personal_finance_category?.primary === "TRANSFER_IN" ||
    transaction.personal_finance_category?.primary === "TRANSFER_OUT"
  ) {
    return "transfer";
  }

  if (transaction.personal_finance_category?.primary === "FOOD_AND_DRINK") {
    return "meals";
  }

  if (
    transaction.personal_finance_category?.primary === "TRANSPORTATION" ||
    transaction.personal_finance_category?.primary === "TRAVEL"
  ) {
    return "travel";
  }

  if (
    transaction.personal_finance_category?.detailed ===
    "GENERAL_SERVICES_OTHER_GENERAL_SERVICES"
  ) {
    return "software";
  }

  if (
    transaction.personal_finance_category?.detailed ===
      "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY" ||
    transaction.personal_finance_category?.detailed ===
      "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT" ||
    transaction.personal_finance_category?.detailed ===
      "RENT_AND_UTILITIES_WATER" ||
    transaction.personal_finance_category?.detailed ===
      "RENT_AND_UTILITIES_OTHER_UTILITIES"
  ) {
    return "facilities_expenses";
  }

  if (
    transaction.personal_finance_category?.detailed ===
    "RENT_AND_UTILITIES_RENT"
  ) {
    return "rent";
  }

  if (
    transaction.personal_finance_category?.detailed ===
      "RENT_AND_UTILITIES_INTERNET_AND_CABLE" ||
    transaction.personal_finance_category?.detailed ===
      "RENT_AND_UTILITIES_TELEPHONE"
  ) {
    return "internet_and_telephone";
  }

  if (transaction.personal_finance_category?.primary === "HOME_IMPROVEMENT") {
    return "office_supplies";
  }

  if (transaction.personal_finance_category?.primary === "ENTERTAINMENT") {
    return "activity";
  }

  return null;
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
  const method = mapTransactionMethod(transaction?.transaction_code);

  return {
    date: transaction.date,
    name: transaction.name,
    description: transaction?.original_description
      ? capitalCase(transaction.original_description)
      : null,
    method,
    internal_id: `${teamId}_${transaction.transaction_id}`,
    amount: transformToSignedAmount(transaction.amount),
    currency:
      transaction.iso_currency_code ||
      transaction.unofficial_currency_code ||
      "USD",
    bank_account_id: bankAccountId,
    category: mapTransactionCategory(transaction),
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
