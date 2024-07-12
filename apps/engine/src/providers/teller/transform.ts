import { Providers } from "@/common/schema";
import { getType } from "@/utils/account";
import { capitalCase } from "change-case";
import type {
  Account as BaseAccount,
  Balance as BaseAccountBalance,
  Transaction as BaseTransaction,
} from "../types";
import type {
  FormatAmount,
  Transaction,
  TransformAccount,
  TransformAccountBalance,
  TransformInstitution,
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

export const transformDescription = (transaction: Transaction) => {
  const description =
    transaction?.details?.counterparty?.name &&
    capitalCase(transaction.details.counterparty.name);

  if (transaction.description !== description && description) {
    return capitalCase(description);
  }

  return null;
};

const formatAmout = ({ amount, accountType }: FormatAmount) => {
  // NOTE: For account credit positive values when money moves out of the account; negative values when money moves in.
  if (accountType === "credit") {
    return +(amount * -1);
  }

  return +amount;
};

export const transformTransaction = ({
  transaction,
  accountType,
}: TransformTransaction): BaseTransaction => {
  const method = mapTransactionMethod(transaction.type);
  const description = transformDescription(transaction);
  const amount = formatAmout({
    amount: +transaction.amount,
    accountType,
  });

  return {
    id: transaction.id,
    date: transaction.date,
    name: transaction.description && capitalCase(transaction.description),
    description: description ?? null,
    currency_rate: null,
    currency_source: null,
    method,
    amount,
    currency: "USD",
    category: mapTransactionCategory({ transaction, amount }),
    balance: transaction?.running_balance ? +transaction.running_balance : null,
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
    institution: institution
      ? {
          ...institution,
          logo: `https://teller.io/images/banks/${institution.id}.jpg`,
          provider: Providers.Enum.teller,
        }
      : null,
    enrollment_id: enrollment_id,
    provider: Providers.Enum.teller,
    type: getType(type),
  };
};

export const transformAccountBalance = (
  account: TransformAccountBalance,
): BaseAccountBalance => ({
  currency: account.currency,
  amount: +account.amount,
});

export const transformInstitution = (institution: TransformInstitution) => ({
  id: institution.id,
  name: institution.name,
  logo: `https://teller.io/images/banks/${institution.id}.jpg`,
  provider: Providers.Enum.teller,
});
