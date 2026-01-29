import { capitalCase } from "change-case";
import type {
  Account as BaseAccount,
  GetAccountBalanceResponse,
  Transaction as BaseTransaction,
} from "../../types";
import { getType, type AccountType } from "../../utils/account";
import { normalizeBalance } from "../../utils/balance";
import { getLogoURL } from "../../utils/logo";
import type {
  FormatAmount,
  Transaction,
  TransformAccount,
  TransformAccountBalance,
  TransformInstitution,
  TransformTransaction,
} from "./types";

export const PROVIDER_NAME = "teller" as const;

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
  accountType: string;
};

export const mapTransactionCategory = ({
  transaction,
  amount,
  accountType,
}: MapTransactionCategory) => {
  if (transaction.type === "fee") {
    return "fees";
  }

  if (amount > 0) {
    // For credit accounts, positive amount after transformation means money came IN
    // (e.g., payment, refund, cashback). Determine category based on transaction type/category.
    if (accountType === "credit") {
      // If Teller categorizes it as income, it might be cashback/rewards
      if (transaction.details?.category === "income") {
        return "income";
      }
      // Payment types indicate a credit card payment
      if (
        transaction.type === "payment" ||
        transaction.type === "bill_payment" ||
        transaction.type === "digital_payment" ||
        transaction.type === "ach" ||
        transaction.type === "transfer"
      ) {
        return "credit-card-payment";
      }
      // Otherwise it's likely a refund - don't auto-categorize, let user decide
      return null;
    }
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
      return "utilities";
    case "electronics":
      return "equipment";
    case "accommodation":
      return "travel";
    case "advertising":
      return "advertising";
    case "charity":
      return "charitable-donations";
    case "education":
      return "training";
    case "health":
      return "benefits";
    case "insurance":
      return "insurance";
    case "fuel":
      return "travel";
    case "home":
      return "facilities-expenses";
    case "service":
      return "professional-services-fees";
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
    category: mapTransactionCategory({ transaction, amount, accountType }),
    balance: transaction?.running_balance ? +transaction.running_balance : null,
    counterparty_name: transaction?.details?.counterparty?.name
      ? capitalCase(transaction.details.counterparty.name)
      : null,
    merchant_name: null,
    status: transaction?.status === "posted" ? "posted" : "pending",
  };
};

type TransformAccountParams = TransformAccount & {
  accountDetails?: {
    account_number: string;
    routing_numbers: {
      ach: string | null;
      wire: string | null;
      bacs: string | null;
    };
  } | null;
};

export const transformAccount = ({
  id,
  name,
  currency,
  enrollment_id,
  type,
  subtype,
  institution,
  balance,
  balances,
  last_four,
  accountDetails,
}: TransformAccountParams): BaseAccount => {
  const accountType = getType(type);

  return {
    id,
    name,
    currency: currency.toUpperCase(),
    enrollment_id: enrollment_id,
    institution: transformInstitution(institution),
    type: accountType,
    balance: transformAccountBalance({ balance, accountType }),
    // Use last_four as stable identifier for account matching during reconnect
    resource_id: last_four,
    expires_at: null,
    iban: null, // Teller (US-only) doesn't have IBAN
    subtype: subtype || null, // checking, savings, money_market, credit_card, etc.
    bic: null, // Teller doesn't have BIC
    // US bank account details from /accounts/:id/details
    routing_number: accountDetails?.routing_numbers?.ach || null,
    wire_routing_number: accountDetails?.routing_numbers?.wire || null,
    account_number: accountDetails?.account_number || null,
    sort_code: accountDetails?.routing_numbers?.bacs || null,
    // Credit account balances - Teller provides available via /balances endpoint
    available_balance: balances?.available ? +balances.available : null,
    credit_limit: null, // Teller doesn't provide credit limit
  };
};

type TransformAccountBalanceParams = {
  balance: TransformAccountBalance;
  balances?: { available: string | null; ledger: string | null } | null;
  accountType?: string;
};

/**
 * Transform Teller balance to internal format.
 *
 * Teller typically returns positive values for credit card debt.
 * Normalization is added for safety and consistency with other providers.
 */
export const transformAccountBalance = ({
  balance,
  balances,
  accountType,
}: TransformAccountBalanceParams): GetAccountBalanceResponse => {
  const rawAmount = +balance.amount;
  const currency = balance.currency.toUpperCase();

  // Use centralized normalization for credit card balances
  const normalized = normalizeBalance(
    rawAmount,
    currency,
    (accountType as AccountType) || "depository",
  );

  return {
    currency: normalized.currency,
    amount: normalized.amount,
    available_balance: balances?.available ? +balances.available : null,
    credit_limit: null, // Teller doesn't provide credit limit
  };
};

export const transformInstitution = (institution: TransformInstitution) => ({
  id: institution.id,
  name: institution.name,
  logo: getLogoURL(institution.id),
  provider: PROVIDER_NAME,
});
