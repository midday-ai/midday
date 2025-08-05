import { Providers } from "@engine/common/schema";
import { getType } from "@engine/utils/account";
import { getLogoURL } from "@engine/utils/logo";
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
    counterparty_name: transaction?.details?.counterparty?.name
      ? capitalCase(transaction.details.counterparty.name)
      : null,
    merchant_name: null,
    status: transaction?.status === "posted" ? "posted" : "pending",
  };
};

export const transformAccount = ({
  id,
  name,
  currency,
  enrollment_id,
  type,
  institution,
  balance,
}: TransformAccount): BaseAccount => {
  return {
    id,
    name,
    currency: currency.toUpperCase(),
    enrollment_id: enrollment_id,
    institution: transformInstitution(institution),
    type: getType(type),
    balance: transformAccountBalance(balance),
    resource_id: null,
    expires_at: null,
  };
};

export const transformAccountBalance = (
  account: TransformAccountBalance,
): BaseAccountBalance => ({
  currency: account.currency.toUpperCase(),
  amount: +account.amount,
});

export const transformInstitution = (institution: TransformInstitution) => ({
  id: institution.id,
  name: institution.name,
  logo: getLogoURL(institution.id),
  provider: Providers.enum.teller,
});
