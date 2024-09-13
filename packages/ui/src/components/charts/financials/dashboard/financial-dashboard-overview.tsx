
import { FinancialExpenseAndIncomeMetricsConverter } from "../../../../lib/converters/expense-and-income-metrics-converter";
import { cn } from "../../../../utils/cn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../tabs";
import { ExpenseMetrics, IncomeMetrics, Transaction } from "client-typescript-sdk";
import React, { useMemo } from 'react';
import { CategoryChart } from "../categories/category-horizontal-chart";
import { NetExpenseChart } from "../expenses/net-expense-chart";
import { NetIncomeChart } from "../net-income/net-income-chart";
import { TransactionsToReview } from "../transactions/transactions-to-review";

export interface MonthlySpendingChartProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    title?: string;
    disabled?: boolean;
    transactions: Transaction[];
    expenseMetrics: ExpenseMetrics[];
    incomeMetrics: IncomeMetrics[];
}

export const MonthlySpendingChart: React.FC<MonthlySpendingChartProps> = ({ className, title, disabled, transactions, expenseMetrics, incomeMetrics, ...rest }) => {
    const rootClassName = cn("grid gap-4 w-full", className, disabled && "opacity-50 pointer-events-none");

    const expenseByCategory = useMemo(() => {
        if (expenseMetrics && expenseMetrics.length === 0) {
            return [];
        }

        const categories = FinancialExpenseAndIncomeMetricsConverter.computeExpenseByCategory(expenseMetrics);
        return categories;
    }, [expenseMetrics]);

    const incomeByCategory = useMemo(() => {
        if (incomeMetrics && incomeMetrics.length === 0) {
            return [];
        }
        const categories = FinancialExpenseAndIncomeMetricsConverter.computeIncomeByCategory(incomeMetrics);
        return categories;
    }, [incomeMetrics]);


    return (
        <div {...rest} className={rootClassName}>
            {title && <h2 className="text-xl sm:text-2xl font-bold mb-4">{title}</h2>}

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid grid-cols-2 w-fit rounded-2xl">
                    <TabsTrigger value="spending">Spending</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                </TabsList>
                <TabsContent value="spending">
                    {/* Monthly spending chart */}
                    <div className="min-h-64 sm:min-h-96 rounded-lg py-4">
                        <NetExpenseChart disabled={disabled} expenseMetrics={expenseMetrics} currency={"USD"} title={"Net Expense"} price={1000} priceChange={20} />
                        {/* Add your chart component here */}
                    </div>
                </TabsContent>
                <TabsContent value="income">
                    {/* Monthly income chart */}
                    <div className="min-h-64 sm:min-h-96 rounded-lg py-4">
                        <NetIncomeChart disabled={disabled} incomeMetrics={incomeMetrics} currency={"USD"} title={"Net Income"} price={1000} priceChange={20} />
                    </div>
                </TabsContent>
            </Tabs>

            {/* Accounts, top categories, and transaction to review */}
            <div className="grid gap-4">
                {expenseByCategory && incomeByCategory && (
                    <div className="rounded-lg p-4 md:h-full grid grid-cols-2">
                        <div className="mt-6">
                            <CategoryChart data={expenseByCategory} title={"Top Expense Category"} description={"Expense by Category over time"} />
                        </div>
                        <div className="mt-6">
                            <CategoryChart data={incomeByCategory} title={"Top Income Category"} description={"Income by Category over time"} />
                        </div>
                    </div>
                )}
                <div>
                    {transactions && (
                        <div className="rounded-lg py-4 md:h-full">
                            <TransactionsToReview transactions={transactions} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


