"use client";

import type { ExpenseCanvasData } from "@api/ai/canvas/expense-canvas-tool";
import { formatAmount } from "@midday/utils/format";
import {
  BaseCanvasComponent,
  type BaseCanvasProps,
  SummarySection,
} from "./base-canvas-component";

interface ExpenseAnalysisCanvasProps extends BaseCanvasProps<any> {
  canvasData: ExpenseCanvasData;
}

// Main expense analysis canvas matching the provided design
export function ExpenseAnalysisCanvas({
  canvasData,
}: ExpenseAnalysisCanvasProps) {
  return (
    <BaseCanvasComponent
      canvasData={canvasData}
      loadingSections={[
        { name: "Biggest Transactions", rows: 6, height: "h-12" },
        { name: "Spending Metrics", rows: 2, height: "h-20" },
        { name: "Summary & Recommendations", rows: 4, height: "h-4" },
      ]}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-foreground">Spending</h1>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

        {/* Biggest Transactions Table */}
        <BiggestTransactionsTable data={canvasData.data} />

        {/* Spending Metrics */}
        <SpendingMetrics data={canvasData.data} />

        {/* Summary & Recommendations */}
        <SummarySection summary={canvasData.data.summary} />
      </div>
    </BaseCanvasComponent>
  );
}

function BiggestTransactionsTable({ data }: { data: any }) {
  if (!data?.transactions) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Biggest transactions
        </h2>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View all transactions
        </button>
      </div>

      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Vendor
              </th>
              <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                Category
              </th>
              <th className="text-right py-3 text-sm font-medium text-muted-foreground">
                Amount
              </th>
              <th className="text-right py-3 text-sm font-medium text-muted-foreground">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.slice(0, 6).map((transaction: any) => (
              <tr
                key={
                  transaction.id || `${transaction.vendor}-${transaction.date}`
                }
                className="border-b border-border last:border-b-0"
              >
                <td className="py-4 text-sm text-muted-foreground">
                  {transaction.date}
                </td>
                <td className="py-4 text-sm font-medium text-foreground">
                  {transaction.vendor}
                </td>
                <td className="py-4 text-sm text-muted-foreground">
                  {transaction.category}
                </td>
                <td className="py-4 text-sm font-medium text-foreground text-right">
                  {formatAmount({
                    amount: transaction.amount,
                    currency: data.currency,
                  })}
                </td>
                <td className="py-4 text-sm text-muted-foreground text-right">
                  {transaction.share}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SpendingMetrics({ data }: { data: any }) {
  if (!data) return null;

  const totalSpending =
    data.transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

  const topCategory = data.transactions?.[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Spending this month */}
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Spending this month
        </h3>
        <div className="text-2xl font-semibold text-foreground mb-1">
          {formatAmount({
            amount: totalSpending,
            currency: data.currency,
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          Across {data.transactions?.length || 0} high-value transactions
        </p>
      </div>

      {/* Top category */}
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Top category
        </h3>
        <div className="text-2xl font-semibold text-foreground mb-1">
          {topCategory?.category} —{" "}
          {formatAmount({
            amount: topCategory?.amount || 0,
            currency: data.currency,
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          Largest share of monthly spend
        </p>
      </div>
    </div>
  );
}
