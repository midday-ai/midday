import { formatCurrency } from "@/utils/currency";
import { Tables } from "@midday/supabase/types";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@midday/ui/chart";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@midday/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { TrendingUp, TrendingUpDown } from "lucide-react";
import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

  const result = transactions.reduce((acc, transaction) => {
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

  // Determine the most frequent merchant
  const mostFrequentMerchantEntry = Object.entries(merchantCounts).reduce(
    (max, entry) => (entry[1] > max[1] ? entry : max),
    ["", 0],
  );
  result.mostFrequentMerchant = {
    name: mostFrequentMerchantEntry[0],
    count: mostFrequentMerchantEntry[1],
  };

  return result;
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#A28FD0",
  "#FF6699",
  "#FFCC99",
];

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

  const categoryData = useMemo(
    () =>
      Object.entries(analytics.categoryCounts).map(([name, value]) => ({
        name,
        value,
      })),
    [analytics.categoryCounts],
  );

  const methodData = useMemo(
    () =>
      Object.entries(analytics.methodCounts).map(([name, value]) => ({
        name,
        value,
      })),
    [analytics.methodCounts],
  );

  const dailyCashFlow = useMemo(() => {
    const dailyData: Record<string, number> = {};
    transactions.forEach((t) => {
      const date = new Date(t.date).toISOString().split("T")[0];
      dailyData[date as any] = (dailyData[date as any] || 0) + t.amount;
    });
    return Object.entries(dailyData)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  // Define chartConfig for ChartContainer
  const chartConfig = {
    amount: {
      label: "Cash Flow",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <TrendingUpDown className="w-4 h-4 mr-2" strokeWidth={0.5} />
          Analytics
        </Button>
      </SheetTrigger>
      <SheetContent className="md:min-w-[80%] sm:max-w-none">
        <SheetHeader>
          <SheetTitle className="text-3xl font-bold">
            Transaction Analytics
          </SheetTitle>
          <SheetDescription>
            Comprehensive analysis of your financial transactions
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="overview" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-4 mt-4">
              <AnalyticsCard
                title="Total Income"
                value={formatMoney(analytics.totalIncome)}
                subtext={`${analytics.incomeTransactionCount} transactions`}
              />
              <AnalyticsCard
                title="Total Expenses"
                value={formatMoney(analytics.totalExpenses)}
                subtext={`${analytics.expenseTransactionCount} transactions`}
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
                  analytics.largestTransaction?.description ?? "No transactions"
                }
              />
              <AnalyticsCard
                title="Average Transaction"
                value={formatMoney(
                  analytics.averageTransactionAmount /
                    analytics.transactionCount,
                )}
              />
              <AnalyticsCard
                title="Transaction Count"
                value={analytics.transactionCount.toString()}
                subtext={`Recurring: ${analytics.recurringTransactionsCount}, Manual: ${analytics.manualTransactionsCount}`}
              />
            </div>
          </TabsContent>
          <TabsContent value="details">
            <div className="grid grid-cols-1 gap-4 mt-4">
              <AnalyticsCard
                title="Most Used Currency"
                value={
                  Object.entries(analytics.currencyCounts).sort(
                    (a, b) => b[1] - a[1],
                  )[0]?.[0] || "N/A"
                }
                subtext="Based on transaction count"
              />
              <AnalyticsCard
                title="Most Common Status"
                value={
                  Object.entries(analytics.statusCounts).sort(
                    (a, b) => b[1] - a[1],
                  )[0]?.[0] || "N/A"
                }
                subtext="Based on transaction count"
              />
              <AnalyticsCard
                title="Average Balance"
                value={formatMoney(
                  analytics.averageBalance / analytics.transactionCount,
                )}
                subtext="Across all transactions"
              />
              <AnalyticsCard
                title="Most Frequent Merchant"
                value={analytics.mostFrequentMerchant?.name || "N/A"}
                subtext={`${analytics.mostFrequentMerchant?.count || 0} transactions`}
              />
              <AnalyticsCard
                title="Recurring Transactions"
                value={`${analytics.recurringTransactionsCount} (${((analytics.recurringTransactionsCount / analytics.transactionCount) * 100).toFixed(1)}%)`}
                subtext="Of total transactions"
              />
              <AnalyticsCard
                title="Manual Transactions"
                value={`${analytics.manualTransactionsCount} (${((analytics.manualTransactionsCount / analytics.transactionCount) * 100).toFixed(1)}%)`}
                subtext="Of total transactions"
              />
            </div>
          </TabsContent>
        </Tabs>
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
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {subtext && <CardDescription>{subtext}</CardDescription>}
    </CardHeader>
    <CardContent>
      <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
    </CardContent>
  </Card>
);
