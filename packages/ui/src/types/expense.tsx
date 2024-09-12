export interface ExpenseTransactionCountByDate {
  date: string;
  [category: string]: number | string;
}

export interface ExpenseByDate {
  date: string;
  [category: string]: number | string;
}
