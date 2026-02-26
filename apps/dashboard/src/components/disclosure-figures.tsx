"use client";

import type { DisclosureFigures } from "@midday/disclosures/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatPercent(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  bi_weekly: "Bi-Weekly",
  monthly: "Monthly",
};

type DisclosureFiguresDisplayProps = {
  figures: DisclosureFigures;
};

export function DisclosureFiguresDisplay({
  figures,
}: DisclosureFiguresDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Financing Terms */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">
          Financing Terms
        </h4>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <tbody>
              <Row
                label="Amount Financed"
                value={formatCurrency(figures.fundingAmount)}
              />
              <Row
                label="Total Repayment Amount"
                value={formatCurrency(figures.totalRepaymentAmount)}
              />
              <Row
                label="Finance Charge"
                value={formatCurrency(figures.financeCharge)}
              />
              <Row
                label="Annual Percentage Rate (APR)"
                value={formatPercent(figures.annualPercentageRate)}
                highlight
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Schedule */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">
          Payment Schedule
        </h4>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <tbody>
              <Row
                label={`${frequencyLabels[figures.paymentFrequency] || figures.paymentFrequency} Payment`}
                value={formatCurrency(figures.paymentAmount)}
              />
              <Row
                label="Number of Payments"
                value={figures.numberOfPayments.toString()}
              />
              <Row
                label="Term Length"
                value={`${figures.termLengthDays} days`}
              />
              <Row
                label="Average Monthly Cost"
                value={formatCurrency(figures.averageMonthlyCost)}
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Info */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">
          Additional Information
        </h4>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <tbody>
              <Row
                label="Cents on the Dollar"
                value={figures.centsOnDollar.toString()}
              />
              {figures.totalFees > 0 && (
                <Row
                  label="Total Fees"
                  value={formatCurrency(figures.totalFees)}
                />
              )}
              {figures.feeBreakdown.map((fee) => (
                <Row
                  key={fee.name}
                  label={`  ${fee.name}`}
                  value={formatCurrency(fee.amount)}
                  muted
                />
              ))}
              {figures.prepaymentSavingsEstimate !== null && (
                <Row
                  label="Est. Prepayment Savings (midpoint)"
                  value={formatCurrency(figures.prepaymentSavingsEstimate)}
                />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata */}
      <p className="text-xs text-muted-foreground">
        Calculated at {new Date(figures.calculatedAt).toLocaleString()} |
        Engine v{figures.calculationVersion}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <tr className="border-b last:border-0">
      <td
        className={`px-3 py-2 ${muted ? "text-muted-foreground pl-6" : "text-foreground"}`}
      >
        {label}
      </td>
      <td
        className={`px-3 py-2 text-right font-mono ${highlight ? "font-semibold text-foreground" : "text-foreground"}`}
      >
        {value}
      </td>
    </tr>
  );
}
