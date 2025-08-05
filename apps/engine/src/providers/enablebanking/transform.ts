import { createHash } from "node:crypto";
import { getLogoURL } from "@engine/utils/logo";
import { capitalCase } from "change-case";
import type { Account, Balance, ConnectionStatus, Transaction } from "../types";
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

export const transformAccount = (
  account: GetAccountDetailsResponse,
): Account => {
  return {
    id: account.uid,
    name: getAccountName(account),
    currency: account.currency,
    type: "depository",
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
      amount: Number.parseFloat(account.balance.balance_amount.amount),
      currency: account.currency,
    },
    enrollment_id: null,
    resource_id: account.identification_hash,
    expires_at: account.valid_until,
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

export const transformBalance = (
  balance: GetBalancesResponse["balances"][0],
): Balance => ({
  amount: Number.parseFloat(balance.balance_amount.amount),
  currency: balance.balance_amount.currency,
});

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
    return transaction.remittance_information[0];
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

export const transformTransactionCategory = (transaction: GetTransaction) => {
  // Income
  if (
    transaction.credit_debit_indicator === "CRDT" &&
    +transaction.transaction_amount.amount > 0
  ) {
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

export const transformTransaction = (
  transaction: GetTransaction,
): Transaction => {
  const name = capitalCase(transformTransactionName(transaction));
  const description = transformDescription({ transaction, name });

  return {
    id: transaction.entry_reference,
    amount: formatAmount(transaction),
    currency: transaction.transaction_amount.currency,
    date: transaction.booking_date,
    status: "posted",
    balance: transaction.balance_after_transaction
      ? Number.parseFloat(transaction.balance_after_transaction.amount)
      : null,
    category: transformTransactionCategory(transaction),
    counterparty_name: transformCounterpartyName(transaction),
    merchant_name: null,
    method: transformTransactionMethod(transaction),
    name,
    description,
    currency_rate: null,
    currency_source: null,
  };
};
