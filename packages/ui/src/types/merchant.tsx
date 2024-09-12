import { Transaction } from "client-typescript-sdk";

export interface MerchantAnalysisMetrics {
  medianTransactionAmount: Map<string, number>;
  highestTransaction: Map<string, number>;
  lowestTransaction: Map<string, number>;
  transactionAmountStdDev: Map<string, number>;
  percentageOfTotalTransactions: Map<string, number>;
}

export interface MerchantSpendMetrics {
  totalSpend: Map<string, number>;
  averageTransactionAmount: Map<string, number>;
  transactionCount: Map<string, number>;
  spendGrowthRate: Map<string, number>;
}

export type TransformedTransaction = Transaction & {
  date: string;
};

export type SpendingPeriod =
  | "spentLastWeek"
  | "spentLastTwoWeeks"
  | "spentLastMonth"
  | "spentLastSixMonths"
  | "spentLastYear"
  | "spentLastTwoYears";
