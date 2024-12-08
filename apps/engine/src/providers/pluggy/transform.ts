import { Providers } from "@/common/schema";
import { getType } from "@/utils/account";
import { getLogoURL } from "@/utils/logo";
import { capitalCase } from "change-case";
import type { Account, Connector, Transaction } from "pluggy-sdk";
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

export const transformAccount = (
  account: Account & { institution: Connector },
): BaseAccount => {
  return {
    id: account.id,
    name: account.name,
    currency: account.currencyCode,
    type: getType(account.type),
    institution: {
      id: account.institution.id.toString(),
      name: account.institution.name,
      logo: account.institution.imageUrl,
      provider: Providers.Enum.pluggy,
    },
    enrollment_id: null,
    balance: {
      amount: account.balance,
      currency: account.currencyCode,
    },
  };
};

export const transformInstitution = (institution: Connector) => ({
  id: institution.id.toString(),
  name: institution.name,
  logo: getLogoURL(institution.id.toString()),
  provider: Providers.Enum.pluggy,
});

export const transformBalance = (account: Account): BaseBalance => ({
  currency: account.currencyCode,
  amount: account.balance,
});
