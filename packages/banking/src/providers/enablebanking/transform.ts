import { createHash } from "node:crypto";
import { capitalCase } from "change-case";
import type {
  Account,
  ConnectionStatus,
  GetAccountBalanceResponse,
  Transaction,
} from "../../types";
import type { AccountType } from "../../utils/account";
import { isValidCurrency } from "../../utils/currency";
import { getLogoURL } from "../../utils/logo";
import type {
  GetAccountDetailsResponse,
  GetBalancesResponse,
  GetExchangeCodeResponse,
  GetSessionResponse,
  GetTransaction,
  Institution,
  TransformInstitution,
} from "./types";

export function hashInstitutionId(name: string, country?: string): string {
  const input = `${name}-${country}`;
  return createHash("md5").update(input).digest("hex").slice(0, 12);
}

export const transformInstitution = (
  institution: Institution,
): TransformInstitution => ({
  id: hashInstitutionId(institution.name, institution.country),
  name: institution.name,
  logo: getLogoURL(institution.name, "png"),
  provider: "enablebanking",
});

function getAccountName(account: GetAccountDetailsResponse) {
  if (account.product) {
    return capitalCase(account.product);
  }

  if (account.name) {
    return capitalCase(account.name);
  }

  if (account.details) {
    return capitalCase(account.details);
  }

  return "Account";
}

/**
 * Maps Enable Banking cash_account_type (ISO 20022) to Midday AccountType
 * - CACC: Current account → depository
 * - CARD: Card account → credit
 * - SVGS: Savings account → depository
 * - LOAN: Loan account → loan
 * - CASH: Cash account → depository
 */
function getAccountType(cashAccountType?: string): AccountType {
  switch (cashAccountType) {
    case "CARD":
      return "credit";
    case "LOAN":
      return "loan";
    default:
      return "depository";
  }
}

/**
 * Get available balance from EnableBanking balance.
 * EnableBanking returns balance_type which can indicate available balance.
 *
 * ISO 20022 balance types include:
 * - closingAvailable, interimAvailable, openingAvailable, forwardAvailable → available funds
 * - closingBooked, interimBooked, openingBooked → posted/booked balance (NOT available)
 *
 * Only "available" types represent available funds. The "interim" prefix indicates
 * intraday snapshot, NOT available balance.
 */
const isAvailableBalanceType = (type?: string): boolean =>
  !!type &&
  (type.toLowerCase().includes("available") ||
    type === "ITAV" ||
    type === "CLAV" ||
    type === "OPAV");

const getAvailableBalance = (
  balance: GetAccountDetailsResponse["balance"],
): number | null => {
  if (isAvailableBalanceType(balance?.balance_type)) {
    return +balance.balance_amount.amount;
  }
  return null;
};

export const transformAccount = (
  account: GetAccountDetailsResponse,
): Account => {
  const accountType = getAccountType(account.cash_account_type);
  const rawAmount = +account.balance.balance_amount.amount;

  const amount =
    accountType === "credit" && rawAmount < 0 ? Math.abs(rawAmount) : rawAmount;

  const currency = isValidCurrency(account.currency)
    ? account.currency
    : isValidCurrency(account.balance.balance_amount.currency)
      ? account.balance.balance_amount.currency
      : account.currency;

  return {
    id: account.uid,
    name: getAccountName(account),
    currency,
    type: accountType,
    institution: {
      id: hashInstitutionId(
        account.institution.name,
        account.institution.country,
      ),
      name: account.institution.name,
      logo: getLogoURL(account.institution.name, "png"),
      provider: "enablebanking",
    },
    balance: {
      amount,
      currency,
    },
    enrollment_id: null,
    resource_id: account.identification_hash,
    expires_at: account.valid_until,
    iban: account.account_id?.iban || null,
    subtype: account.cash_account_type?.toLowerCase() || null, // CACC, CARD, SVGS, LOAN, CASH
    bic: account.account_servicer?.bic_fi || null,
    // US bank details not available for EnableBanking (EU/UK provider)
    routing_number: null,
    wire_routing_number: null,
    account_number: null,
    sort_code: null,
    // Credit account balances - EnableBanking provides credit_limit directly
    available_balance: getAvailableBalance(account.balance),
    credit_limit: account.credit_limit?.amount
      ? +account.credit_limit.amount
      : null,
  };
};

