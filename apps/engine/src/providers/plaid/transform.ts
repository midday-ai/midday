import { Providers } from "@/common/schema";
import { getType } from "@/utils/account";
import { getLogoURL } from "@/utils/logo";
import { capitalCase } from "change-case";
import type { Transaction, TransactionCode } from "plaid";
import type {
  Account as BaseAccount,
  Balance as BaseBalance,
  Transaction as BaseTransaction,
} from "../types";
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
};

export const mapTransactionCategory = ({
  transaction,
  amount,
}: MapTransactionCategory): string => {
  const { personal_finance_category: pfc, transaction_code } = transaction;

  // Helper function to check if a string includes any of the given keywords
  const includesAny = (str: string, keywords: string[]): boolean =>
    keywords.some((keyword) =>
      str?.toLowerCase().includes(keyword.toLowerCase()),
    );

  // Income
  if (pfc?.primary === "INCOME" || amount > 0) {
    return "income";
  }

  // Transfers
  if (
    transaction_code === "transfer" ||
    pfc?.primary === "TRANSFER_IN" ||
    pfc?.primary === "TRANSFER_OUT" ||
    pfc?.detailed?.includes("THIRD_PARTY")
  ) {
    return "transfer";
  }

  // Bank Fees
  if (
    transaction_code === "bank charge" ||
    pfc?.primary === "BANK_FEES" ||
    includesAny(pfc?.detailed || "", [
      "OVERDRAFT",
      "ATM",
      "LATE_PAYMENT",
      "FOREIGN_TRANSACTION",
      "WIRE_TRANSFER",
      "INSUFFICIENT_FUNDS",
    ])
  ) {
    return "fees";
  }

  // Food and Drink
  if (pfc?.primary === "FOOD_AND_DRINK") {
    return "meals"; // Changed from "dining" to match original function
  }

  // Transportation and Travel
  if (pfc?.primary === "TRANSPORTATION" || pfc?.primary === "TRAVEL") {
    return "travel";
  }

  // Services
  if (pfc?.primary === "SERVICE" || pfc?.primary === "GENERAL_SERVICES") {
    if (pfc?.detailed === "GENERAL_SERVICES_OTHER_GENERAL_SERVICES") {
      return "software";
    }
    if (
      includesAny(pfc?.detailed || "", ["ADVERTISING", "MARKETING", "BUSINESS"])
    ) {
      return "business-services";
    }
    if (
      includesAny(pfc?.detailed || "", ["LEGAL", "ACCOUNTING", "FINANCIAL"])
    ) {
      return "professional-services";
    }
    return "services";
  }

  // Utilities and Rent
  if (pfc?.primary === "RENT_AND_UTILITIES") {
    if (pfc?.detailed === "RENT_AND_UTILITIES_RENT") {
      return "rent";
    }
    if (
      pfc?.detailed === "RENT_AND_UTILITIES_INTERNET_AND_CABLE" ||
      pfc?.detailed === "RENT_AND_UTILITIES_TELEPHONE"
    ) {
      return "internet-and-telephone";
    }
    if (
      pfc?.detailed === "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY" ||
      pfc?.detailed === "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT" ||
      pfc?.detailed === "RENT_AND_UTILITIES_WATER" ||
      pfc?.detailed === "RENT_AND_UTILITIES_OTHER_UTILITIES"
    ) {
      return "facilities-expenses";
    }
    return "housing";
  }

  // Home and Office
  if (pfc?.primary === "HOME_IMPROVEMENT") {
    return "office-supplies";
  }

  // Entertainment and Recreation
  if (pfc?.primary === "ENTERTAINMENT") {
    return "activity";
  }

  // Shopping
  if (pfc?.primary === "SHOPPING") {
    if (includesAny(pfc?.detailed || "", ["ELECTRONICS", "COMPUTERS"])) {
      return "electronics";
    }
    if (includesAny(pfc?.detailed || "", ["CLOTHING", "ACCESSORIES"])) {
      return "clothing";
    }
    if (pfc?.detailed?.includes("SUPERMARKETS_AND_GROCERIES")) {
      return "groceries";
    }
    return "shopping";
  }

  // Healthcare
  if (pfc?.primary === "HEALTHCARE") {
    if (pfc?.detailed?.includes("PHARMACY")) {
      return "pharmacy";
    }
    return "healthcare";
  }

  // Personal Care
  if (pfc?.primary === "PERSONAL_CARE") {
    return "personal-care";
  }

  // Education
  if (pfc?.primary === "EDUCATION") {
    return "education";
  }

  // Charitable Giving
  if (pfc?.primary === "CHARITABLE_GIVING") {
    return "donations";
  }

  // Taxes
  if (pfc?.primary === "TAX") {
    return "taxes";
  }

  // Auto
  if (
    includesAny(pfc?.detailed || "", [
      "AUTOMOTIVE",
      "CAR_SERVICE",
      "AUTO_INSURANCE",
    ])
  ) {
    return "auto";
  }

  // Insurance
  if (pfc?.primary === "INSURANCE") {
    return "insurance";
  }

  // Loans and Mortgages
  if (includesAny(pfc?.detailed || "", ["LOANS", "MORTGAGES", "CREDIT_CARD"])) {
    return "loans";
  }

  // Investment
  if (pfc?.primary === "INVESTMENT") {
    return "investments";
  }

  // Government and Non-Profit
  if (
    includesAny(pfc?.detailed || "", [
      "GOVERNMENT",
      "COMMUNITY",
      "ORGANIZATIONS",
    ])
  ) {
    return "government-and-non-profit";
  }

  // Catch-all for uncategorized transactions
  return "uncategorized";
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
}: TransformTransactionPayload): BaseTransaction => {
  const method = mapTransactionMethod(transaction?.transaction_code);
  const amount = formatAmout(transaction.amount);
  const description = transformDescription(transaction) ?? null;
  const name = capitalCase(transaction.name);

  return {
    id: transaction.transaction_id,
    date: transaction.date,
    name,
    description,
    internal_id: transaction.transaction_id,
    bank_account_id: transaction.account_id,
    method,
    amount,
    currency:
      transaction.iso_currency_code ||
      transaction.unofficial_currency_code ||
      "USD",
    currency_rate: null,
    currency_source: null,
    category: mapTransactionCategory({ transaction, amount }),
    status: transaction.pending ? "pending" : "posted",
    account_id: transaction.account_id,
    account_owner: transaction.account_owner,
    category_slug: transaction.personal_finance_category?.primary,
    category_id: transaction.category_id,
    manual: false,
    iso_currency_code: transaction.iso_currency_code,
    unofficial_currency_code: transaction.unofficial_currency_code,
    location_address: transaction.location?.address,
    location_city: transaction.location?.city,
    location_region: transaction.location?.region,
    location_postal_code: transaction.location?.postal_code,
    location_country: transaction.location?.country,
    location_lat: transaction.location?.lat,
    location_lon: transaction.location?.lon,
    location_store_number: transaction.location?.store_number,
    merchant_name: transaction.merchant_name,
    merchant_entity_id: transaction.merchant_entity_id,
    website: transaction.website,
    payment_meta_by_order_of: transaction.payment_meta?.by_order_of,
    payment_meta_payer: transaction.payment_meta?.payer,
    payment_meta_payee: transaction.payment_meta?.payee,
    payment_meta_payment_method: transaction.payment_meta?.payment_method,
    payment_meta_payment_processor: transaction.payment_meta?.payment_processor,
    payment_meta_ppd_id: transaction.payment_meta?.ppd_id,
    payment_meta_reason: transaction.payment_meta?.reason,
    payment_meta_reference_number: transaction.payment_meta?.reference_number,
    payment_channel: transaction.payment_channel,
    pending: transaction.pending,
    pending_transaction_id: transaction.pending_transaction_id,
    personal_finance_category_primary:
      transaction.personal_finance_category?.primary,
    personal_finance_category_detailed:
      transaction.personal_finance_category?.detailed,
    personal_finance_category_confidence_level:
      transaction.personal_finance_category?.confidence_level,
    personal_finance_category_icon_url:
      transaction.personal_finance_category_icon_url,
    transaction_id: transaction.transaction_id,
    transaction_code: transaction.transaction_code,
    transaction_type: transaction.transaction_type,
    authorized_date: transaction.authorized_date
      ? new Date(transaction.authorized_date)
      : null,
    check_number: transaction.check_number,
    balance: Number.parseFloat(transaction.amount.toFixed(2)),
  };
};

const transformToSignedAmount = (amount: number) => {
  // Positive values when money moves out of the account; negative values when money moves in.
  // For example, debit card purchases are positive; credit card payments, direct deposits, and refunds are negative.
  if (amount > 0) {
    return -amount;
  }

  return amount * -1;
};

export const transformAccount = ({
  account_id,
  name,
  balances,
  institution,
  type,
}: TransformAccount): BaseAccount => {
  return {
    id: account_id,
    name,
    currency:
      balances.iso_currency_code || balances.unofficial_currency_code || "USD",
    type: getType(type),
    enrollment_id: null,
    balance: transformAccountBalance(balances),
    institution: {
      id: institution.id,
      name: institution.name,
      logo: getLogoURL(institution.id),
      provider: Providers.Enum.plaid,
    },
  };
};

export const transformAccountBalance = (
  balances?: TransformAccountBalance,
): BaseBalance => ({
  currency:
    balances?.iso_currency_code || balances?.unofficial_currency_code || "USD",
  amount: balances?.available ?? 0,
});

export const transformInstitution = (institution: TransformInstitution) => ({
  id: institution.institution_id,
  name: institution.name,
  logo: getLogoURL(institution.institution_id),
  provider: Providers.Enum.plaid,
});
