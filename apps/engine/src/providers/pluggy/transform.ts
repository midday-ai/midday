import { getType } from "@/utils/account";
import { capitalCase } from "change-case";
import type { Account, AccountType, Transaction } from "pluggy-sdk";
import type {
  Account as BaseAccount,
  Balance as BaseBalance,
  Transaction as BaseTransaction,
} from "../types";

export const transformTransaction = (
  transaction: Transaction,
): BaseTransaction => {
  return {
    id: transaction.id,
    amount: transaction.amount,
    date: transaction.date.toISOString(),
    currency: transaction.currencyCode,
    status: transaction.status === "POSTED" ? "posted" : "pending",
    balance: transaction.balance,
    category: transaction.category,
    method: transaction.type,
    description: null,
    currency_rate: null,
    currency_source: null,
    name: capitalCase(transaction.description),
  };
};

export const transformAccount = (account: Account): BaseAccount => {
  return {
    id: account.id,
    name: account.name,
    currency: account.currencyCode,
    type: getType(account.type),
    institution: {
      id: "",
      name: "",
      logo: "",
      provider: "pluggy",
    },
    enrollment_id: null,
    balance: {
      amount: account.balance,
      currency: account.currencyCode,
    },
  };
};
