import { formatDate } from "../../../../lib/converters/date-formater";
import {
  FinancialExpenseAndIncomeMetricsConverter,
  FinancialMetricsTransactionConverter,
} from "../../../../lib/converters/expense-and-income-metrics-converter";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Badge } from "../../../badge";
import { Card } from "../../../card";
import { cn } from "../../../../utils/cn";
import { Sheet, SheetContent, SheetTrigger } from "../../../sheet";
import { Table, TableBody, TableCell, TableRow } from "../../../table";
import { ExpenseMetrics, Transaction } from "client-typescript-sdk";
import { useMemo } from "react";
import { BarChart } from "../../base/bar-chart";

export interface SpendingOverTimeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  title: string;
  viewMoreHref?: string;
  price: number;
  priceChange: number;
  expenseMetrics: ExpenseMetrics[];
  disabled?: boolean;
  budgetedAmount?: number;
  transactions?: Array<Transaction>;
}

export const SpendingOverTime: React.FC<SpendingOverTimeProps> = ({
  className,
  title,
  disabled,
  viewMoreHref,
  price,
  priceChange,
  expenseMetrics,
  budgetedAmount,
  transactions,
  ...rest
}) => {
  const rootClassName = cn(
    "w-full max-w-4xl bg-background text-foreground p-6",
    className,
    disabled && "opacity-50 pointer-events-none",
  );
  // generate the net Expense data if disabled
  if (disabled) {
    expenseMetrics =
      FinancialDataGenerator.generateExpenseMetricsAcrossManyYears(2022, 2024);
  }

  // compute the current month's expense
  const monthlyExpense =
    FinancialExpenseAndIncomeMetricsConverter.calculateMonthlyTotals(
      expenseMetrics,
      "expense",
    );

  const hasData = expenseMetrics.length > 0;

  const data = useMemo(() => {
    return FinancialExpenseAndIncomeMetricsConverter.convertDataToChartDataPoints(
      expenseMetrics,
      "expense",
    );
  }, [expenseMetrics]);
  0;

  // get the current month as this is the last month
  const currentMonthExpense = monthlyExpense[monthlyExpense.length - 1];

  // take the transactions and break them down into months
  const transactionsByMonth = useMemo(() => {
    return transactions
      ? FinancialMetricsTransactionConverter.breakTransactionsByMonth(
          transactions,
        )
      : {};
  }, [transactions]);

  return (
    <Card className="bg-[#0b1727] text-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Monthly spending</h2>
        <Sheet>
          <SheetTrigger asChild>
            <button className="text-sm text-foreground flex items-center gap-2">
              Transactions
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent className="w-full md:min-w-[80%] overflow-y-auto z-50 py-5 md:py-15">
            <h2 className="text-xl font-semibold mb-4">
              Transactions by Month
            </h2>
            {Object.keys(transactionsByMonth).length > 0 ? (
              Object.entries(transactionsByMonth).map(
                ([month, monthTransactions]) => (
                  <div key={month} className="mb-8 overflow-x-auto">
                    <div className="flex flex-1 justify-between p-[2%]">
                      <h3 className="text-xl font-semibold mb-2">{month}</h3>
                      <p className="text-xl font-base">
                        $
                        {monthTransactions
                          .reduce(
                            (acc, transaction) =>
                              acc + (transaction.amount || 0),
                            0,
                          )
                          .toFixed(2)}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableBody>
                          {monthTransactions.map((transaction, index) => (
                            <TableRow key={index} className="rounded-2xl">
                              <TableCell>
                                {formatDate(transaction.currentDate || "")}
                              </TableCell>
                              <TableCell>{transaction.accountId}</TableCell>
                              <TableCell>{transaction.name}</TableCell>
                              <TableCell>
                                ${transaction.amount?.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="p-2">
                                  {transaction.personalFinanceCategoryPrimary}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ),
              )
            ) : (
              <p>No transactions available.</p>
            )}
          </SheetContent>
        </Sheet>
      </div>
      <div className="text-center mb-4">
        <div className="text-2xl font-bold">
          ${currentMonthExpense?.total} Spent This Month
        </div>
        {budgetedAmount && (
          <div className="text-sm text-[#4a90e2]">
            out of ${budgetedAmount} budgeted
          </div>
        )}
      </div>
      <div className="relative">
        {hasData ? (
          <BarChart
            currency="USD"
            data={data}
            height={300}
            locale="en-US"
            enableAssistantMode={false}
            enableComparison={false}
            disabled={disabled}
          />
        ) : (
          <p className="text-center text-muted-foreground">
            No chart data available
          </p>
        )}
      </div>
    </Card>
  );
};
