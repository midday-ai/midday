"use client";

import { cn } from "@midday/ui/cn";
import type { AnalysisResult } from "./mock-analysis";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AnalysisResultsCard({
  result,
}: {
  result: AnalysisResult;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Merchant Summary */}
      <div className="border border-border/40 shadow-sm rounded-lg p-6">
        <h2 className="text-base font-medium mb-4">Merchant Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoItem label="Business Name" value={result.merchantName} />
          <InfoItem label="Bank" value={result.bankName} />
          <InfoItem label="Account" value={result.accountNumber} mono />
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="border border-border/40 shadow-sm rounded-lg p-6">
        <h2 className="text-base font-medium mb-4">Monthly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                  Month
                </th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">
                  Deposits
                </th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">
                  Withdrawals
                </th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">
                  Net
                </th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">
                  Avg Daily Bal
                </th>
                <th className="text-right py-2 pl-4 font-medium text-muted-foreground">
                  NSFs
                </th>
              </tr>
            </thead>
            <tbody>
              {result.monthlyBreakdown.map((m) => (
                <tr
                  key={m.month}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="py-2.5 pr-4 text-foreground">{m.month}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-green-600">
                    {formatCurrency(m.totalDeposits)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-red-500">
                    {formatCurrency(m.totalWithdrawals)}
                  </td>
                  <td
                    className={cn(
                      "py-2.5 px-4 text-right font-mono",
                      m.net >= 0 ? "text-green-600" : "text-red-500",
                    )}
                  >
                    {formatCurrency(m.net)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {formatCurrency(m.avgDailyBalance)}
                  </td>
                  <td
                    className={cn(
                      "py-2.5 pl-4 text-right font-mono",
                      m.nsfCount > 0 ? "text-red-500" : "text-muted-foreground",
                    )}
                  >
                    {m.nsfCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Avg Monthly Revenue"
          value={formatCurrency(result.summary.avgMonthlyRevenue)}
        />
        <MetricCard
          label="Avg Daily Balance"
          value={formatCurrency(result.summary.avgDailyBalance)}
        />
        <MetricCard
          label="Total NSFs"
          value={String(result.summary.totalNsfCount)}
          alert={result.summary.totalNsfCount > 3}
        />
        <MetricCard
          label="Negative Balance Days"
          value={String(result.summary.negativeDays)}
          alert={result.summary.negativeDays > 5}
        />
      </div>

      {/* Buy Box Scorecard */}
      {result.buyBoxScorecard.length > 0 && (
        <div className="border border-border/40 shadow-sm rounded-lg p-6">
          <h2 className="text-base font-medium mb-4">Buy Box Scorecard</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                    Criterion
                  </th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">
                    Detected
                  </th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">
                    Threshold
                  </th>
                  <th className="text-right py-2 pl-4 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.buyBoxScorecard.map((item) => (
                  <tr
                    key={item.criterion}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="py-2.5 pr-4 text-foreground">
                      {item.criterion}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {item.detectedValue}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                      {item.threshold}
                    </td>
                    <td className="py-2.5 pl-4 text-right">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div
        className={cn(
          "border shadow-sm rounded-lg p-6",
          result.recommendation === "approve" &&
            "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900",
          result.recommendation === "decline" &&
            "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900",
          result.recommendation === "review" &&
            "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900",
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Recommendation
            </p>
            <p
              className={cn(
                "text-2xl font-semibold capitalize",
                result.recommendation === "approve" && "text-green-700 dark:text-green-400",
                result.recommendation === "decline" && "text-red-700 dark:text-red-400",
                result.recommendation === "review" && "text-amber-700 dark:text-amber-400",
              )}
            >
              {result.recommendation}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Confidence
            </p>
            <p className="text-2xl font-semibold font-mono">
              {result.confidenceScore}%
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <p className="text-sm text-muted-foreground">
            {result.recommendation === "approve" &&
              "This merchant meets your buy box criteria. Consider proceeding with the deal."}
            {result.recommendation === "decline" &&
              "This merchant does not meet several key criteria. Review the scorecard for details."}
            {result.recommendation === "review" &&
              "Some criteria are borderline or failing. Manual review is recommended before proceeding."}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("text-sm mt-0.5", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="border border-border/40 shadow-sm rounded-lg p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-xl font-semibold font-mono mt-1",
          alert && "text-red-500",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: "pass" | "fail" | "borderline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        status === "pass" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        status === "fail" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        status === "borderline" &&
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      )}
    >
      {status === "pass" && "Pass"}
      {status === "fail" && "Fail"}
      {status === "borderline" && "Borderline"}
    </span>
  );
}