export const transformSessionData = (session: GetExchangeCodeResponse) => {
  return {
    session_id: session.session_id,
    expires_at: session.access.valid_until,
    access: session.access,
    accounts: session.accounts.map((account) => ({
      account_reference: account.identification_hash,
      account_id: account.uid,
    })),
  };
};

type TransformBalanceParams = {
  balance: GetBalancesResponse["balances"][0];
  balances?: GetBalancesResponse["balances"];
  creditLimit?: { currency: string; amount: string } | null;
  accountType?: string;
};

/**
 * Transform Enable Banking balance to internal format.
 *
 * Enable Banking typically returns positive values for credit card debt.
 * Normalization is added for safety and consistency with other providers.
 */
export const transformBalance = ({
  balance,
  balances,
  creditLimit,
  accountType,
}: TransformBalanceParams): GetAccountBalanceResponse => {
  const rawAmount = +balance.balance_amount.amount;

  // Normalize credit card balances to positive (amount owed) for consistency
  const amount =
    accountType === "credit" && rawAmount < 0 ? Math.abs(rawAmount) : rawAmount;

  // Resolve currency first — needed to filter available balance by currency
  const candidates = [
    balance.balance_amount.currency,
    ...(balances?.map((b) => b.balance_amount.currency) ?? []),
  ];
  const currency =
    candidates.find((c) => isValidCurrency(c)) ??
    balance.balance_amount.currency;

  // Find available balance: prefer same currency, then any available entry
  const availableEntry =
    balances?.find(
      (b) =>
        isAvailableBalanceType(b.balance_type) &&
        b.balance_amount.currency.toUpperCase() === currency.toUpperCase(),
    ) ?? balances?.find((b) => isAvailableBalanceType(b.balance_type));
  const rawAvailable = availableEntry
    ? +availableEntry.balance_amount.amount
    : isAvailableBalanceType(balance.balance_type)
      ? rawAmount
      : null;
  const availableBalance =
    rawAvailable !== null && accountType === "credit" && rawAvailable < 0
      ? Math.abs(rawAvailable)
      : rawAvailable;

  return {
    amount,
    currency,
    available_balance: availableBalance,
    credit_limit: creditLimit?.amount ? +creditLimit.amount : null,
  };
};

export const transformConnectionStatus = (
  session: GetSessionResponse,
): ConnectionStatus => ({
  status: session.status === "AUTHORIZED" ? "connected" : "disconnected",
});

export const transformTransactionName = (
  transaction: GetTransaction,
): string => {
  // Try to get name from remittance information first
  if (
    transaction.remittance_information?.length &&
    transaction.remittance_information[0] !== ""
  ) {
    return transaction.remittance_information[0]!;
  }

  // Try creditor/debtor name
  if (
    transaction.credit_debit_indicator === "CRDT" &&
    transaction.debtor?.name
  ) {
    return transaction.debtor.name;
  }
  if (
    transaction.credit_debit_indicator === "DBIT" &&
    transaction.creditor?.name
  ) {
    return transaction.creditor.name;
  }

  // Fall back to bank transaction description if available
  if (transaction.bank_transaction_code?.description) {
    return transaction.bank_transaction_code.description;
  }

  // Use reference number as last resort
  if (transaction.reference_number) {
    return transaction.reference_number;
  }

  // Default fallback
  return "No information";
};

type TransformTransactionCategory = {
  transaction: GetTransaction;
  accountType: AccountType;
};

