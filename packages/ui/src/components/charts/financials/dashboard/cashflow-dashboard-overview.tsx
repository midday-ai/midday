import { ExpenseMetrics, IncomeMetrics } from "client-typescript-sdk";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import React from 'react';
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import { cn } from "../../../../utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "../../../card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../tabs";
import { NetExpenseChart } from "../expenses/net-expense-chart";
import { NetIncomeChart } from "../net-income/net-income-chart";

export interface CashflowDashboardOverviewProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  title?: string;
  disabled?: boolean;
  incomeMetrics: IncomeMetrics[];
  expenseMetrics: ExpenseMetrics[];
}

export const CashflowDashboardOverview: React.FC<CashflowDashboardOverviewProps> = ({
  className,
  title = "Cashflow Dashboard Overview",
  disabled,
  incomeMetrics,
  expenseMetrics,
  ...rest
}) => {
  const rootClassName = cn(
    "w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 rounded-xl shadow-lg",
    className,
    disabled && "opacity-50 pointer-events-none"
  );

  if (disabled) {
    expenseMetrics = FinancialDataGenerator.generateExpenseMetricsAcrossManyYears(2022, 2024);
    incomeMetrics = FinancialDataGenerator.generateIncomeMetricsAcrossManyYears(2022, 2024);
  }

  const totalIncome = incomeMetrics.reduce((sum, metric) => sum + (metric.totalIncome ?? 0), 0);
  const totalExpense = expenseMetrics.reduce((sum, metric) => sum + (metric.totalExpenses ?? 0), 0);
  const netCashflow = totalIncome - totalExpense;

  return (
    <div className={rootClassName} {...rest}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Income"
            value={totalIncome}
            icon={<DollarSign className="h-8 w-8 text-green-500" />}
            trend={totalIncome > 0 ? "up" : "down"}
          />
          <StatCard
            title="Total Expense"
            value={totalExpense}
            icon={<DollarSign className="h-8 w-8 text-red-500" />}
            trend={totalExpense > 0 ? "up" : "down"}
          />
          <StatCard
            title="Net Cashflow"
            value={netCashflow}
            icon={<DollarSign className="h-8 w-8 text-blue-500" />}
            trend={netCashflow > 0 ? "up" : "down"}
          />
        </div>

        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
          </TabsList>
          <TabsContent value="income">
            <div>
              <CardContent className="pt-6">
                <NetIncomeChart
                  disabled={disabled}
                  incomeMetrics={incomeMetrics}
                  currency="USD"
                  title="Net Income"
                  price={totalIncome}
                  priceChange={(totalIncome / (totalIncome - netCashflow) - 1) * 100}
                />
              </CardContent>
            </div>
          </TabsContent>
          <TabsContent value="expense">
            <div>
              <CardContent className="pt-6">
                <NetExpenseChart
                  disabled={disabled}
                  expenseMetrics={expenseMetrics}
                  currency="USD"
                  title="Net Expense"
                  price={totalExpense}
                  priceChange={(totalExpense / (totalExpense - netCashflow) - 1) * 100}
                />
              </CardContent>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${value.toLocaleString()}</p>
        </div>
        <div className="flex items-center space-x-2">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CashflowDashboardOverview;