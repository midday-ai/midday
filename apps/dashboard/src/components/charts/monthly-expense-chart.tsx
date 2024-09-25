import { formatDate } from "@midday/import";
import { getMonthlyExpenses } from "@midday/supabase/cached-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { BarChart } from "@midday/ui/charts/base/bar-chart";
import {
  DataPoint,
  ZoomableChart,
} from "@midday/ui/charts/base/zoomable-chart";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import Link from "next/link";
import { AnimatedNumber } from "../animated-number";

type Props = {
  value: {
    from?: string;
    to?: string;
    period?: string;
  };
  defaultValue: {
    from: string;
    to: string;
    period: string;
  };
  disabled?: boolean;
  currency?: string;
};

type ExpenseData = {
  month: string;
  total_expense: number;
};

type ExpenseStatistics = {
  averageExpense: number;
  totalExpense: number;
  medianExpense: number;
  maxExpense: number;
  minExpense: number;
  monthWithMaxExpense: string;
  monthWithMinExpense: string;
  expenseGrowthRate: number;
  volatility: number;
  currency: string;
};

export async function MonthlyExpenseChart({
  value,
  defaultValue,
  disabled,
  currency = "USD",
}: Props) {
  const result = await getMonthlyExpenses({
    ...defaultValue,
    ...value,
    currency,
  });

  if (!result?.data) {
    return null;
  }

  const dataPoints: { date: string; value: number }[] = result.data.map(
    (item: ExpenseData) => ({
      date: item.month,
      value: item.total_expense,
    }),
  );

  const stats = computeExpenseStatistics(result.data, currency);

  return (
    <div
      className={cn(
        disabled && "pointer-events-none select-none",
        "overflow-y-auto scrollbar-hide",
      )}
    >
      <CardHeader className="flex flex-col gap-2">
        <div className="flex justify-between">
          <CardTitle className="font-bold text-2xl md:text-4xl">
            Monthly Expense Breakdown
          </CardTitle>
          <MonthlyExpenseTooltip />
        </div>

        <CardDescription className="max-w-xl">
          This chart provides a detailed view of your monthly expenses,
          including total expenses, category-wise breakdown, and key statistics.
          Use this information to identify spending patterns, high-expense
          categories, and opportunities for cost optimization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 p-[1%]">
        <ExpenseSummary stats={stats} />
        <BarChart data={dataPoints} currency={currency} />
      </CardContent>
    </div>
  );
}

function computeExpenseStatistics(
  data: ExpenseData[],
  currency: string,
): ExpenseStatistics {
  const expenses = data.map((item) => item.total_expense);
  const sortedExpenses = [...expenses].sort((a, b) => a - b);
  const totalExpense = expenses.reduce((sum, expense) => sum + expense, 0);
  const averageExpense = totalExpense / expenses.length;
  const medianExpense = sortedExpenses[Math.floor(sortedExpenses.length / 2)];
  const maxExpense = Math.max(...expenses);
  const minExpense = Math.min(...expenses);
  const monthWithMaxExpense =
    data.find((item) => item.total_expense === maxExpense)?.month ?? "";
  const monthWithMinExpense =
    data.find((item) => item.total_expense === minExpense)?.month ?? "";

  const expenseGrowthRate =
    expenses.length > 1 && expenses[0] !== 0
      ? ((expenses[expenses.length - 1]! - expenses[0]!) / expenses[0]!) * 100
      : 0;

  const squaredDiffs = expenses.map((expense) =>
    Math.pow(expense - averageExpense, 2),
  );
  const avgSquaredDiff =
    squaredDiffs.reduce((sum, diff) => sum + diff, 0) / expenses.length;
  const volatility = Math.sqrt(avgSquaredDiff);

  return {
    averageExpense,
    totalExpense,
    medianExpense: medianExpense ?? 0,
    maxExpense,
    minExpense,
    monthWithMaxExpense,
    monthWithMinExpense,
    expenseGrowthRate,
    volatility,
    currency,
  };
}

function ExpenseSummary({ stats }: { stats: ExpenseStatistics }) {
  return (
    <div className="space-y-4 mb-14 select-text">
      <div className="gap-2 flex flex-1 overflow-x-auto scrollbar-hide">
        <StatItem
          label="Average Monthly Expense"
          value={stats.averageExpense}
          currency={stats.currency}
        />
        <StatItem
          label="Total Expenses"
          value={stats.totalExpense}
          currency={stats.currency}
        />
        <StatItem
          label="Median Monthly Expense"
          value={stats.medianExpense}
          currency={stats.currency}
        />
        <StatItem
          label="Highest Monthly Expense"
          value={stats.maxExpense}
          currency={stats.currency}
          subLabel={stats.monthWithMaxExpense}
        />
        <StatItem
          label="Lowest Monthly Expense"
          value={stats.minExpense}
          currency={stats.currency}
          subLabel={stats.monthWithMinExpense}
        />
        <StatItem
          label="Expense Growth Rate"
          value={stats.expenseGrowthRate}
          suffix="%"
        />
        <StatItem
          label="Expense Volatility"
          value={stats.volatility}
          currency={stats.currency}
        />
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  currency,
  suffix,
  subLabel,
}: {
  label: string;
  value: number;
  currency?: string;
  suffix?: string;
  subLabel?: string;
}) {
  return (
    <Card className="p-6 bg-background text-foreground rounded-2xl">
      <div className="grid gap-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{subLabel}</div>
      </div>
      <div className="flex items-baseline mt-4 gap-2">
        <div className="text-4xl font-bold">
          <AnimatedNumber value={value} currency={currency ?? "USD"} />
        </div>
        <div className="text-sm font-medium">{currency}</div>
      </div>
    </Card>
  );
}

function MonthlyBreakdown({
  breakdown,
  currency,
}: {
  breakdown: Array<{
    month: string;
    total: number;
    categories: { [category: string]: number };
  }>;
  currency: string;
}) {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Monthly Expense Breakdown</h3>
      <div className="space-y-4">
        {breakdown.map(({ month, total, categories }) => (
          <div key={month} className="bg-gray-100 p-4 rounded-lg">
            <h4 className="text-lg font-medium mb-2">
              {month} - Total:{" "}
              <AnimatedNumber value={total} currency={currency} />
            </h4>
            <ul className="space-y-1">
              {Object.entries(categories).map(([category, amount]) => (
                <li key={category} className="flex justify-between text-sm">
                  <span>{category}</span>
                  <span>
                    <AnimatedNumber value={amount} currency={currency} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyExpenseTooltip() {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icons.Info className="h-4 w-4 mt-1" />
        </TooltipTrigger>
        <TooltipContent
          className="text-xs text-[#878787] max-w-[240px] p-4"
          side="bottom"
          sideOffset={10}
        >
          <div className="space-y-2">
            <h3 className="font-medium text-primary">
              Monthly Expense Breakdown
            </h3>
            <p>
              This chart provides a detailed view of your monthly expenses,
              including total expenses, category-wise breakdown, and key
              statistics. Use this information to identify spending patterns,
              high-expense categories, and opportunities for cost optimization.
            </p>
            <p>
              All amounts are converted into your{" "}
              <Link
                href="/settings/accounts"
                className="text-primary underline"
              >
                base currency
              </Link>
              .
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