export const transformTransactionCategory = ({
  transaction,
  accountType,
}: TransformTransactionCategory) => {
  const amount = +transaction.transaction_amount.amount;
  const isCredit = transaction.credit_debit_indicator === "CRDT";

  // For credit (money IN)
  if (isCredit && amount > 0) {
    // For credit card accounts, money IN is usually a payment, not income
    if (accountType === "credit") {
      // Check if it's a transfer/payment type
      const description = transaction.bank_transaction_code?.description;
      if (description === "Transfer" || description === "Payment") {
        return "credit-card-payment";
      }
      // Otherwise it's likely a refund - don't auto-categorize
      return null;
    }
    return "income";
  }

  return null;
};

export const transformTransactionMethod = (transaction: GetTransaction) => {
  if (transaction.credit_debit_indicator === "CRDT") {
    return "payment";
  }

  // Transfer
  if (transaction.bank_transaction_code?.description === "Transfer") {
    return "transfer";
  }

  return "other";
};

type TransactionDescription = {
  transaction: GetTransaction;
  name: string;
};

const transformDescription = ({
  transaction,
  name,
}: TransactionDescription) => {
  if (
    transaction?.remittance_information?.length &&
    transaction.remittance_information.some(
      (info) => info && info.trim() !== "",
    )
  ) {
    const text = transaction.remittance_information
      .filter((info) => info && info.trim() !== "")
      .join(" ");
    const description = capitalCase(text);

    // NOTE: Sometimes the description is the same as name
    // Let's skip that and just save if they are not the same
    if (description !== name) {
      return description;
    }
  }

  return null;
};

const formatAmount = (transaction: GetTransaction): number => {
  const amount = +transaction.transaction_amount.amount;
  return transaction.credit_debit_indicator === "CRDT" ? amount : -amount;
};

const transformCounterpartyName = (transaction: GetTransaction) => {
  const { credit_debit_indicator, debtor, creditor } = transaction;

  if (credit_debit_indicator === "CRDT" && debtor?.name) {
    return capitalCase(debtor.name);
  }

  if (credit_debit_indicator === "DBIT" && creditor?.name) {
    return capitalCase(creditor.name);
  }

  return null;
};

type TransformTransactionPayload = {
  transaction: GetTransaction;
  accountType: AccountType;
};

/**
 * Generate a stable transaction ID when entry_reference is missing.
 * Uses EnableBanking's recommended "fundamental values" for matching.
 * @see https://enablebanking.com/blog/2024/10/29/how-to-sync-account-transactions-from-open-banking-apis-without-unique-transaction-ids
 */
function generateTransactionId(transaction: GetTransaction): string {
  if (transaction.entry_reference) {
    return transaction.entry_reference;
  }

  // Use transaction_id if available (bank-specific ID)
  if (transaction.transaction_id) {
    return transaction.transaction_id;
  }

  // Use fundamental values + additional discriminators for stable ID
  // balance_after_transaction is particularly useful as it's unique per transaction
  // in a sequence (running balance changes with each transaction)
  // Use empty string for null/undefined to preserve positional information
  // (filtering would cause collisions when different nullable fields have same value)
  const input = [
    transaction.booking_date,
    transaction.value_date,
    transaction.transaction_amount.amount,
    transaction.transaction_amount.currency,
    transaction.credit_debit_indicator,
    transaction.reference_number,
    transaction.remittance_information?.join("|"),
    transaction.balance_after_transaction?.amount,
  ]
    .map((v) => v ?? "")
    .join("-");

  return createHash("md5").update(input).digest("hex");
}

export const transformTransaction = ({
  transaction,
  accountType,
}: TransformTransactionPayload): Transaction => {
  const name = capitalCase(transformTransactionName(transaction));
  const description = transformDescription({ transaction, name });

  return {
    id: generateTransactionId(transaction),
    amount: formatAmount(transaction),
    currency: transaction.transaction_amount.currency,
    date: transaction.booking_date,
    status: "posted",
    balance: transaction.balance_after_transaction
      ? +transaction.balance_after_transaction.amount
      : null,
    category: transformTransactionCategory({ transaction, accountType }),
    counterparty_name: transformCounterpartyName(transaction),
    merchant_name: null,
    method: transformTransactionMethod(transaction),
    name,
    description,
    currency_rate: null,
    currency_source: null,
  };
};
