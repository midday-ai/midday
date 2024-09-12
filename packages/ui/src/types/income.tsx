export interface MonthlyIncomeTransactionCountRecord {
  month: string;
  transactionCount: number;
}

export interface MonthlyIncomeByCategoryCountRecord {
  category: string;
  totalIncome: number;
}

export interface IncomeByDate {
  date: string;
  [category: string]: number | string;
}

export interface CategoryStats {
  category: string;
  percentage: number;
  total: Number;
  totalFormatted: string;
  color: string;
}

export interface CategoryChange {
  category: string;
  month: number;
  currentStat: number;
  previousStat: number | null;
  change: string;
  changeType: "positive" | "negative" | "neutral";
}

export interface IncomeOverTime {
  category: string;
  incomes: number[];
}
