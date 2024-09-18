import { Providers } from "@/common/schema";
import { getType } from "@/utils/account";
import { getLogoURL } from "@/utils/logo";
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
  // Priority checks
  if (transaction.type === "transfer") return "transfer";
  if (transaction.type === "fee") return "fees";
  if (amount > 0) return "income";

  // Detailed category mapping
  const category = transaction?.details?.category?.toLowerCase() || "other";
  const description = transaction.description?.toLowerCase();

  // Helper function to check if any keyword is in the description
  const hasKeyword = (keywords: string[]) =>
    keywords.some((keyword) => description?.includes(keyword));

  switch (true) {
    case ["bar", "dining", "groceries", "restaurant", "food"].includes(
      category,
    ):
    case hasKeyword(["restaurant", "cafe", "coffee", "burger", "pizza"]):
      return "meals";

    case ["transport", "transportation", "travel"].includes(category):
    case hasKeyword(["airline", "hotel", "uber", "lyft", "taxi", "train"]):
      return "travel";

    case category === "tax" || hasKeyword(["tax", "irs"]):
      return "taxes";

    case ["office", "supplies"].includes(category):
    case hasKeyword(["office", "staples", "paper", "printer"]):
      return "office-supplies";

    case ["phone", "internet", "utilities"].includes(category):
    case hasKeyword(["phone", "mobile", "internet", "cable", "utility"]):
      return "internet-and-telephone";

    case category === "software" ||
      hasKeyword(["software", "app", "subscription"]):
      return "software";

    case ["entertainment", "sport", "recreation"].includes(category):
    case hasKeyword(["movie", "theatre", "concert", "gym", "fitness"]):
      return "activity";

    case ["utilities", "electronics", "hardware"].includes(category):
    case hasKeyword(["electric", "water", "gas", "computer", "phone"]):
      return "equipment";

    case hasKeyword(["health", "doctor", "hospital", "pharmacy"]):
      return "healthcare";

    case hasKeyword(["education", "school", "college", "university", "course"]):
      return "education";

    case hasKeyword(["charity", "donation"]):
      return "donations";

    default:
      return "other";
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
    status: transaction?.status === "posted" ? "posted" : "pending",
    bank_account_id: transaction.account_id,
    internal_id: transaction.id,
    account_id: transaction.account_id,
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
    currency,
    enrollment_id: enrollment_id,
    institution: transformInstitution(institution),
    type: getType(type),
    balance: transformAccountBalance(balance),
  };
};

export const transformAccountBalance = (
  account: TransformAccountBalance,
): BaseAccountBalance => ({
  currency: account.currency,
  amount: +account.amount,
});

export const transformInstitution = (institution: TransformInstitution) => ({
  id: institution.id,
  name: institution.name,
  logo: getLogoURL(institution.id),
  provider: Providers.Enum.teller,
});
