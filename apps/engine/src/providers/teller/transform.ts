import { getType } from "@/utils/account";
import { capitalCase } from "change-case";
import type {
  Account as BaseAccount,
  Transaction as BaseTransaction,
} from "../types";
import type {
  Transaction,
  TransformAccount,
  TransformTransaction,
} from "./types";

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

type MapTransactionCategory = {
  transaction: Transaction;
  amount: number;
};

export const mapTransactionCategory = ({
  transaction,
  amount,
}: MapTransactionCategory) => {
  if (transaction.type === "transfer") {
    return "transfer";
  }

  if (transaction.type === "fee") {
    return "fees";
  }

  if (amount > 0) {
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
      return "office-supplies";
    case "phone":
      return "internet-and-telephone";
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

type TransformTransactionPayload = {
  transaction: TransformTransaction;
};

export const transformTransaction = ({
  transaction,
}: TransformTransactionPayload): BaseTransaction => {
  const method = mapTransactionMethod(transaction.type);
  const amount = +transaction.amount;
  const name = capitalCase(transaction.description);
  const description =
    (transaction?.details?.counterparty?.name &&
      capitalCase(transaction.details.counterparty.name)) ||
    null;

  return {
    date: transaction.date,
    name,
    description,
    method,
    internal_id: transaction.id,
    amount,
    currency: "USD",
    category: mapTransactionCategory({ transaction, amount }),
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
  type,
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
    type: getType(type),
  };
};
