import { capitalCase } from "change-case";
import type { Transaction, TransactionCode } from "plaid";
import type {
  Account as BaseAccount,
  Transaction as BaseTransaction,
  GetAccountBalanceResponse,
} from "../../types";
import { getType } from "../../utils/account";
import { getLogoURL } from "../../utils/logo";
import type {
  TransformAccount,
  TransformAccountBalance,
  TransformInstitution,
  TransformTransactionPayload,
} from "./types";

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
  // Check Plaid's category first - they have good categorization
  if (transaction.personal_finance_category?.primary === "INCOME") {
    return "income";
  }

  // Plaid categorizes credit card payments under the detailed category
  if (
    transaction.personal_finance_category?.detailed ===
    "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT"
  ) {
    return "credit-card-payment";
  }

  if (amount > 0) {
    // For credit accounts, positive amount means money came IN (payment, refund, cashback)
    if (accountType === "credit") {
      // Check if it's a transfer type
      if (
        transaction.personal_finance_category?.primary === "TRANSFER_IN" ||
        transaction.transaction_code === "bill payment"
      ) {
        return "credit-card-payment";
      }
      // Otherwise it's likely a refund - don't auto-categorize
      return null;
    }
    return "income";
  }

  if (
    transaction.transaction_code === "bank charge" ||
    transaction.personal_finance_category?.primary === "BANK_FEES"
  ) {
    return "fees";
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

  // Software and technology
  if (
    transaction.personal_finance_category?.detailed ===
    "GENERAL_SERVICES_OTHER_GENERAL_SERVICES"
  ) {
    return "software";
  }

  // Utilities - use new utilities category instead of facilities-expenses
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
    return "utilities"; // Updated to use new utilities category
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
    return "internet-and-telephone";
  }

  // Professional services
  if (
    transaction.personal_finance_category?.primary === "PROFESSIONAL_SERVICES"
  ) {
    return "professional-services-fees";
  }

  // Insurance
  if (transaction.personal_finance_category?.primary === "INSURANCE") {
    return "insurance";
  }

  // Marketing and advertising
  if (transaction.personal_finance_category?.primary === "MARKETING") {
    return "marketing";
  }

  // Home improvement for office supplies
  if (transaction.personal_finance_category?.primary === "HOME_IMPROVEMENT") {
    return "office-supplies";
  }

  if (transaction.personal_finance_category?.primary === "ENTERTAINMENT") {
    return "activity";
  }

  // Tax payments
  if (transaction.personal_finance_category?.primary === "TAX") {
    return "taxes";
  }

  // Healthcare/medical - could be benefits
  if (transaction.personal_finance_category?.primary === "MEDICAL") {
    return "benefits";
  }

  // General merchandise - could be office supplies for small amounts
  if (
    transaction.personal_finance_category?.primary === "GENERAL_MERCHANDISE" &&
    Math.abs(amount) < 500 // Small amounts likely office supplies
  ) {
    return "office-supplies";
  }

  // Large general merchandise - likely equipment
  if (
    transaction.personal_finance_category?.primary === "GENERAL_MERCHANDISE" &&
    Math.abs(amount) >= 500 // Large amounts likely equipment
  ) {
    return "equipment";
  }

  return null;
};

const formatAmout = (amount: number) => {
  // Positive values when money moves out of the account; negative values when money moves in.
  // For example, debit card purchases are positive; credit card payments, direct deposits, and refunds are negative.
  return +(amount * -1);
};

const transformDescription = (transaction: Transaction) => {
  const name = capitalCase(transaction.name);

  if (
    transaction?.original_description &&
    transaction.original_description !== name
  ) {
    return capitalCase(transaction.original_description);
  }

  if (transaction?.merchant_name && transaction?.merchant_name !== name) {
    return transaction?.merchant_name;
  }

  return null;
};

export const transformTransaction = ({
  transaction,
  accountType,
}: TransformTransactionPayload): BaseTransaction => {
  const method = mapTransactionMethod(transaction?.transaction_code);
  const amount = formatAmout(transaction.amount);
  const description = transformDescription(transaction) ?? null;

  return {
    id: transaction.transaction_id,
    date: transaction.date,
    name: transaction.name,
    description,
    currency_rate: null,
    currency_source: null,
    method,
    amount,
    currency:
      transaction?.iso_currency_code?.toUpperCase() ||
      transaction?.unofficial_currency_code?.toUpperCase() ||
      "USD",
    category: mapTransactionCategory({ transaction, amount, accountType }),
    counterparty_name: transaction?.counterparties?.[0]?.name
      ? capitalCase(transaction.counterparties[0].name)
      : null,
    merchant_name: transaction?.merchant_name || null,
    balance: null,
    status: transaction.pending ? "pending" : "posted",
  };
};

export const transformAccount = ({
  account_id,
  name,
  balances,
  institution,
  type,
  subtype,
  mask,
  persistent_account_id,
}: TransformAccount): BaseAccount => {
  const accountType = getType(type);
  return {
    id: account_id,
    name,
    currency:
      balances?.iso_currency_code?.toUpperCase() ||
      balances?.unofficial_currency_code?.toUpperCase() ||
      "USD",
    type: accountType,
    enrollment_id: null,
    balance: transformAccountBalance({ balances, accountType }),
    institution: {
      id: institution.id,
      name: institution.name,
      logo: getLogoURL(institution.id),
      provider: "plaid" as const,
    },
    // Use persistent_account_id (stable across Item resets for TAN institutions)
    // Fall back to mask (last 2-4 digits) for other institutions
    resource_id: persistent_account_id || mask || null,
    expires_at: null,
    iban: null, // Plaid (US-focused) doesn't typically provide IBAN
    subtype: subtype || null, // checking, savings, credit_card, mortgage, etc.
    bic: null, // Plaid doesn't have BIC
    // US bank details - requires Auth product, fetched separately
    routing_number: null,
    wire_routing_number: null,
    account_number: null,
    sort_code: null,
    // Credit account balances - Plaid provides both
    available_balance: balances?.available ?? null,
    credit_limit: balances?.limit ?? null,
  };
};

type TransformAccountBalanceParams = {
  balances?: TransformAccountBalance;
  accountType?: string;
};

export const transformAccountBalance = ({
  balances,
  accountType,
}: TransformAccountBalanceParams): GetAccountBalanceResponse => {
  // For credit cards, use `current` (amount owed), not `available` (available credit)
  // Example: $5000 limit, $1000 owed → available=$4000, current=$1000
  // We want to show $1000 (current), not $4000 (available)
  const amount =
    accountType === "credit"
      ? (balances?.current ?? 0)
      : (balances?.available ?? balances?.current ?? 0);

  return {
    currency:
      balances?.iso_currency_code?.toUpperCase() ||
      balances?.unofficial_currency_code?.toUpperCase() ||
      "USD",
    amount,
    available_balance: balances?.available ?? null,
    credit_limit: balances?.limit ?? null,
  };
};

export const transformInstitution = (institution: TransformInstitution) => ({
  id: institution.institution_id,
  name: institution.name,
  logo: getLogoURL(institution.institution_id),
  provider: "plaid" as const,
});
