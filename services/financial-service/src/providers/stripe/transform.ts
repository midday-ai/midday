import { Providers } from "@/common/schema";
import { getStripeAccountType } from "@/utils/account";
import { getLogoURL } from "@/utils/logo";
import Stripe from "stripe";
import type {
  Account as BaseAccount,
  Balance as BaseBalance,
  Transaction as BaseTransaction,
  Institution,
} from "../types";
import type {
  StripeTransformAccountPayload,
  StripeTransformTransactionPayload,
} from "./types";
import {
  formatStripeAmount,
  getStripeTransactionMethod,
  getStripeTransactionName,
  getStripeTransactionStatus,
  mapStripeTransactionType,
} from "./utils";

/**
 * Transforms a Stripe balance transaction into a standardized BaseTransaction object.
 *
 * @param transaction - The Stripe balance transaction to transform.
 * @param accountId - The ID of the account associated with this transaction.
 * @returns A BaseTransaction object with standardized fields.
 */
export const transformTransaction = ({
  transaction,
  accountId,
}: StripeTransformTransactionPayload): BaseTransaction => ({
  id: transaction.id,
  amount: formatStripeAmount(transaction.amount),
  currency: transaction.currency,
  date: new Date(transaction.created * 1000).toISOString().split("T")[0],
  status: getStripeTransactionStatus(transaction),
  balance: null, // Stripe doesn't provide balance after each transaction
  category: mapStripeTransactionType(transaction.type),
  method: getStripeTransactionMethod(transaction),
  name: getStripeTransactionName(transaction),
  description: transaction.description,
  currency_rate: null,
  currency_source: null,
  internal_id: transaction.id,
  bank_account_id: accountId,
  account_id: accountId,
});

/**
 * Transforms a Stripe account into a standardized BaseAccount object.
 *
 * @param account - The Stripe account to transform.
 * @returns A BaseAccount object with standardized fields.
 */
export const transformAccount = ({
  account,
  balance,
}: StripeTransformAccountPayload): BaseAccount => ({
  id: account.id,
  name: account.business_profile?.name || "Stripe Account",
  currency: account.default_currency || "USD",
  type: getStripeAccountType(account),
  enrollment_id: null,
  balance: transformAccountBalance(balance),
  institution: {
    id: "stripe",
    name: "Stripe",
    logo: getLogoURL("stripe"),
    provider: Providers.Enum.stripe,
  },
});

/**
 * Transforms a Stripe balance into a standardized BaseBalance object.
 *
 * @param balance - The Stripe balance to transform.
 * @returns A BaseBalance object with the total available balance across all currencies.
 */
export const transformAccountBalance = (
  balance?: Stripe.Balance,
): BaseBalance => ({
  amount:
    balance?.available.reduce(
      (sum, bal) => sum + formatStripeAmount(bal.amount),
      0,
    ) || 0,
  currency: balance?.available[0]?.currency.toUpperCase() || "USD",
  available: balance?.available ? balance.available.map((bal) => ({
    amount: formatStripeAmount(bal.amount),
    currency: bal.currency.toUpperCase(),
  })) : [],
});

/**
 * Creates a standardized Institution object for Stripe.
 *
 * @returns An Institution object representing Stripe.
 */
export const transformInstitution = (): Institution => ({
  id: "stripe",
  name: "Stripe",
  logo: getLogoURL("stripe"),
  provider: Providers.Enum.stripe,
});
