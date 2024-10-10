import type { Stripe } from "stripe";
import type {
  GetAccountBalanceRequest as BaseGetAccountBalanceRequest,
  GetAccountsRequest as BaseGetAccountsRequest,
  GetTransactionsRequest as BaseGetTransactionsRequest,
} from "../types";

/** Request type for getting Stripe transactions */
export type StripeGetTransactionsRequest = BaseGetTransactionsRequest & {
  /** The ID of the Stripe account */
  stripeAccountId: string;
};

/** Request type for getting Stripe accounts */
export type StripeGetAccountsRequest = BaseGetAccountsRequest & {
  /** The ID of the Stripe account */
  stripeAccountId: string;
};

/** Request type for getting Stripe account balance */
export type StripeGetAccountBalanceRequest = BaseGetAccountBalanceRequest & {
  /** The ID of the Stripe account */
  stripeAccountId: string;
};

/** Payload for transforming Stripe transactions */
export type StripeTransformTransactionPayload = {
  /** The Stripe balance transaction */
  transaction: Stripe.BalanceTransaction;
  /** The ID of the account */
  accountId: string;
};

/** Payload for transforming Stripe accounts */
export type StripeTransformAccountPayload = {
  /** The Stripe account */
  account: Stripe.Account;
  /** The Stripe balance (optional) */
  balance?: Stripe.Balance;
};

/** Types of Stripe accounts */
export type StripeAccountType = "standard" | "express" | "custom";

/** Interface representing a Stripe account */
export interface StripeAccount {
  /** The account ID */
  id: string;
  /** The object type, always 'account' */
  object: "account";
  /** The type of Stripe account */
  type: StripeAccountType;
  /** Business profile information */
  business_profile?: Stripe.Account.BusinessProfile;
  /** Account capabilities */
  capabilities?: Stripe.Account.Capabilities;
  /** Whether charges are enabled for this account */
  charges_enabled: boolean;
  /** The country of the account */
  country: string;
  /** The default currency for the account */
  default_currency: string;
  /** Whether account details have been submitted */
  details_submitted: boolean;
  /** Whether payouts are enabled for this account */
  payouts_enabled: boolean;
  /** Account settings */
  settings?: Stripe.Account.Settings;
}

/** Interface representing a Stripe balance */
export interface StripeBalance {
  /** Available funds */
  available: Stripe.Balance.Available[];
  /** Pending funds */
  pending: Stripe.Balance.Pending[];
  /** Reserved funds for Connect accounts */
  connect_reserved?: Stripe.Balance.ConnectReserved[];
  /** Instantly available funds */
  instant_available?: Stripe.Balance.InstantAvailable[];
  /** Issuing information */
  issuing?: Stripe.Balance.Issuing;
  /** The object type, always 'balance' */
  object: "balance";
}

/** Types of Stripe transactions */
export type StripeTransactionType =
  | "charge"
  | "refund"
  | "adjustment"
  | "application_fee"
  | "application_fee_refund"
  | "transfer"
  | "payment"
  | "payout"
  | "other";

/** Interface representing a Stripe transaction */
export interface StripeTransaction {
  /** The transaction ID */
  id: string;
  /** The object type, always 'balance_transaction' */
  object: "balance_transaction";
  /** The amount of the transaction in cents */
  amount: number;
  /** The timestamp when the transaction will be available, as Unix timestamp */
  available_on: number;
  /** The timestamp when the transaction was created, as Unix timestamp */
  created: number;
  /** The currency of the transaction */
  currency: string;
  /** Description of the transaction */
  description: string | null;
  /** The fee (in cents) paid for the transaction */
  fee: number;
  /** The net amount of the transaction after fees, in cents */
  net: number;
  /** The reporting category for the transaction */
  reporting_category: string;
  /** The source of the transaction */
  source: string;
  /** The status of the transaction */
  status: "available" | "pending";
  /** The type of the transaction */
  type: StripeTransactionType;
}
