import { formatCurrency } from "@/utils/currency";
import { Tables } from "@midday/supabase/types";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@midday/ui/sheet";
import { GitGraphIcon, TrendingUpDown } from "lucide-react";
import React, { useMemo } from "react";
import TransactionCategoryChart from "../charts/transaction-category-chart";

type Transaction = Tables<"transactions">;

interface TransactionAnalyticsProps {
  transactions: Transaction[];
  currency?: string;
}

interface AnalyticsResult {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  largestTransaction: Transaction | null;
  transactionCount: number;
  averageTransactionAmount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
  // New analytics
  categoryCounts: Record<string, number>;
  methodCounts: Record<string, number>;
  currencyCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  recurringTransactionsCount: number;
  manualTransactionsCount: number;
  averageBalance: number;
  mostFrequentMerchant: { name: string; count: number } | null;
}

const computeAnalytics = (transactions: Transaction[]): AnalyticsResult => {
  const initialAccumulator: AnalyticsResult = {
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    largestTransaction: null,
    transactionCount: 0,
    averageTransactionAmount: 0,
    incomeTransactionCount: 0,
    expenseTransactionCount: 0,
    categoryCounts: {},
    methodCounts: {},
    currencyCounts: {},
    statusCounts: {},
    recurringTransactionsCount: 0,
    manualTransactionsCount: 0,
    averageBalance: 0,
    mostFrequentMerchant: null,
  };

  const merchantCounts: Record<string, number> = {};

  return transactions.reduce((acc, transaction) => {
    const amount = Math.abs(transaction.amount);
    const isIncome = transaction.amount > 0;

    // Update merchant counts
    if (transaction.merchant_name) {
      merchantCounts[transaction.merchant_name] =
        (merchantCounts[transaction.merchant_name] || 0) + 1;
    }

    // Update category counts
    if (transaction.category) {
      acc.categoryCounts[transaction.category] =
        (acc.categoryCounts[transaction.category] || 0) + 1;
    }

    // Update method counts
    acc.methodCounts[transaction.method] =
      (acc.methodCounts[transaction.method] || 0) + 1;

    // Update currency counts
    acc.currencyCounts[transaction.currency] =
      (acc.currencyCounts[transaction.currency] || 0) + 1;

    // Update status counts
    if (transaction.status) {
      acc.statusCounts[transaction.status] =
        (acc.statusCounts[transaction.status] || 0) + 1;
    }

    return {
      ...acc,
      totalIncome: isIncome ? acc.totalIncome + amount : acc.totalIncome,
      totalExpenses: !isIncome ? acc.totalExpenses + amount : acc.totalExpenses,
      netCashFlow: acc.netCashFlow + transaction.amount,
      largestTransaction:
        amount > Math.abs(acc.largestTransaction?.amount ?? 0)
          ? transaction
          : acc.largestTransaction,
      transactionCount: acc.transactionCount + 1,
      averageTransactionAmount: acc.averageTransactionAmount + amount,
      incomeTransactionCount: isIncome
        ? acc.incomeTransactionCount + 1
        : acc.incomeTransactionCount,
      expenseTransactionCount: !isIncome
        ? acc.expenseTransactionCount + 1
        : acc.expenseTransactionCount,
      recurringTransactionsCount: transaction.recurring
        ? acc.recurringTransactionsCount + 1
        : acc.recurringTransactionsCount,
      manualTransactionsCount: transaction.manual
        ? acc.manualTransactionsCount + 1
        : acc.manualTransactionsCount,
      averageBalance: acc.averageBalance + (transaction.balance || 0),
    };
  }, initialAccumulator);
};

export const TransactionAnalytics: React.FC<TransactionAnalyticsProps> = ({
  transactions,
  currency = "USD",
}) => {
  const analytics = useMemo(
    () => computeAnalytics(transactions),
    [transactions],
  );
  const formatMoney = (amount: number) => formatCurrency(amount, currency);
  const averageAmount =
    analytics.transactionCount > 0
      ? analytics.averageTransactionAmount / analytics.transactionCount
      : 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <TrendingUpDown className="w-4 h-4 mr-2" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:min-w-[540px]">
        <SheetHeader className="p-[2%]">
          <SheetTitle className="text-3xl font-bold">
            Transaction Analytics
          </SheetTitle>
          <SheetDescription className="text-md">
            Detailed analysis of your transactions
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 py-2">
          <AnalyticsCard
            title="Income and Expenses"
            value={`Income: ${formatMoney(analytics.totalIncome)}`}
            subtext={`Expenses: ${formatMoney(analytics.totalExpenses)}`}
          />
          <AnalyticsCard
            title="Net Cash Flow"
            value={formatMoney(analytics.netCashFlow)}
            valueClassName={
              analytics.netCashFlow >= 0 ? "text-green-500" : "text-red-500"
            }
          />
          <AnalyticsCard
            title="Largest Transaction"
            value={
              analytics.largestTransaction
                ? formatMoney(Math.abs(analytics.largestTransaction.amount))
                : "N/A"
            }
            subtext={
              analytics.largestTransaction?.description ??
              "No transactions available"
            }
          />
          <AnalyticsCard
            title="Transaction Count"
            value={analytics.transactionCount.toString()}
            subtext={`Income: ${analytics.incomeTransactionCount}, Expenses: ${analytics.expenseTransactionCount}`}
          />
          <AnalyticsCard
            title="Average Transaction"
            value={formatMoney(averageAmount)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface AnalyticsCardProps {
  title: string;
  value: string;
  subtext?: string;
  valueClassName?: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtext,
  valueClassName = "",
}) => (
  <div className="border-none shadow-none">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {subtext && (
        <CardDescription className="text-sm mt-1">{subtext}</CardDescription>
      )}
    </CardHeader>
    <CardContent>
      <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
    </CardContent>
  </div>
);
