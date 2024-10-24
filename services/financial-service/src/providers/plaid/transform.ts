import { Providers } from "@/common/schema";
import { getType } from "@/utils/account";
import { getLogoURL } from "@/utils/logo";
import { capitalCase } from "change-case";
import type {
  PersonalFinanceCategory,
  RecurringTransactionFrequency,
  Transaction,
  TransactionCode,
  TransactionStreamAmount,
  TransactionStreamStatus,
} from "plaid";
import type {
  Account as BaseAccount,
  Balance as BaseBalance,
  Transaction as BaseTransaction,
  RecurringTransaction,
  RecurringTransactionAmount,
  RecurringTransactionCategory,
  RecurringTransactionStatus,
} from "../types";
import type {
  TransformAccount,
  TransformAccountBalance,
  TransformInstitution,
  TransformRecurringTransaction,
  TransformTransactionPayload,
} from "./types";

/**
 * Maps a Plaid transaction code to a standardized transaction method.
 * @param type - The Plaid transaction code.
 * @returns A standardized transaction method string.
 */
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

/**
 * Maps a Plaid transaction to a standardized category.
 * @param transaction - The Plaid transaction object.
 * @param amount - The transaction amount.
 * @returns A standardized category string.
 */
export const mapTransactionCategory = ({
  transaction,
  amount,
}: MapTransactionCategory): string | null => {
  if (transaction.personal_finance_category?.primary === "INCOME") {
    return "income";
  }

  if (
    transaction.transaction_code === "transfer" ||
    transaction.personal_finance_category?.primary === "TRANSFER_IN" ||
    transaction.personal_finance_category?.primary === "TRANSFER_OUT"
  ) {
    return "transfer";
  }

  if (amount > 0) {
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

  if (
    transaction.personal_finance_category?.detailed ===
    "GENERAL_SERVICES_OTHER_GENERAL_SERVICES"
  ) {
    return "software";
  }

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
    return "facilities-expenses";
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

  if (transaction.personal_finance_category?.primary === "HOME_IMPROVEMENT") {
    return "office-supplies";
  }

  if (transaction.personal_finance_category?.primary === "ENTERTAINMENT") {
    return "activity";
  }

  return null;
};

/**
 * Transforms the transaction description, prioritizing original description or merchant name.
 * @param transaction - The Plaid transaction object.
 * @returns The transformed description or null if no suitable description is found.
 */
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

/**
 * Transforms a Plaid transaction into a standardized BaseTransaction object.
 * @param transaction - The Plaid transaction object.
 * @returns A standardized BaseTransaction object.
 */
export const transformTransaction = ({
  transaction,
}: TransformTransactionPayload): BaseTransaction => {
  const method = mapTransactionMethod(transaction?.transaction_code);
  const amount = transformToSignedAmount(transaction.amount);
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

/**
 * Transforms an amount to ensure consistent sign convention for account balance.
 * @param amount - The original amount.
 * @returns The transformed amount with consistent sign convention.
 */
const transformToSignedAmount = (amount: number) => {
  // Positive values when money moves out of the account; negative values when money moves in.
  // For example, debit card purchases are positive; credit card payments, direct deposits, and refunds are negative.
  if (amount > 0) {
    return -amount;
  }

  return amount * -1;
};

/**
 * Transforms a Plaid account into a standardized BaseAccount object.
 * @param account_id - The account ID.
 * @param name - The account name.
 * @param balances - The account balances.
 * @param institution - The associated institution.
 * @param type - The account type.
 * @returns A standardized BaseAccount object.
 */
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

/**
 * Transforms Plaid account balances into a standardized BaseBalance object.
 * @param balances - The Plaid account balances.
 * @returns A standardized BaseBalance object.
 */
export const transformAccountBalance = (
  balances?: TransformAccountBalance,
): BaseBalance => ({
  currency:
    balances?.iso_currency_code || balances?.unofficial_currency_code || "USD",
  amount: transformToSignedAmount(balances?.current ?? 0),
  available: transformToSignedAmount(balances?.available ?? 0),
});

/**
 * Transforms a Plaid institution into a standardized institution object.
 * @param institution - The Plaid institution object.
 * @returns A standardized institution object.
 */
export const transformInstitution = (institution: TransformInstitution) => ({
  id: institution.institution_id,
  name: institution.name,
  logo: getLogoURL(institution.institution_id),
  provider: Providers.Enum.plaid,
});

/**
 * Transforms a Plaid recurring transaction frequency to a standardized format.
 * @param frequency - The Plaid recurring transaction frequency.
 * @returns A standardized frequency string.
 */
const transformRecurringTransactionFrequency = (
  frequency: RecurringTransactionFrequency,
) => {
  switch (frequency) {
    case "WEEKLY":
      return "weekly";
    case "MONTHLY":
      return "monthly";
    case "ANNUALLY":
      return "yearly";
    case "BIWEEKLY":
      return "bi-weekly";
    case "SEMI_MONTHLY":
      return "semi-monthly";
    default:
      return "unknown";
  }
};

/**
 * Transforms a Plaid transaction stream amount to a standardized format.
 * @param amount - The Plaid transaction stream amount.
 * @returns A standardized RecurringTransactionAmount object.
 */
export const transformRecurringTransactionAmount = (
  amount: TransactionStreamAmount,
): RecurringTransactionAmount => {
  return {
    amount: amount.amount || 0,
    iso_currency_code: amount.iso_currency_code || undefined,
    unofficial_currency_code: amount.unofficial_currency_code || undefined,
  };
};

/**
 * Transforms a Plaid transaction stream status to a standardized format.
 * @param status - The Plaid transaction stream status.
 * @returns A standardized RecurringTransactionStatus string.
 */
export const transformRecurringTransactionStatus = (
  status: TransactionStreamStatus,
): RecurringTransactionStatus => {
  switch (status) {
    case "MATURE":
      return "mature";
    case "EARLY_DETECTION":
      return "early_detection";
    case "TOMBSTONED":
      return "tombstoned";
    default:
      return "unknown";
  }
};

/**
 * Transforms a Plaid personal finance category to a standardized format.
 * @param category - The Plaid personal finance category.
 * @returns A standardized RecurringTransactionCategory object or null.
 */
const transformRecurringTransactionCategory = (
  category: PersonalFinanceCategory | null | undefined,
): RecurringTransactionCategory | null | undefined => {
  if (!category) {
    return null;
  }

  return {
    primary: category.primary,
    detailed: category.detailed,
    confidence_level: category.confidence_level || "unknown",
  };
};

/**
 * Transforms a Plaid recurring transaction into a standardized RecurringTransaction object.
 * @param transaction - The Plaid recurring transaction.
 * @returns A standardized RecurringTransaction object.
 */
export const transformRecurringTransaction = (
  transaction: TransformRecurringTransaction,
): RecurringTransaction => {
  // transform the recurrent transaction frequency
  const frequency = transformRecurringTransactionFrequency(
    transaction.frequency,
  );

  // convert average_amount to amount
  const average_amount = transformRecurringTransactionAmount(
    transaction.average_amount,
  );

  // convert last_amount to amount
  const last_amount = transformRecurringTransactionAmount(
    transaction.last_amount,
  );

  // transform the status
  const status = transformRecurringTransactionStatus(transaction.status);

  // transform the personal finance category
  const personal_finance_category = transformRecurringTransactionCategory(
    transaction.personal_finance_category,
  );

  return {
    account_id: transaction.account_id,
    stream_id: transaction.stream_id,
    category: transaction.category,
    category_id: transaction.category_id,
    description: transaction.description,
    merchant_name: transaction.merchant_name,
    first_date: transaction.first_date,
    last_date: transaction.last_date,
    frequency: frequency,
    transaction_ids: transaction.transaction_ids,
    average_amount: average_amount,
    last_amount: last_amount,
    is_active: transaction.is_active,
    status: status,
    personal_finance_category: personal_finance_category,
    is_user_modified: transaction.is_user_modified,
    last_user_modified_datetime: transaction.last_user_modified_datetime,
  };
};
