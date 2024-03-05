import { capitalCase } from "change-case";
import {
  Account as BaseAccount,
  Transaction as BaseTransaction,
} from "../types";
import {
  DetailCategory,
  TransformAccountParams,
  TransformTransaction,
} from "./types";

export const mapTransactionMethod = (method?: string) => {
  switch (method) {
    case "Payment":
    case "Bankgiro payment":
    case "Incoming foreign payment":
      return "payment";
    case "Card purchase":
    case "Card foreign purchase":
      return "card_purchase";
    case "Card ATM":
      return "card_atm";
    case "Transfer":
      return "transfer";
    default:
      return "other";
  }
};

// travel: "travel",
// office_supplies: "office_supplies",
// meals: "meals",
// software: "software",
// rent: "rent",
// income: "income",
// equipment: "equipment",
// salary: "salary",
// transfer: "transfer",
// internet_and_telephone: "internet_and_telephone",
// facilities_expenses: "facilities_expenses",
// activity: "activity",
// uncategorized: "uncategorized",
// fees: "fees",
// taxes: "taxes",
// other: "other",

export const mapTransactionCategory = (category?: DetailCategory) => {
  switch (category) {
    // case "accommodation":
    //   break;

    default:
      return "uncategorized";
  }
};

export const transformTransaction = ({
  transaction,
  teamId,
  bankAccountId,
}: TransformTransaction): BaseTransaction => {
  const method = mapTransactionMethod(transaction.type);

  return {
    date: transaction.date,
    name: transaction.description && capitalCase(transaction.description),
    method,
    internal_id: `${teamId}_${transaction.id}`,
    amount: transaction.amount,
    currency: "USD",
    bank_account_id: bankAccountId,
    category:
      +transaction.amount > 0
        ? "income"
        : mapTransactionCategory(transaction?.details?.category),
    team_id: teamId,
    balance: transaction.running_balance,
    status: transaction?.status === "posted" ? "posted" : "pending",
  };
};

export const transformAccount = ({
  id,
  name,
  currency,
  institution,
  enrolmentId,
}: TransformAccountParams): BaseAccount => {
  return {
    id,
    name,
    currency,
    institution: {
      ...institution,
      logo: `https://teller.io/images/banks/${institution.id}.jpg`,
    },
    enrollment_id: enrolmentId,
    provider: "teller",
  };
};
